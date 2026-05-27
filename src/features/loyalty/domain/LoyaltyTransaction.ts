export type LoyaltyTransactionType = "accrual" | "redemption" | "adjustment";

export type LoyaltyTransaction = {
  id: string;
  customer_id: string;
  order_id: string | null;
  type: LoyaltyTransactionType;
  points: number;
  description: string | null;
  created_at: string;
};

export type LoyaltyRules = {
  id: number;
  points_per_cents: number;
  retail_multiplier: number;
  wholesale_multiplier: number;
  points_to_cents_conversion: number;
  updated_at: string;
};

export type CustomerLoyaltySummary = {
  customer_id: string;
  total_points: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
};
