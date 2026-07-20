"use client";

/**
 * Shop state: carrito + pedidos, persistidos en localStorage.
 *
 * Es la única fuente de verdad del flujo de compra. El diseñador agrega
 * al carrito (`addToCart`), `/cart` lo muestra y hace `checkout()`, y
 * `/orders` lee los pedidos generados. Cuando exista un backend real,
 * solo hay que cambiar la persistencia aquí dentro — la API del hook
 * (`useShop`) no cambia.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { DressDesign } from "@/lib/garments";
import type { BodyMeasurements } from "@/lib/measurements";

export type CartItem = {
  id: string;
  design: DressDesign;
  priceUsd: number;
  /** Foto de las medidas al momento de agregar, para que el pedido sea reproducible. */
  measurements: BodyMeasurements | null;
  createdAt: number;
};

export type OrderStatus = "En producción" | "Enviado" | "Entregado";

export type Order = {
  /** Consecutivo legible para el cliente, p. ej. "1001". */
  id: string;
  items: CartItem[];
  totalUsd: number;
  status: OrderStatus;
  createdAt: number;
};

type ShopContextValue = {
  cart: CartItem[];
  orders: Order[];
  cartCount: number;
  cartSubtotal: number;
  /** `false` durante el primer render del servidor / antes de leer localStorage. */
  hydrated: boolean;
  addToCart: (
    design: DressDesign,
    priceUsd: number,
    measurements: BodyMeasurements | null
  ) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  /** Convierte el carrito actual en un pedido y lo vacía. Devuelve el pedido creado. */
  checkout: () => Order | null;
};

const STORAGE_KEY = "fitatelier-shop";
const FIRST_ORDER_NUMBER = 1001;

const ShopContext = createContext<ShopContextValue | null>(null);

/** Id único, con respaldo por si `crypto.randomUUID` no está disponible. */
function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type PersistedShape = { cart: CartItem[]; orders: Order[] };

function loadPersisted(): PersistedShape {
  if (typeof window === "undefined") return { cart: [], orders: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { cart: [], orders: [] };
    const parsed = JSON.parse(raw) as Partial<PersistedShape>;
    return { cart: parsed.cart ?? [], orders: parsed.orders ?? [] };
  } catch {
    return { cart: [], orders: [] };
  }
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Carga una sola vez en cliente. Hecho en effect (no en el inicializador de
  // useState) para que el HTML del servidor coincida con el primer paint y no
  // haya hydration mismatch — localStorage no existe en el servidor.
  useEffect(() => {
    const { cart, orders } = loadPersisted();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCart(cart);
    setOrders(orders);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ cart, orders }));
    } catch {
      // best-effort hasta que haya backend real
    }
  }, [cart, orders, hydrated]);

  const addToCart = useCallback(
    (design: DressDesign, priceUsd: number, measurements: BodyMeasurements | null) => {
      setCart((prev) => [
        ...prev,
        { id: newId(), design, priceUsd, measurements, createdAt: Date.now() },
      ]);
    },
    []
  );

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const checkout = useCallback((): Order | null => {
    let created: Order | null = null;
    setOrders((prevOrders) => {
      if (cart.length === 0) return prevOrders;
      created = {
        id: String(FIRST_ORDER_NUMBER + prevOrders.length),
        items: cart,
        totalUsd: cart.reduce((sum, item) => sum + item.priceUsd, 0),
        status: "En producción",
        createdAt: Date.now(),
      };
      return [created, ...prevOrders];
    });
    if (created) setCart([]);
    return created;
  }, [cart]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.priceUsd, 0),
    [cart]
  );

  const value = useMemo<ShopContextValue>(
    () => ({
      cart,
      orders,
      cartCount: cart.length,
      cartSubtotal,
      hydrated,
      addToCart,
      removeFromCart,
      clearCart,
      checkout,
    }),
    [cart, orders, cartSubtotal, hydrated, addToCart, removeFromCart, clearCart, checkout]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) {
    throw new Error("useShop debe usarse dentro de <ShopProvider>");
  }
  return ctx;
}
