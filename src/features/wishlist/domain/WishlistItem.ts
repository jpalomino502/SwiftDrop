export type WishlistItem = {
  productId: number;
  title: string;
  imageUrl: string;
  price: number;
  addedAt: string;
};

export type WishlistItemId = number;

export function toWishlistItemId(input: { productId: number }): WishlistItemId {
  return input.productId;
}
