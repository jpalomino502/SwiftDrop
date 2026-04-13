export type CartItemId = string;

export type CartItem = {
  id: CartItemId;
  productId: number;
  title: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  size?: string;
  color?: string;
};

export function toCartItemId(input: { productId: number; size?: string; color?: string }): CartItemId {
  return `${input.productId}:${input.size ?? "-"}:${input.color ?? "-"}`;
}
