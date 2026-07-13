import { cookies } from "next/headers";
import { parseJson, toJson } from "./serialize";

// Cart lives in a cookie for the MVP (anonymous carts, FR-C-10). Items reference product ids.
const CART_COOKIE = "cf_cart";

export type CartItem = { productId: string; qty: number };

export function readCart(): CartItem[] {
  const raw = cookies().get(CART_COOKIE)?.value;
  const items = parseJson<CartItem[]>(raw, []);
  return Array.isArray(items) ? items.filter((i) => i && i.productId) : [];
}

// Write helpers are used from Route Handlers where mutating cookies is allowed.
export function writeCart(items: CartItem[]) {
  cookies().set(CART_COOKIE, toJson(items), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function addToCart(productId: string) {
  const items = readCart();
  const existing = items.find((i) => i.productId === productId);
  if (existing) existing.qty += 1;
  else items.push({ productId, qty: 1 });
  writeCart(items);
}

export function removeFromCart(productId: string) {
  writeCart(readCart().filter((i) => i.productId !== productId));
}

export function clearCart() {
  writeCart([]);
}
