export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  /** Unit price in NGN as displayed when the item was added. Server recomputes at checkout. */
  price: number;
  imageUrl: string;
  size: string | null;
  colourName: string | null;
  colourHex: string | null;
  quantity: number;
  /** Upper bound for the quantity stepper. */
  stockQuantity: number;
}

export interface CartTotals {
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}
