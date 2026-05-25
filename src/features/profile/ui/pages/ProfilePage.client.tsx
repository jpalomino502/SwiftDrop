"use client";

import {
  CreditCard,
  Edit3,
  ExternalLink,
  LogOut,
  MapPin,
  Package,
  Plus,
  Trash2,
  Settings,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, Checkbox, Input, Modal, ModalBody, ModalContent, ModalHeader, Avatar } from "@heroui/react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";

import { AuthModal } from "@/src/features/auth";
import {
  getSupabaseBrowserClient,
  getSupabaseMissingEnvMessage,
} from "@/src/lib/supabase/browser";

type TabId = "pedidos" | "direcciones" | "detalles";

type CustomerRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  phone: string | null;
};

type AddressRow = {
  id: string;
  customer_id: string;
  label: string | null;
  is_default: boolean;
  name: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string;
};

type OrderRow = {
  id: string;
  order_number: number;
  created_at: string;
  status:
  | "pending"
  | "processing"
  | "paid"
  | "fulfilled"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
  total_cents: number;
  currency: string;
};

function formatMoney(amountCents: number, currency: string) {
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toHumanOrderStatus(status: OrderRow["status"]): "Entregado" | "Cancelado" | "Procesando" {
  switch (status) {
    case "delivered":
      return "Entregado";
    case "cancelled":
    case "refunded":
      return "Cancelado";
    default:
      return "Procesando";
  }
}

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabId>("pedidos");

  const [session, setSession] = useState<Session | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [supabaseReady, setSupabaseReady] = useState(true);

  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState<string>("");

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressRow | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: "Casa",
    is_default: false,
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postal_code: "",
    country: "España",
  });

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const userData = useMemo(
    () => {
      const user = session?.user;
      const email = user?.email ?? "";
      const fullName =
        typeof user?.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : "";

      const name = fullName || (email ? email.split("@")[0] : "Invitado");
      const avatar =
        typeof user?.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : "https://i.pravatar.cc/150?u=swiftdrop";

      return {
        name,
        email: email || "",
        memberSince: "",
        avatar,
        avatar_url: typeof user?.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : undefined
      };
    },
    [session],
  );

  useEffect(() => {
    // Keep editable fields in sync
    const fullName =
      customer?.full_name ??
      (typeof session?.user.user_metadata?.full_name === "string"
        ? session?.user.user_metadata.full_name
        : "");
    setProfileForm({
      fullName: fullName ?? "",
      phone: customer?.phone ?? "",
    });
  }, [customer, session]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setSupabaseReady(false);
      return;
    }

    setSupabaseReady(true);

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Load customer + related data when session is available
    async function run() {
      setCustomerError("");
      if (!session) {
        setCustomer(null);
        setOrders([]);
        setAddresses([]);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      setCustomerLoading(true);
      try {
        const userId = session.user.id;

        // 1) Load or create customer row (trigger should create it, but we keep a safe fallback)
        const { data: existing, error: existingErr } = await supabase
          .from("customers")
          .select("id,user_id,email,full_name,phone")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingErr) throw existingErr;

        let customerRow = existing as CustomerRow | null;
        if (!customerRow) {
          const { data: inserted, error: insertErr } = await supabase
            .from("customers")
            .insert({
              user_id: userId,
              email: session.user.email,
              full_name:
                typeof session.user.user_metadata?.full_name === "string"
                  ? session.user.user_metadata.full_name
                  : null,
            })
            .select("id,user_id,email,full_name,phone")
            .single();

          if (insertErr) throw insertErr;
          customerRow = inserted as CustomerRow;
        }

        setCustomer(customerRow);

        // 2) Orders
        setOrdersLoading(true);
        const { data: ordersData, error: ordersErr } = await supabase
          .from("orders")
          .select("id,order_number,created_at,status,total_cents,currency")
          .eq("customer_id", customerRow.id)
          .order("created_at", { ascending: false })
          .limit(50);
        if (ordersErr) throw ordersErr;
        setOrders((ordersData ?? []) as OrderRow[]);
        setOrdersLoading(false);

        // 3) Addresses
        setAddressesLoading(true);
        const { data: addrData, error: addrErr } = await supabase
          .from("customer_addresses")
          .select(
            "id,customer_id,label,is_default,name,phone,line1,line2,city,region,postal_code,country",
          )
          .eq("customer_id", customerRow.id)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: false });
        if (addrErr) throw addrErr;
        setAddresses((addrData ?? []) as AddressRow[]);
        setAddressesLoading(false);

      } catch (err) {
        const message = err instanceof Error ? err.message : "Error cargando tu cuenta";
        setCustomerError(message);
      } finally {
        setCustomerLoading(false);
        setOrdersLoading(false);
        setAddressesLoading(false);
      }
    }

    void run();
  }, [session]);

  function openNewAddressModal() {
    setEditingAddress(null);
    setAddressForm({
      label: "Casa",
      is_default: addresses.length === 0,
      name: profileForm.fullName,
      phone: profileForm.phone,
      line1: "",
      line2: "",
      city: "",
      region: "",
      postal_code: "",
      country: "España",
    });
    setAddressModalOpen(true);
  }

  function openEditAddressModal(address: AddressRow) {
    setEditingAddress(address);
    setAddressForm({
      label: address.label ?? "",
      is_default: address.is_default,
      name: address.name ?? "",
      phone: address.phone ?? "",
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city ?? "",
      region: address.region ?? "",
      postal_code: address.postal_code ?? "",
      country: address.country,
    });
    setAddressModalOpen(true);
  }

  async function saveAddress() {
    if (!session || !customer) {
      setAuthModalOpen(true);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const payload = {
      customer_id: customer.id,
      label: addressForm.label || null,
      is_default: addressForm.is_default,
      name: addressForm.name || null,
      phone: addressForm.phone || null,
      line1: addressForm.line1,
      line2: addressForm.line2 || null,
      city: addressForm.city || null,
      region: addressForm.region || null,
      postal_code: addressForm.postal_code || null,
      country: addressForm.country,
    };

    if (!payload.line1.trim()) {
      setCustomerError("La dirección (línea 1) es obligatoria.");
      return;
    }

    if (editingAddress) {
      const { error } = await supabase
        .from("customer_addresses")
        .update(payload)
        .eq("id", editingAddress.id);
      if (error) {
        setCustomerError(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("customer_addresses").insert(payload);
      if (error) {
        setCustomerError(error.message);
        return;
      }
    }

    // Refresh addresses
    const { data: addrData } = await supabase
      .from("customer_addresses")
      .select(
        "id,customer_id,label,is_default,name,phone,line1,line2,city,region,postal_code,country",
      )
      .eq("customer_id", customer.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    setAddresses((addrData ?? []) as AddressRow[]);
    setAddressModalOpen(false);
  }

  async function deleteAddress(address: AddressRow) {
    if (!session) {
      setAuthModalOpen(true);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { error } = await supabase
      .from("customer_addresses")
      .delete()
      .eq("id", address.id);
    if (error) {
      setCustomerError(error.message);
      return;
    }
    setAddresses((prev) => prev.filter((a) => a.id !== address.id));
  }

  async function saveProfile() {
    if (!session) {
      setAuthModalOpen(true);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setProfileSaving(true);
    setCustomerError("");
    try {
      // Update auth metadata (for header/avatar)
      const { error: authErr } = await supabase.auth.updateUser({
        data: { full_name: profileForm.fullName },
      });
      if (authErr) throw authErr;

      // Update customers table
      const { data: updated, error: custErr } = await supabase
        .from("customers")
        .update({
          full_name: profileForm.fullName || null,
          phone: profileForm.phone || null,
        })
        .eq("user_id", session.user.id)
        .select("id,user_id,email,full_name,phone")
        .single();

      if (custErr) throw custErr;
      setCustomer(updated as CustomerRow);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error guardando";
      setCustomerError(message);
    } finally {
      setProfileSaving(false);
    }
  }

  const menuItems = useMemo(
    () =>
      [
        { id: "pedidos" as const, label: "Mis Pedidos", icon: Package },
        { id: "direcciones" as const, label: "Direcciones", icon: MapPin },
        { id: "detalles" as const, label: "Datos Personales", icon: Settings },
      ] satisfies Array<{ id: TabId; label: string; icon: typeof Package }>,
    [],
  );

  return (
    <div className=" pb-24 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 min-h-[80vh]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        <aside className="lg:col-span-4">
          <div className=" border border-gray-100 bg-white p-6 md:p-8">
            <div className="flex items-center gap-5">
              <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
                <Avatar
                  className="w-full h-full"
                  name={userData.name ?? "Cuenta"}
                  src={userData.avatar_url}
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-normal  truncate">
                  {userData.name}
                </h2>
                <p className="text-[10px] md:text-xs text-gray-400 uppercase st mt-1">
                  {session ? "Mi cuenta" : "Invitado"}
                </p>
                <p className="text-xs text-gray-500 mt-2 truncate">{userData.email}</p>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-[10px] uppercase  text-gray-400 mb-3">
                Cuenta
              </p>

              <nav className="hidden lg:block space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      type="button"
                      className={`w-full flex items-center justify-between p-4  transition-colors border ${isActive
                        ? "bg-[#fafafa] border-gray-100"
                        : "bg-white border-transparent hover:bg-gray-50"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={18}
                          strokeWidth={1}
                          className={isActive ? "text-black" : "text-gray-400"}
                        />
                        <span
                          className={`text-[10px] uppercase st ${isActive ? "text-black" : "text-gray-500"
                            }`}
                        >
                          {item.label}
                        </span>
                      </div>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </button>
                  );
                })}

                {session ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const supabase = getSupabaseBrowserClient();
                      await supabase?.auth.signOut();
                    }}
                    className="w-full flex items-center gap-3 p-4  hover:bg-red-50 text-red-500 transition-colors mt-6"
                  >
                    <LogOut size={18} strokeWidth={1} />
                    <span className="text-[10px] uppercase st">
                      Cerrar Sesión
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="w-full flex items-center gap-3 p-4  hover:bg-gray-50 text-black transition-colors mt-6 border border-gray-100"
                  >
                    <Plus size={18} strokeWidth={1} className="text-gray-500" />
                    <span className="text-[10px] uppercase st">
                      Iniciar sesión
                    </span>
                  </button>
                )}
              </nav>

              <div className="lg:hidden -mx-6 md:-mx-8 mt-6 px-6 md:px-8">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        type="button"
                        className={`shrink-0 flex items-center gap-2 px-4 py-3 rounded-full border transition-colors ${isActive
                          ? "border-black bg-black text-white"
                          : "border-gray-200 bg-white text-gray-600"
                          }`}
                      >
                        <Icon size={16} strokeWidth={1} />
                        <span className="text-[10px] uppercase st">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-8">
          <div className=" border border-gray-100 bg-white p-6 md:p-10">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {!supabaseReady && (
                <div className="mb-8  border border-amber-100 bg-amber-50 p-5 text-amber-900">
                  <p className="text-[10px] uppercase  text-amber-700 mb-2">
                    Configuración
                  </p>
                  <p className="text-sm">
                    {getSupabaseMissingEnvMessage()}
                  </p>
                </div>
              )}

              {!session && (
                <div className="mb-8  border border-gray-100 bg-[#fafafa] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase  text-gray-400 mb-2">
                      Cuenta
                    </p>
                    <p className="text-base font-normal ">
                      Inicia sesión para ver tus pedidos y datos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="rounded-full bg-black px-6 py-2 text-white text-xs uppercase st"
                  >
                    Iniciar sesión
                  </button>
                </div>
              )}

              {activeTab === "pedidos" && (
                <div>
                  <div className="flex items-end justify-between gap-6 mb-8 md:mb-10">
                    <div>
                      <p className="text-[10px] uppercase  text-gray-400 mb-3">
                        Historial
                      </p>
                      <h1 className="text-2xl md:text-3xl font-normal ">
                        Mis Pedidos
                      </h1>
                    </div>
                    <button
                      type="button"
                      className="text-[10px] uppercase st text-gray-500 hover:text-black border-b border-gray-200 hover:border-black transition-colors"
                    >
                      Ver todos
                    </button>
                  </div>

                  <div className="space-y-4">
                    {ordersLoading && (
                      <div className="text-sm text-gray-500">Cargando pedidos…</div>
                    )}

                    {!ordersLoading && orders.length === 0 && (
                      <div className=" border border-gray-100 p-6 text-sm text-gray-600">
                        Aún no tienes pedidos.
                      </div>
                    )}

                    {orders.map((order) => (
                      <Link
                        href={`/profile/orders/${order.id}`}
                        key={order.id}
                        className=" border border-gray-100 p-5 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-black transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-5 min-w-0">
                          <div className="relative w-16 h-20 bg-[#f7f7f7]  overflow-hidden shrink-0">
                            <img
                              src="/placeholder.svg"
                              alt="Producto del pedido"
                              width={64}
                              height={80}
                              className="absolute inset-0 h-full w-full object-cover opacity-90"
                              loading="lazy"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 uppercase st mb-1">
                              #{String(order.order_number).padStart(4, "0")}
                            </p>
                            <h3 className="text-base md:text-lg font-normal  truncate">
                              {formatDate(order.created_at)}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              Total • {formatMoney(order.total_cents, order.currency)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end md:gap-10">
                          <span
                            className={`text-[10px] uppercase st px-4 py-1.5 rounded-full border ${toHumanOrderStatus(order.status) === "Entregado"
                              ? "bg-green-50 text-green-700 border-green-100"
                              : "bg-gray-50 text-gray-500 border-gray-100"
                              }`}
                          >
                            {toHumanOrderStatus(order.status)}
                          </span>
                          <ExternalLink
                            size={18}
                            strokeWidth={1}
                            className="text-gray-300 group-hover:text-black transition-colors"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "direcciones" && (
                <div>
                  <p className="text-[10px] uppercase  text-gray-400 mb-3">
                    Envíos
                  </p>
                  <h1 className="text-2xl md:text-3xl font-normal  mb-8 md:mb-10">
                    Direcciones
                  </h1>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {addressesLoading && (
                      <div className="text-sm text-gray-500">Cargando direcciones…</div>
                    )}

                    {!addressesLoading && addresses.map((a) => (
                      <div
                        key={a.id}
                        className={` border bg-white p-6 md:p-8 relative ${a.is_default ? "border-black" : "border-gray-100"
                          }`}
                      >
                        {a.is_default && (
                          <span className="absolute top-6 right-6 text-[8px] uppercase st bg-black text-white px-2 py-1 rounded">
                            Principal
                          </span>
                        )}
                        <h3 className="text-[10px] uppercase st mb-4 text-gray-500">
                          {a.label || "Dirección"}
                        </h3>
                        <p className="text-sm text-gray-600 font-normal leading-relaxed">
                          {a.line1}
                          {a.line2 ? (
                            <>
                              <br />
                              {a.line2}
                            </>
                          ) : null}
                          <br />
                          {[a.postal_code, a.city].filter(Boolean).join(" ")}
                          {a.region ? `, ${a.region}` : ""}
                          <br />
                          {a.country}
                        </p>

                        <div className="mt-8 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => openEditAddressModal(a)}
                            className="text-[10px] uppercase st border-b border-gray-200 pb-1 hover:border-black transition-colors inline-flex items-center gap-2"
                          >
                            <Edit3 size={14} strokeWidth={1} /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAddress(a)}
                            className="text-[10px] uppercase st text-red-600 hover:text-red-700 inline-flex items-center gap-2"
                          >
                            <Trash2 size={14} strokeWidth={1} /> Eliminar
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => (session ? openNewAddressModal() : setAuthModalOpen(true))}
                      className=" border border-gray-100 bg-[#fafafa] p-6 md:p-8 flex flex-col items-center justify-center border-dashed text-gray-500 hover:border-black transition-colors cursor-pointer group"
                      aria-label="Añadir nueva dirección"
                    >
                      <Plus
                        size={28}
                        strokeWidth={0.75}
                        className="mb-4 text-gray-400 group-hover:text-black transition-colors"
                      />
                      <span className="text-[10px] uppercase st">
                        Añadir nueva dirección
                      </span>
                    </button>
                  </div>
                </div>
              )}



              {activeTab === "detalles" && (
                <div className="max-w-2xl">
                  <p className="text-[10px] uppercase  text-gray-400 mb-3">
                    Perfil
                  </p>
                  <h1 className="text-2xl md:text-3xl font-normal  mb-8 md:mb-10">
                    Datos Personales
                  </h1>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase st text-gray-400">
                          Nombre completo
                        </label>
                        <input
                          type="text"
                          value={profileForm.fullName}
                          onChange={(e) =>
                            setProfileForm((p) => ({ ...p, fullName: e.target.value }))
                          }
                          className="w-full border border-gray-100  px-4 py-3 text-sm outline-none focus:border-black transition-colors"
                          placeholder="Tu nombre"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase st text-gray-400">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm((p) => ({ ...p, phone: e.target.value }))
                          }
                          className="w-full border border-gray-100  px-4 py-3 text-sm outline-none focus:border-black transition-colors"
                          placeholder="+54…"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase st text-gray-400">
                        Email
                      </label>
                      <input
                        type="email"
                        value={userData.email}
                        disabled
                        className="w-full border border-gray-100  px-4 py-3 text-sm outline-none bg-gray-50 text-gray-500"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => void saveProfile()}
                        disabled={!session || profileSaving}
                        className="bg-black text-white px-10 py-4 rounded-full text-[10px] uppercase st hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {profileSaving ? "Guardando…" : "Guardar Cambios"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {customerLoading && (
        <div className="mt-6  border border-gray-100 bg-white p-4 text-gray-600 text-sm">
          Cargando tu cuenta…
        </div>
      )}

      {customerError && (
        <div className="mt-6  border border-red-100 bg-red-50 p-4 text-red-700 text-sm">
          {customerError}
        </div>
      )}

      <Modal
        isOpen={addressModalOpen}
        onOpenChange={(open) => {
          if (!open) setAddressModalOpen(false);
        }}
        size="md"
        placement="center"
        hideCloseButton
        backdrop="blur"
        scrollBehavior="inside"
      >
        <ModalContent className=" w-full h-fit max-w-sm sm:max-w-md">
          <ModalHeader className="sm:pt-8 relative flex items-center text-center font-normal justify-center pt-5">
            <h2 className="text-xl text-black mb-1">
              {editingAddress ? "Editar dirección" : "Nueva dirección"}
            </h2>
          </ModalHeader>
          <ModalBody className="px-0 pb-5 sm:pb-8">
            <div className="px-5 sm:px-8 space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  labelPlacement="inside"
                  radius="full"
                  value={addressForm.name}
                  onChange={(e) =>
                    setAddressForm((p) => ({ ...p, name: e.target.value }))
                  }
                  classNames={{
                    inputWrapper:
                      "bg-zinc-100 data-[hover=true]:bg-zinc-100 data-[focus=true]:bg-zinc-100 group-data-[focus=true]:bg-zinc-100",
                  }}
                />
                <Input
                  label="Teléfono"
                  labelPlacement="inside"
                  radius="full"
                  value={addressForm.phone}
                  onChange={(e) =>
                    setAddressForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  classNames={{
                    inputWrapper:
                      "bg-zinc-100 data-[hover=true]:bg-zinc-100 data-[focus=true]:bg-zinc-100 group-data-[focus=true]:bg-zinc-100",
                  }}
                />
              </div>

              <Input
                label="Etiqueta"
                labelPlacement="inside"
                radius="full"
                value={addressForm.label}
                onChange={(e) =>
                  setAddressForm((p) => ({ ...p, label: e.target.value }))
                }
                classNames={{
                  inputWrapper:
                    "bg-zinc-100 data-[hover=true]:bg-zinc-100 data-[focus=true]:bg-zinc-100 group-data-[focus=true]:bg-zinc-100",
                }}
              />

              <Input
                label="Dirección (línea 1)"
                labelPlacement="inside"
                radius="full"
                value={addressForm.line1}
                onChange={(e) =>
                  setAddressForm((p) => ({ ...p, line1: e.target.value }))
                }
                classNames={{
                  inputWrapper:
                    "bg-zinc-100 data-[hover=true]:bg-zinc-100 data-[focus=true]:bg-zinc-100 group-data-[focus=true]:bg-zinc-100",
                }}
              />

              <Input
                label="Dirección (línea 2)"
                labelPlacement="inside"
                radius="full"
                value={addressForm.line2}
                onChange={(e) =>
                  setAddressForm((p) => ({ ...p, line2: e.target.value }))
                }
                classNames={{
                  inputWrapper:
                    "bg-zinc-100 data-[hover=true]:bg-zinc-100 data-[focus=true]:bg-zinc-100 group-data-[focus=true]:bg-zinc-100",
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Ciudad"
                  labelPlacement="inside"
                  radius="full"
                  value={addressForm.city}
                  onChange={(e) =>
                    setAddressForm((p) => ({ ...p, city: e.target.value }))
                  }
                  classNames={{
                    inputWrapper:
                      "bg-zinc-100 data-[hover=true]:bg-zinc-100 data-[focus=true]:bg-zinc-100 group-data-[focus=true]:bg-zinc-100",
                  }}
                />
                <Input
                  label="Provincia/Región"
                  labelPlacement="inside"
                  radius="full"
                  value={addressForm.region}
                  onChange={(e) =>
                    setAddressForm((p) => ({ ...p, region: e.target.value }))
                  }
                  classNames={{
                    inputWrapper:
                      "bg-zinc-100 data-[hover=true]:bg-zinc-100 data-[focus=true]:bg-zinc-100 group-data-[focus=true]:bg-zinc-100",
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Código postal"
                  labelPlacement="inside"
                  radius="full"
                  value={addressForm.postal_code}
                  onChange={(e) =>
                    setAddressForm((p) => ({ ...p, postal_code: e.target.value }))
                  }
                  classNames={{
                    inputWrapper:
                      "bg-zinc-100 data-[hover=true]:bg-zinc-100 data-[focus=true]:bg-zinc-100 group-data-[focus=true]:bg-zinc-100",
                  }}
                />
                <Input
                  label="País"
                  labelPlacement="inside"
                  radius="full"
                  value={addressForm.country}
                  onChange={(e) =>
                    setAddressForm((p) => ({ ...p, country: e.target.value }))
                  }
                  classNames={{
                    inputWrapper:
                      "bg-zinc-100 data-[hover=true]:bg-zinc-100 data-[focus=true]:bg-zinc-100 group-data-[focus=true]:bg-zinc-100",
                  }}
                />
              </div>

              <Checkbox
                isSelected={addressForm.is_default}
                onValueChange={(v) =>
                  setAddressForm((p) => ({ ...p, is_default: Boolean(v) }))
                }
              >
                Marcar como principal
              </Checkbox>

              <div className="flex gap-2 pt-2">
                <Button
                  radius="full"
                  className="bg-zinc-100 text-black w-full"
                  onPress={() => setAddressModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  radius="full"
                  className="bg-black text-white w-full"
                  onPress={() => void saveAddress()}
                >
                  Guardar
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
