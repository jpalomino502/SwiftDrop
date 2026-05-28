type ShippingItem = {
  quantity: number;
};

export type ShippingQuote = {
  shippingCents: number;
  chargeableWeightKg: number;
  baseTransportCents: number;
  overfreightCents: number;
  isFreeShippingCity: boolean;
  cityNormalized: string;
};

const FREE_SHIPPING_CITIES = new Set([
  "bucaramanga",
  "piedecuesta",
  "giron",
  "floridablanca",
]);

// Mensajeria expresa (vigencia 2025-2026):
// Usamos tarifa base regional por defecto para no sobreestimar el cobro al cliente.
// kilo inicial: 10.100 COP, kilo adicional: 4.000 COP.
const BASE_INITIAL_COP = 10100;
const BASE_ADDITIONAL_COP = 4000;
const OVERFREIGHT_RATE = 0.02; // 2% sobre valor declarado
const ESTIMATED_WEIGHT_PER_ITEM_KG = 0.8;

function normalizeCity(value: string | undefined | null): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getEstimatedPhysicalWeightKg(items: ShippingItem[]): number {
  const totalUnits = items.reduce((acc, item) => {
    const qty = Number.isFinite(item.quantity) ? Math.max(0, Math.floor(item.quantity)) : 0;
    return acc + qty;
  }, 0);

  if (totalUnits <= 0) return 0;
  return totalUnits * ESTIMATED_WEIGHT_PER_ITEM_KG;
}

export function isFreeShippingCity(city: string | undefined | null): boolean {
  const normalized = normalizeCity(city);
  return FREE_SHIPPING_CITIES.has(normalized);
}

export function calculateShippingQuote(input: {
  city?: string | null;
  subtotalCents: number;
  items: ShippingItem[];
}): ShippingQuote {
  const cityNormalized = normalizeCity(input.city);
  const subtotalCents = Number.isFinite(input.subtotalCents) ? Math.max(0, Math.floor(input.subtotalCents)) : 0;

  if (FREE_SHIPPING_CITIES.has(cityNormalized)) {
    return {
      shippingCents: 0,
      chargeableWeightKg: 0,
      baseTransportCents: 0,
      overfreightCents: 0,
      isFreeShippingCity: true,
      cityNormalized,
    };
  }

  const physicalWeightKg = getEstimatedPhysicalWeightKg(input.items);
  const chargeableWeightKg = Math.max(1, Math.ceil(physicalWeightKg));

  const additionalKg = Math.max(0, chargeableWeightKg - 1);
  const baseTransportCop = BASE_INITIAL_COP + (additionalKg * BASE_ADDITIONAL_COP);
  const declaredValueCop = subtotalCents;
  const overfreightCop = Math.round(declaredValueCop * OVERFREIGHT_RATE);

  return {
    shippingCents: baseTransportCop + overfreightCop,
    chargeableWeightKg,
    baseTransportCents: baseTransportCop,
    overfreightCents: overfreightCop,
    isFreeShippingCity: false,
    cityNormalized,
  };
}
