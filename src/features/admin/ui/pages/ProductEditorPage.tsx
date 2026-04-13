"use client";

import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn, Button } from "@heroui/react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { getSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import { formatCOP } from "@/src/shared/presentation/ui";

import { getAdminBootstrapSql, useAdminAccess } from "../client/useAdminAccess";
import { slugify } from "../client/slugify";

type PendingImageUpload = {
    id: string;
    file: File;
    previewUrl: string;
};

function getProductImagesBucket(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";
}

function guessFileExtension(file: File): string {
    const byName = (file.name.split(".").pop() || "").toLowerCase();
    if (byName && byName.length <= 6) return byName;

    const t = file.type.toLowerCase();
    if (t === "image/jpeg") return "jpg";
    if (t === "image/png") return "png";
    if (t === "image/webp") return "webp";
    if (t === "image/gif") return "gif";
    return "bin";
}

async function uploadProductImage(params: {
    supabase: ReturnType<typeof getSupabaseBrowserClient>;
    productId: string;
    productSlug: string;
    file: File;
}): Promise<string> {
    const { supabase, productId, productSlug, file } = params;
    if (!supabase) throw new Error("Supabase no está configurado.");

    const bucket = getProductImagesBucket();
    const ext = guessFileExtension(file);
    const safeName = slugify(file.name.replace(/\.[^/.]+$/, "")).slice(0, 60) || "image";
    const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
    const path = `products/${productId}/${uuid}-${productSlug}-${safeName}.${ext}`;

    const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (upErr) throw upErr;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (!data?.publicUrl) {
        throw new Error(
            `La imagen se subió pero no se pudo obtener public URL. Verifica que el bucket '${bucket}' sea público o ajusta la estrategia de URL.`
        );
    }

    return data.publicUrl;
}

type CategoryRow = { id: string; parent_id: string | null; name: string; slug: string };

type DbProductRow = {
    id: string;
    legacy_product_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    status: string;
    is_published: boolean;
    base_price_cents: number;
    compare_at_price_cents: number | null;
    primary_image_url: string | null;
    attributes: unknown;
};

type DbVariantRow = { id: string; sku: string | null; is_default: boolean; option_values: Record<string, string> };
type DbInventoryRow = { variant_id: string; stock_on_hand: number; low_stock_threshold: number };
type DbProductImageRow = { url: string; alt_text: string | null; position: number };
type DbProductCategoryRow = { category_id: string; is_primary: boolean };

function parseAttributes(obj: unknown): Record<string, unknown> {
    if (!obj || typeof obj !== "object") return {};
    return obj as Record<string, unknown>;
}

type VariantForm = {
    id?: string;
    sku: string;
    color?: string;
    size?: string;
    stock: string;
    lowStock: string;
};

type SortableImageItemProps = {
    id: string;
    url: string;
    isPending: boolean;
    onRemove: () => void;
    disabled: boolean;
};

function SortableImageItem({ id, url, isPending, onRemove, disabled }: SortableImageItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative aspect-square  overflow-hidden group cursor-grab active:cursor-grabbing",
                isDragging && "opacity-50 z-10"
            )}
            {...attributes}
            {...listeners}
        >
            <img src={url} alt="Preview" className="w-full h-full object-cover" />
            {isPending && (
                <div className="absolute bottom-1 left-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">
                    Nuevo
                </div>
            )}
            <button
                className="absolute top-1 right-1 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                disabled={disabled}
            >
                <X size={12} />
            </button>
        </div>
    );
}

async function getNextLegacyProductId() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return 1;
    const { data, error } = await supabase
        .from("products")
        .select("legacy_product_id")
        .not("legacy_product_id", "is", null)
        .order("legacy_product_id", { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) return 1;
    const max = typeof data?.legacy_product_id === "number" ? data.legacy_product_id : 0;
    return max + 1;
}

export function ProductEditorPage({ params }: { params?: { id: string } }) {
    const access = useAdminAccess();
    const productId = params?.id ?? null;

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");

    const [categories, setCategories] = useState<CategoryRow[]>([]);

    const [form, setForm] = useState({
        legacy_product_id: "",
        name: "",
        slug: "",
        description: "",
        base_price: "",
        compare_at_price: "",
        sku: "",
        stock_on_hand: "0",
        low_stock_threshold: "0",
        badge: "",
    });

    type CategorySelection = {
        domId: string;
        parentId: string;
        subId: string;
        isPrimary: boolean;
    };
    const [selectedCategories, setSelectedCategories] = useState<CategorySelection[]>([
        { domId: "default", parentId: "", subId: "", isPrimary: true }
    ]);

    const [images, setImages] = useState<Array<{ url: string; isPending: boolean; pendingId?: string }>>([]);
    const [pendingImages, setPendingImages] = useState<PendingImageUpload[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [slugEditedManually, setSlugEditedManually] = useState(false);
    const [skuEditedManually, setSkuEditedManually] = useState(false);

    const [variantType, setVariantType] = useState<"color" | "size" | "both">("both");
    const [variants, setVariants] = useState<VariantForm[]>([]);
    const [newVariant, setNewVariant] = useState<VariantForm>({
        sku: "",
        color: "#000000",
        size: "",
        stock: "0",
        lowStock: "0",
    });

    const derivedSlug = useMemo(() => slugify(form.name), [form.name]);
    const derivedSKU = useMemo(() => form.name.trim() ? slugify(form.name).toUpperCase().replace(/-/g, '').slice(0, 10) : '', [form.name]);
    useEffect(() => {
        if (form.name.trim() && !slugEditedManually) {
            setForm((p) => ({ ...p, slug: derivedSlug }));
        }
    }, [derivedSlug, form.name, slugEditedManually]);

    useEffect(() => {
        if (form.name.trim() && !skuEditedManually) {
            setForm((p) => ({ ...p, sku: derivedSKU }));
        }
    }, [derivedSKU, form.name, skuEditedManually]);

    const parentCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
    const getSubcategories = (parentId: string) => categories.filter((c) => c.parent_id === parentId);

    const sortableItems = useMemo(() => {
        return images.map((img, idx) => ({
            id: img.isPending ? `pending-${img.pendingId}` : `existing-${idx}`,
            url: img.url,
            isPending: img.isPending,
            removeFn: img.isPending ? () => removePendingImage(img.pendingId!) : () => removeImage(idx),
        }));
    }, [images]);

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = sortableItems.findIndex((item) => item.id === active.id);
            const newIndex = sortableItems.findIndex((item) => item.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newImages = arrayMove(images, oldIndex, newIndex);
                setImages(newImages);
            }
        }
    }

    async function loadCategories() {
        if (access.status !== "ready") return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        const { data, error } = await supabase
            .from("categories")
            .select("id,parent_id,name,slug")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("name", { ascending: true });
        if (!error) setCategories((data ?? []) as CategoryRow[]);
    }

    async function loadProduct() {
        setError("");
        setSuccess("");
        if (!productId) return;
        if (access.status !== "ready") return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        setLoading(true);
        try {
            const [{ data: prod, error: prodErr }, { data: imgs, error: imgsErr }, { data: cats, error: catsErr }, { data: variants, error: varErr }] = await Promise.all([
                supabase
                    .from("products")
                    .select("id,legacy_product_id,name,slug,description,status,is_published,base_price_cents,compare_at_price_cents,primary_image_url,attributes")
                    .eq("id", productId)
                    .single(),
                supabase
                    .from("product_images")
                    .select("url,alt_text,position")
                    .eq("product_id", productId)
                    .order("position", { ascending: true }),
                supabase
                    .from("product_categories")
                    .select("category_id,is_primary")
                    .eq("product_id", productId),
                supabase
                    .from("product_variants")
                    .select("id,sku,is_default,option_values")
                    .eq("product_id", productId)
                    .order("is_default", { ascending: false })
                    .limit(5),
            ]);

            if (prodErr) throw prodErr;
            if (imgsErr) throw imgsErr;
            if (catsErr) throw catsErr;
            if (varErr) throw varErr;

            const p = prod as DbProductRow;
            const attrs = parseAttributes(p.attributes);

            const productImages = (imgs ?? []) as DbProductImageRow[];
            const imageList = productImages.length > 0
                ? productImages.map((i) => ({ url: i.url, isPending: false }))
                : p.primary_image_url
                    ? [{ url: p.primary_image_url, isPending: false }]
                    : [];
            setImages(imageList);

            const pcats = (cats ?? []) as DbProductCategoryRow[];
            const loadedCats: CategorySelection[] = [];

            if (pcats && pcats.length > 0) {
                pcats.forEach((pc) => {
                    const cat = categories.find((c) => c.id === pc.category_id);
                    if (!cat) return;

                    const parentId = cat.parent_id || cat.id;
                    const subId = cat.parent_id ? cat.id : "";

                    loadedCats.push({
                        domId: crypto.randomUUID(),
                        parentId,
                        subId,
                        isPrimary: pc.is_primary
                    });
                });
            }

            // Ensure at least one row or default
            if (loadedCats.length === 0) {
                loadedCats.push({ domId: crypto.randomUUID(), parentId: "", subId: "", isPrimary: true });
            } else {
                // Ensure one is primary if DB somehow has none
                if (!loadedCats.some(c => c.isPrimary)) {
                    loadedCats[0].isPrimary = true;
                }
            }
            setSelectedCategories(loadedCats);

            const firstVariant = ((variants ?? []) as DbVariantRow[])[0] ?? null;
            let inventory: DbInventoryRow | null = null;
            if (firstVariant) {
                const { data: inv, error: invErr } = await supabase
                    .from("inventory_items")
                    .select("variant_id,stock_on_hand,low_stock_threshold")
                    .eq("variant_id", firstVariant.id)
                    .maybeSingle();
                if (invErr) throw invErr;
                inventory = (inv ?? null) as DbInventoryRow | null;
            }

            setForm({
                legacy_product_id: typeof p.legacy_product_id === "number" ? String(p.legacy_product_id) : "",
                name: p.name,
                slug: p.slug,
                description: p.description ?? "",
                base_price: String(p.base_price_cents / 100),
                compare_at_price: p.compare_at_price_cents ? String(p.compare_at_price_cents / 100) : "",
                sku: "", // Default SKU managed in variants now
                stock_on_hand: "0", // Default stock managed in variants now
                low_stock_threshold: "0",
                badge: typeof attrs.badge === "string" ? (attrs.badge as string) : "",
            });

            // Load variants
            const variantRows = (variants ?? []) as DbVariantRow[];
            const loadedVariants: VariantForm[] = [];

            for (const v of variantRows) {
                const { data: inv } = await supabase
                    .from("inventory_items")
                    .select("stock_on_hand,low_stock_threshold")
                    .eq("variant_id", v.id)
                    .maybeSingle();

                loadedVariants.push({
                    id: v.id,
                    sku: v.sku ?? "",
                    color: (v.option_values?.Color as string) ?? "#000000",
                    size: (v.option_values?.Size as string) ?? "",
                    stock: inv ? String(inv.stock_on_hand) : "0",
                    lowStock: inv ? String(inv.low_stock_threshold) : "0",
                });
            }
            setVariants(loadedVariants);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error cargando producto");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [access.status]);

    useEffect(() => {
        void loadProduct();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, access.status, categories.length]);

    useEffect(() => {
        if (access.status === "ready" && !productId && !form.legacy_product_id) {
            getNextLegacyProductId().then((nextId) => {
                setForm((p) => ({ ...p, legacy_product_id: String(nextId) }));
            }).catch(() => { });
        }
    }, [access.status, productId, form.legacy_product_id]);

    function removeImage(index: number) {
        setImages((prev) => prev.filter((_, i) => i !== index));
    }

    function removePendingImage(id: string) {
        setPendingImages((prev) => {
            const found = prev.find((p) => p.id === id);
            if (found) URL.revokeObjectURL(found.previewUrl);
            return prev.filter((p) => p.id !== id);
        });
        setImages((prev) => prev.filter((img) => !(img.isPending && img.pendingId === id)));
    }

    function addPendingFromFiles(list: FileList | null) {
        if (!list || list.length === 0) return;

        const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) {
            setError("Selecciona archivos de imagen (JPG/PNG/WebP).");
            return;
        }

        const newPending: PendingImageUpload[] = [];
        const newImagesUI: Array<{ url: string; isPending: boolean; pendingId: string }> = [];

        // Current files (pending) to check for dupes
        const currentFiles = pendingImages.map(p => `${p.file.name}-${p.file.size}`);

        for (const file of files) {
            const signature = `${file.name}-${file.size}`;
            if (currentFiles.includes(signature)) continue;

            // Check if similarly named pending in this batch
            if (newPending.some(p => `${p.file.name}-${p.file.size}` === signature)) continue;

            const id = crypto.randomUUID();
            const previewUrl = URL.createObjectURL(file);
            newPending.push({ id, file, previewUrl });
            newImagesUI.push({ url: previewUrl, isPending: true, pendingId: id });
        }

        if (newPending.length > 0) {
            setPendingImages(prev => [...prev, ...newPending]);
            setImages(prev => [...prev, ...newImagesUI]);
        }
    }

    useEffect(() => {
        return () => {
            for (const p of pendingImages) URL.revokeObjectURL(p.previewUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function save({ publish }: { publish: boolean }) {
        setError("");
        setSuccess("");
        if (access.status !== "ready") return;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        const name = form.name.trim();
        const baseSlug = (form.slug || slugify(name)).trim();
        if (!name || !baseSlug) {
            setError("Nombre y slug son obligatorios.");
            return;
        }

        const categoryId = selectedCategories.find(c => c.isPrimary)?.parentId || "";
        if (!selectedCategories.some(c => c.parentId)) {
            setError("Debes seleccionar al menos una categoría.");
            return;
        }

        const base = Number(form.base_price);
        if (!Number.isFinite(base) || base < 0) {
            setError("Precio Base inválido.");
            return;
        }

        const compare = form.compare_at_price.trim() ? Number(form.compare_at_price) : null;
        if (compare !== null && (!Number.isFinite(compare) || compare < 0)) {
            setError("Precio de comparación inválido.");
            return;
        }

        const variantStockTotal = variants.reduce((acc, v) => acc + Number(v.stock || 0), 0);
        // If variants exist, use their total. Otherwise use form stock (backup for legacy/simple)
        const totalStock = variants.length > 0 ? variantStockTotal : Number(form.stock_on_hand);

        const lowThr = Number(form.low_stock_threshold);
        if (!Number.isFinite(totalStock) || totalStock < 0 || !Number.isFinite(lowThr) || lowThr < 0) {
            setError("Stock / Alerta inválidos.");
            return;
        }

        if (publish && totalStock === 0) {
            setError("Para publicar necesitas stock > 0. Agrega variantes con stock.");
            return;
        }

        const legacyId = form.legacy_product_id.trim() ? Number(form.legacy_product_id) : null;
        if (legacyId !== null && (!Number.isFinite(legacyId) || !Number.isInteger(legacyId) || legacyId <= 0)) {
            setError("Legacy Product ID inválido (entero > 0).");
            return;
        }

        const sku = form.sku.trim() || derivedSKU;

        setSaving(true);
        try {
            const nextLegacy = legacyId ?? (productId ? null : await getNextLegacyProductId());

            const primaryCatRow = selectedCategories.find(c => c.isPrimary) || selectedCategories[0];
            const primaryParent = categories.find(c => c.id === primaryCatRow.parentId);
            const primarySub = categories.find(c => c.id === primaryCatRow.subId);

            const attributes = {
                ...(parseAttributes({})),
                category: primaryParent?.name ?? undefined,
                subcategory: primarySub?.name ?? undefined,
            } as Record<string, unknown>;

            const primaryImageUrl = images.find(img => !img.isPending)?.url ?? null;
            const status = publish ? "active" : "draft";
            const is_published = publish;

            let id = productId;
            // ensure slug uniqueness: append numeric suffix if collision
            const ensureUniqueSlug = async (candidate: string) => {
                let final = candidate;
                let attempt = 1;
                while (true) {
                    const { data: exists, error: exErr } = await supabase
                        .from("products")
                        .select("id")
                        .eq("slug", final)
                        .maybeSingle();
                    if (exErr) throw exErr;
                    if (!exists) break;
                    // if updating same product, allow same slug
                    if (id && exists.id === id) break;
                    final = `${candidate}-${attempt++}`;
                }
                return final;
            };
            // compute unique slug to use
            const candidateSlug = (form.slug || slugify(name)).trim();
            const finalSlug = await ensureUniqueSlug(candidateSlug);

            if (!id) {
                const { data: inserted, error: insErr } = await supabase
                    .from("products")
                    .insert({
                        legacy_product_id: nextLegacy,
                        name,
                        slug: finalSlug,
                        description: form.description.trim() || null,
                        status,
                        is_published,
                        base_price_cents: Math.round(base * 100),
                        compare_at_price_cents: compare !== null ? Math.round(compare * 100) : null,
                        primary_image_url: primaryImageUrl,
                        badge: form.badge.trim() || null,
                        attributes,
                    })
                    .select("id")
                    .single();
                if (insErr) throw insErr;
                id = inserted.id as string;
            } else {
                const payload: Partial<DbProductRow> & Record<string, unknown> = {
                    name,
                    slug: finalSlug,
                    description: form.description.trim() || null,
                    status,
                    is_published,
                    base_price_cents: Math.round(base * 100),
                    compare_at_price_cents: compare !== null ? Math.round(compare * 100) : null,
                    primary_image_url: primaryImageUrl,
                    attributes,
                };
                if (legacyId !== null) payload.legacy_product_id = legacyId;

                const { error: updErr } = await supabase
                    .from("products")
                    .update(payload)
                    .eq("id", id);
                if (updErr) throw updErr;
            }

            // Categories mapping: replace rows
            await supabase.from("product_categories").delete().eq("product_id", id);

            const catRows: { product_id: string; category_id: string; is_primary: boolean }[] = [];

            // Deduplicate categories by ID
            const usedCatIds = new Set<string>();

            for (const item of selectedCategories) {
                // Use subId if present, else parentId
                const targetId = item.subId || item.parentId;
                if (!targetId) continue;

                if (usedCatIds.has(targetId)) continue;
                usedCatIds.add(targetId);

                catRows.push({
                    product_id: id,
                    category_id: targetId,
                    is_primary: item.isPrimary,
                });
            }

            if (catRows.length > 0) {
                const { error: pcErr } = await supabase.from("product_categories").insert(catRows);
                if (pcErr) throw pcErr;
            }

            // Upload pending images (if any) then persist image rows
            let uploadedUrls: string[] = [];
            if (pendingImages.length > 0) {
                setUploadingImages(true);
                try {
                    // Deduplicate pending files by name+size to avoid double uploads
                    const uniqueMap = new Map<string, PendingImageUpload>();
                    for (const p of pendingImages) {
                        const key = `${p.file.name}:${p.file.size}`;
                        if (!uniqueMap.has(key)) uniqueMap.set(key, p);
                    }
                    const uniquePending = Array.from(uniqueMap.values());

                    uploadedUrls = await Promise.all(
                        uniquePending.map((p) =>
                            uploadProductImage({
                                supabase,
                                productId: id,
                                productSlug: finalSlug,
                                file: p.file,
                            })
                        )
                    );
                } finally {
                    setUploadingImages(false);
                }
            }

            const nextImages = [...uploadedUrls, ...images.filter(img => !img.isPending).map(img => img.url)].filter(Boolean);
            // Deduplicate by URL while preserving order
            const uniqNextImages: string[] = [];
            for (const u of nextImages) {
                if (!u) continue;
                if (!uniqNextImages.includes(u)) uniqNextImages.push(u);
            }
            const nextPrimary = uniqNextImages[0] ?? null;
            if (nextPrimary !== primaryImageUrl) {
                const { error: primErr } = await supabase
                    .from("products")
                    .update({ primary_image_url: nextPrimary })
                    .eq("id", id);
                if (primErr) throw primErr;
            }

            await supabase.from("product_images").delete().eq("product_id", id);
            if (uniqNextImages.length > 0) {
                const imageRows = uniqNextImages.map((url, position) => ({ product_id: id, url, position }));
                const { error: imgErr } = await supabase.from("product_images").insert(imageRows);
                if (imgErr) throw imgErr;
            }

            if (pendingImages.length > 0) {
                // cleanup previews + clear pending queue
                for (const p of pendingImages) URL.revokeObjectURL(p.previewUrl);
                setPendingImages([]);
            }
            setImages(uniqNextImages.map((url) => ({ url, isPending: false })));

            // Variations Upsert
            const currentVariantIds = new Set<string>();

            // If no variants added, create at least a default one if needed, or handle as error?
            // For now, let's assume we want at least one variant or just save what we have.
            // If user didn't add variants, we might want to preserve the "Default" behavior or require variants.
            // Given the requirement "pon solo un select con color and size", we imply explicit variants.

            if (variants.length === 0) {
                // If no variants, maybe create a default placeholder? 
                // Or just error out? The prompt implies an editor.
                // Let's allow saving without variants but warn or just save basic product.
            }

            for (const v of variants) {
                // Determine parts for SKU and option_values based on VALIDITY (presence)
                const parts: string[] = [];
                const option_values: Record<string, string> = {};

                if (v.size && v.size.trim()) {
                    parts.push(v.size);
                    option_values.Size = v.size;
                }
                if (v.color) {
                    parts.push(v.color.replace("#", ""));
                    option_values.Color = v.color;
                }

                let finalSKU = v.sku.trim();

                if (!finalSKU) {
                    if (parts.length > 0) {
                        finalSKU = `${finalSlug}-${parts.join("-")}`.toUpperCase().slice(0, 20);
                    } else {
                        // Fallback if no specific attributes (shouldn't happen with UI validation but safe to handle)
                        finalSKU = `${finalSlug}-STD`.toUpperCase().slice(0, 20);
                    }
                }

                // Ensure SKU unique in DB
                const ensureUniqueSKU = async (candidate: string) => {
                    let final = candidate;
                    let attempt = 1;
                    while (true) {
                        const { data: exists, error: exErr } = await supabase
                            .from("product_variants")
                            .select("id")
                            .eq("sku", final)
                            .maybeSingle();
                        if (exErr) throw exErr;
                        if (!exists) break;
                        if (v.id && exists.id === v.id) break;
                        final = `${candidate}-${attempt++}`;
                    }
                    return final;
                };
                finalSKU = await ensureUniqueSKU(finalSKU);

                // Title generation
                let title = "Variante";
                if (option_values.Size && option_values.Color) title = `${name} (${option_values.Size} - ${option_values.Color})`;
                else if (option_values.Size) title = `${name} (${option_values.Size})`;
                else if (option_values.Color) title = `${name} (${option_values.Color})`;
                else title = name; // Fallback

                let variantId = v.id;

                console.log('🔧 Processing variant:', {
                    isUpdate: !!variantId,
                    variantId,
                    sku: finalSKU,
                    optionValues: option_values
                });

                if (variantId) {
                    // Try to update existing variant
                    const { data: updateData, error: vUpdErr, count } = await supabase
                        .from("product_variants")
                        .update({
                            sku: finalSKU,
                            title,
                            option_values,
                            price_cents: Math.round(base * 100),
                            is_active: true
                        })
                        .eq("id", variantId)
                        .select("id");

                    if (vUpdErr) {
                        console.error('❌ Variant update error:', vUpdErr);
                        throw vUpdErr;
                    }

                    // Check if the update actually affected any rows
                    if (!updateData || updateData.length === 0) {
                        console.warn('⚠️ Variant update affected 0 rows, variant may not exist:', variantId);
                        console.log('🔄 Creating new variant instead...');

                        // Variant doesn't exist, create a new one
                        const { data: vIns, error: vInsErr } = await supabase
                            .from("product_variants")
                            .insert({
                                product_id: id,
                                sku: finalSKU,
                                title,
                                option_values,
                                price_cents: Math.round(base * 100),
                                is_active: true,
                                is_default: false,
                            })
                            .select("id")
                            .single();

                        if (vInsErr) {
                            console.error('❌ Variant insert error (fallback):', vInsErr);
                            throw vInsErr;
                        }

                        if (!vIns?.id) {
                            console.error('❌ Variant insert succeeded but no ID returned:', vIns);
                            throw new Error('Variant created but no ID returned from database');
                        }

                        variantId = vIns.id;
                        console.log('✅ Variant created (fallback):', variantId);
                    } else {
                        console.log('✅ Variant updated:', variantId);
                    }
                } else {
                    const { data: vIns, error: vInsErr } = await supabase
                        .from("product_variants")
                        .insert({
                            product_id: id,
                            sku: finalSKU,
                            title,
                            option_values,
                            price_cents: Math.round(base * 100),
                            is_active: true,
                            is_default: false,
                        })
                        .select("id")
                        .single();
                    if (vInsErr) {
                        console.error('❌ Variant insert error:', vInsErr);
                        throw vInsErr;
                    }
                    if (!vIns?.id) {
                        console.error('❌ Variant insert succeeded but no ID returned:', vIns);
                        throw new Error('Variant created but no ID returned from database');
                    }
                    variantId = vIns.id;
                    console.log('✅ Variant created:', variantId);
                }

                if (variantId) {
                    // Verify the variant actually exists in the database before creating inventory
                    const { data: variantCheck, error: checkErr } = await supabase
                        .from("product_variants")
                        .select("id")
                        .eq("id", variantId)
                        .maybeSingle();

                    if (checkErr) {
                        console.error('❌ Error verifying variant exists:', checkErr);
                        throw new Error(`Error verificando variante: ${checkErr.message}`);
                    }

                    if (!variantCheck) {
                        console.error('❌ Variant does not exist in database:', {
                            variantId,
                            wasUpdate: !!v.id,
                            sku: finalSKU
                        });
                        throw new Error(`La variante ${variantId} no existe en la base de datos. No se puede crear inventario.`);
                    }

                    console.log('✅ Variant verified exists in database:', variantId);

                    currentVariantIds.add(variantId);
                    // Inventory - explicitly specify onConflict to handle primary key properly
                    const inventoryData = {
                        variant_id: variantId,
                        track_inventory: true,
                        stock_on_hand: Math.round(Number(v.stock)),
                        reserved: 0,
                        low_stock_threshold: Math.round(Number(v.lowStock)),
                    };

                    console.log('📦 Upserting inventory for variant:', {
                        variantId,
                        sku: v.sku,
                        inventoryData
                    });

                    const { error: invErr } = await supabase
                        .from("inventory_items")
                        .upsert(inventoryData, {
                            onConflict: 'variant_id'
                        });

                    if (invErr) {
                        console.error('❌ Inventory upsert error:', {
                            error: invErr,
                            message: invErr.message,
                            details: invErr.details,
                            hint: invErr.hint,
                            code: invErr.code,
                            variantId,
                            inventoryData
                        });
                        throw new Error(`Error guardando inventario para variante ${v.sku || variantId}: ${invErr.message} (${invErr.code})${invErr.hint ? ` - ${invErr.hint}` : ''}`);
                    }

                    console.log('✅ Inventory upserted successfully for variant:', variantId);
                }
            }

            // Delete removed variants
            if (productId) {
                // Get all current variants for this product
                const { data: allVars } = await supabase.from("product_variants").select("id").eq("product_id", id);
                if (allVars) {
                    const toDelete = allVars.filter(v => !currentVariantIds.has(v.id)).map(v => v.id);
                    if (toDelete.length > 0) {
                        await supabase.from("product_variants").delete().in("id", toDelete);
                    }
                }
            }

            // Update form with potentially new IDs? Maybe reload product or just rely on success message.


            setSuccess(publish ? "Producto publicado." : "Borrador guardado.");
            setForm((p) => ({ ...p, slug: finalSlug || (form.slug || slugify(form.name)).trim() }));
            if (!productId) {
                setForm((p) => ({ ...p, legacy_product_id: nextLegacy ? String(nextLegacy) : p.legacy_product_id }));
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error guardando producto");
        } finally {
            setSaving(false);
        }
    }

    if (access.status === "missing-env") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Editor de Producto</h2>
                <p className="mt-2 text-sm text-gray-600">{access.message}</p>
            </div>
        );
    }

    if (access.status === "loading") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-600">Cargando…</p>
            </div>
        );
    }

    if (access.status === "unauthenticated") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Editor de Producto</h2>
                <p className="mt-2 text-sm text-gray-600">Inicia sesión para acceder al panel de admin.</p>
                <p className="mt-2 text-xs text-gray-400">Usa el login del storefront (header).</p>
            </div>
        );
    }

    if (access.status === "forbidden") {
        return (
            <div className=" bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-normal">Editor de Producto</h2>
                <p className="mt-2 text-sm text-gray-600">Tu usuario no tiene permisos de admin.</p>
                <p className="mt-4 text-xs text-gray-500">Ejecuta esto en Supabase SQL Editor:</p>
                <pre className="mt-2  bg-gray-50 p-4 text-xs overflow-auto">{getAdminBootstrapSql(access.userId)}</pre>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products" className="p-2 rounded-full hover:bg-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h2 className="text-2xl font-normal">{productId ? "Editar Producto" : "Crear Producto"}</h2>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="lg"
                        radius="full"
                        className="bg-zinc-100 text-black"
                        isDisabled={saving}
                        onPress={() => void save({ publish: false })}
                    >
                        Guardar Borrador
                    </Button>
                    <Button
                        size="lg"
                        radius="full"
                        className="bg-black text-white"
                        isDisabled={saving}
                        onPress={() => void save({ publish: true })}
                    >
                        Publicar Producto
                    </Button>
                </div>
            </div>

            {loading && (
                <div className=" bg-white p-6 shadow-sm text-sm text-gray-600">Cargando producto…</div>
            )}

            {error && (
                <div className=" border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className=" border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className=" bg-white p-6 shadow-sm space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">Nombre del Producto</label>
                            <input
                                type="text"
                                placeholder="Ej: Camiseta Oversize"
                                value={form.name}
                                onChange={(e) => {
                                    setSlugEditedManually(false);
                                    setSkuEditedManually(false);
                                    setForm((p) => ({ ...p, name: e.target.value }));
                                }}
                                className="w-full h-12 px-4  bg-gray-50 border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">Slug</label>
                            <input
                                type="text"
                                placeholder="slug-producto"
                                value={form.slug}
                                onChange={(e) => {
                                    setSlugEditedManually(true);
                                    setForm((p) => ({ ...p, slug: e.target.value }));
                                }}
                                className="w-full h-12 px-4  bg-gray-50 border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">Descripción</label>
                            <textarea
                                rows={5}
                                placeholder="Descripción del producto..."
                                value={form.description}
                                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                className="w-full p-4  bg-gray-50 border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">ID Producto Legado</label>
                                <input
                                    type="number"
                                    placeholder="(auto)"
                                    value={form.legacy_product_id}
                                    onChange={(e) => setForm((p) => ({ ...p, legacy_product_id: e.target.value }))}
                                    className="w-full h-12 px-4  bg-gray-50 border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all"
                                />
                                <p className="text-xs text-gray-400 ml-1">Usado por el storefront para rutas numéricas.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Etiqueta (opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Nuevo / Limited / Sale"
                                    value={form.badge}
                                    onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))}
                                    className="w-full h-12 px-4  bg-gray-50 border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Images */}
                    <div className=" bg-white p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium ml-1">Images</label>
                            <span className="text-xs text-gray-400">La primera imagen queda como cover</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => addPendingFromFiles(e.target.files)}
                                className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:opacity-90"
                                disabled={saving || uploadingImages}
                            />
                            {(saving || uploadingImages) && (
                                <span className="text-xs text-gray-500 whitespace-nowrap">Subiendo…</span>
                            )}
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={sortableItems.map(item => item.id)} strategy={rectSortingStrategy}>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                    {sortableItems.map((item) => (
                                        <SortableImageItem
                                            key={item.id}
                                            id={item.id}
                                            url={item.url}
                                            isPending={item.isPending}
                                            onRemove={item.removeFn}
                                            disabled={item.isPending && uploadingImages}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                        <p className="text-xs text-gray-400">
                            Selecciona imágenes y se subirán a Supabase Storage al guardar/publicar.
                        </p>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className=" bg-white p-6 shadow-sm space-y-6">
                        <h3 className="text-lg font-normal">Organización</h3>
                        <div className="space-y-4">
                            {selectedCategories.map((cat, idx) => {
                                const isRemovable = selectedCategories.length > 1;
                                return (
                                    <div key={cat.domId} className="p-4 bg-gray-50  space-y-3 relative border border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${cat.isPrimary ? "border-black bg-black" : "border-gray-300 bg-white"}`}>
                                                    {cat.isPrimary && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                </div>
                                                <input
                                                    type="radio"
                                                    name="primary_category"
                                                    className="hidden"
                                                    checked={cat.isPrimary}
                                                    onChange={() => {
                                                        setSelectedCategories(prev => prev.map((p, i) => ({ ...p, isPrimary: i === idx })));
                                                    }}
                                                />
                                                <span className={`text-xs font-medium ${cat.isPrimary ? "text-black" : "text-gray-500"}`}>
                                                    {cat.isPrimary ? "Categoría Principal" : "Secundaria"}
                                                </span>
                                            </label>
                                            {isRemovable && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedCategories(prev => {
                                                            const next = prev.filter((_, i) => i !== idx);
                                                            // If we removed the primary, make the first one primary
                                                            if (cat.isPrimary && next.length > 0) {
                                                                next[0].isPrimary = true;
                                                            }
                                                            return next;
                                                        });
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <select
                                                value={cat.parentId}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setSelectedCategories(prev => {
                                                        const next = [...prev];
                                                        next[idx] = { ...next[idx], parentId: val, subId: "" };
                                                        return next;
                                                    });
                                                }}
                                                className="w-full h-10 px-3 rounded-xl bg-white border-transparent focus:ring-1 focus:ring-black outline-none transition-all appearance-none cursor-pointer text-sm"
                                            >
                                                <option value="">Seleccionar Categoría</option>
                                                {parentCategories.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <select
                                                value={cat.subId}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setSelectedCategories(prev => {
                                                        const next = [...prev];
                                                        next[idx] = { ...next[idx], subId: val };
                                                        return next;
                                                    });
                                                }}
                                                className="w-full h-10 px-3 rounded-xl bg-white border-transparent focus:ring-1 focus:ring-black outline-none transition-all appearance-none cursor-pointer text-sm disabled:opacity-50"
                                                disabled={!cat.parentId}
                                            >
                                                <option value="">Seleccionar Sub-cat</option>
                                                {getSubcategories(cat.parentId).map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}

                            <Button
                                size="sm"
                                variant="flat"
                                className="w-full"
                                onPress={() => {
                                    setSelectedCategories(prev => [
                                        ...prev,
                                        { domId: crypto.randomUUID(), parentId: "", subId: "", isPrimary: false }
                                    ]);
                                }}
                            >
                                + Agregar otra categoría
                            </Button>
                        </div>
                    </div>

                    <div className=" bg-white p-6 shadow-sm space-y-6">
                        <h3 className="text-lg font-normal">Precios</h3>
                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">Precio Base</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={form.base_price}
                                    onChange={(e) => setForm((p) => ({ ...p, base_price: e.target.value }))}
                                    className="w-full h-12 pl-8 pr-4  bg-gray-50 border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all"
                                />
                            </div>
                            {form.base_price && Number.isFinite(Number(form.base_price)) && (
                                <p className="text-xs text-gray-400 ml-1">Preview: {formatCOP(Math.round(Number(form.base_price) * 100))}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">Precio Anterior (opcional)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={form.compare_at_price}
                                    onChange={(e) => setForm((p) => ({ ...p, compare_at_price: e.target.value }))}
                                    className="w-full h-12 pl-8 pr-4  bg-gray-50 border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className=" bg-white p-6 shadow-sm space-y-6">
                        <h3 className="text-lg font-normal">Variantes</h3>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500">Tipo de variante:</span>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setVariantType("color")}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${variantType === "color" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"}`}
                                    >
                                        Solo Color
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVariantType("size")}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${variantType === "size" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"}`}
                                    >
                                        Solo Talla
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVariantType("both")}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${variantType === "both" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"}`}
                                    >
                                        Color + Talla
                                    </button>
                                </div>
                            </div>

                            {/* New Variant Form */}
                            <div className="p-5 bg-gray-50  space-y-5 border border-gray-100">
                                <div className="grid grid-cols-2 gap-4">
                                    {(variantType === "color" || variantType === "both") && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium ml-1">Color</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={newVariant.color || "#000000"}
                                                    onChange={(e) => setNewVariant(p => ({ ...p, color: e.target.value }))}
                                                    className="h-10 w-10 p-0 border-0 rounded-full cursor-pointer shrink-0"
                                                />
                                                <div className="flex-1">
                                                    <div className="text-xs text-gray-500 uppercase font-mono tracking-wider tabular-nums">
                                                        {newVariant.color || "#000000"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {(variantType === "size" || variantType === "both") && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium ml-1">Talla</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: S, M, L, XL (separa con comas)"
                                                value={newVariant.size || ""}
                                                onChange={(e) => setNewVariant(p => ({ ...p, size: e.target.value }))}
                                                className="w-full h-10 px-3 rounded-xl bg-white border-transparent focus:ring-1 focus:ring-black outline-none transition-all text-sm shadow-sm"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium ml-1">Stock</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={newVariant.stock}
                                            onChange={(e) => setNewVariant(p => ({ ...p, stock: e.target.value }))}
                                            className="w-full h-10 px-3 rounded-xl bg-white border-transparent focus:ring-1 focus:ring-black outline-none transition-all text-sm shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium ml-1">SKU <span className="text-gray-400 font-normal">(Auto)</span></label>
                                        <input
                                            type="text"
                                            placeholder="Dejar vacío para auto-generar"
                                            value={newVariant.sku}
                                            onChange={(e) => setNewVariant(p => ({ ...p, sku: e.target.value }))}
                                            className="w-full h-10 px-3 rounded-xl bg-white border-transparent focus:ring-1 focus:ring-black outline-none transition-all text-sm shadow-sm"
                                        />
                                    </div>
                                </div>

                                <Button
                                    size="md"
                                    radius="full"
                                    className="bg-black text-white w-full font-medium"
                                    onPress={() => {
                                        const hasColor = variantType === "color" || variantType === "both";
                                        const hasSize = variantType === "size" || variantType === "both";

                                        if (hasColor && !newVariant.color) return; // Should have default but check
                                        if (hasSize && !newVariant.size?.trim()) return;

                                        // Split comma-separated sizes
                                        const inputSize = hasSize ? newVariant.size?.trim() : "";
                                        const sizes = inputSize
                                            ? inputSize.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                                            : [""];

                                        // Calculate stock per variant
                                        const totalStock = Number(newVariant.stock) || 0;
                                        const stockPerVariant = sizes.length > 1
                                            ? Math.floor(totalStock / sizes.length)
                                            : totalStock;

                                        // Create variants for each size
                                        const newVariants: VariantForm[] = sizes.map(size => ({
                                            ...newVariant,
                                            id: crypto.randomUUID(),
                                            color: hasColor ? (newVariant.color || "#000000") : undefined,
                                            size: hasSize ? size : undefined,
                                            stock: String(stockPerVariant),
                                        }));

                                        setVariants(prev => [...prev, ...newVariants]);
                                        setNewVariant({
                                            sku: "",
                                            color: "#000000",
                                            size: "",
                                            stock: "0",
                                            lowStock: "0"
                                        });
                                    }}
                                >
                                    Agregar Variante
                                </Button>
                            </div>
                        </div>

                        {/* Variants List */}
                        <div className="space-y-3">
                            {variants.map((v, i) => (
                                <div key={v.id || i} className="flex items-center justify-between p-3 bg-gray-50 ">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full border border-gray-200" style={{ backgroundColor: v.color }} />
                                        <div>
                                            <p className="text-sm font-medium">{v.size}</p>
                                            <p className="text-xs text-gray-500">Stock: {v.stock} | SKU: {v.sku || "Auto"}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setVariants(prev => prev.filter((_, idx) => idx !== i))}
                                        className="p-2 text-gray-400 hover:text-red-500"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            {variants.length === 0 && (
                                <p className="text-xs text-gray-400 text-center py-2">No hay variantes agregadas.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
