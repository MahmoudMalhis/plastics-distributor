// client/src/features/orders/state/cart.store.js
import { useSyncExternalStore } from "react";
import { notify } from "../../../utils/alerts";

const LS_KEY = "cart";

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.items)) return { items: [] };
    return { items: parsed.items };
  } catch {
    return { items: [] };
  }
}

let state = load();
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to persist cart", error);
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setState(patch) {
  state = { ...state, ...patch };
  emit();
}

export function addItem(product, qty = 1) {
  const p = product || {};
  const id = p.id ?? p.productId;
  if (!id) return;

  const items = [...state.items];
  const i = items.findIndex((x) => x.productId === id);
  if (i >= 0) {
    items[i] = { ...items[i], qty: items[i].qty + qty };
    notify("success", "تم تحديث الكمية في السلة");
  } else {
    items.push({
      productId: id,
      name: p.name || p.title || "",
      price: Number(p.price ?? 0),
      image: p.image_url || p.image || null,
      sku: p.sku || null,
      qty: qty,
    });
    notify("success", "تمت اضافة المنتج الى السلة");
  }
  setState({ items });
}

export function removeItem(productId) {
  setState({ items: state.items.filter((x) => x.productId !== productId) });
}

export function setQty(productId, qty) {
  qty = Math.max(1, Number(qty || 1));
  const items = state.items.map((x) =>
    x.productId === productId ? { ...x, qty } : x
  );
  setState({ items });
}

export function clearCart() {
  setState({ items: [] });
}

export function cartTotals() {
  const subtotal = state.items.reduce(
    (s, it) => s + Number(it.price || 0) * Number(it.qty || 0),
    0
  );
  const count = state.items.reduce((s, it) => s + Number(it.qty || 0), 0);
  return { subtotal, count };
}

export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, getState);
  const totals = cartTotals();
  return {
    items: snapshot.items,
    totals,
    addItem,
    removeItem,
    setQty,
    clearCart,
  };
}
