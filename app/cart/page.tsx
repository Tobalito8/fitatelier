"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useShop, type CartItem } from "@/lib/store/shop";

export default function CartPage() {
  const router = useRouter();
  const { cart, cartSubtotal, hydrated, removeFromCart, checkout } = useShop();

  function handleCheckout() {
    const order = checkout();
    if (order) router.push("/orders");
  }

  return (
    <main className="mx-auto max-w-3xl p-6 md:p-10">
      <h1 className="mb-8 text-3xl font-bold">Carrito</h1>

      {!hydrated ? (
        <p className="text-gray-500">Cargando…</p>
      ) : cart.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <p className="mb-4 text-gray-500">Tu carrito está vacío.</p>
          <Link
            href="/designer"
            className="inline-block rounded-xl bg-black px-6 py-3 text-white"
          >
            Diseñar un vestido →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <ul className="space-y-4">
            {cart.map((item) => (
              <CartRow key={item.id} item={item} onRemove={() => removeFromCart(item.id)} />
            ))}
          </ul>

          <div className="flex items-center justify-between border-t pt-6">
            <span className="text-lg font-semibold">Subtotal</span>
            <span className="text-2xl font-bold">${cartSubtotal} USD</span>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            className="w-full rounded-xl bg-emerald-600 p-4 font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Finalizar pedido
          </button>
        </div>
      )}
    </main>
  );
}

function CartRow({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  const { design } = item;
  return (
    <li className="flex items-center gap-4 rounded-2xl border bg-white p-4">
      <div
        className="h-14 w-14 shrink-0 rounded-xl border"
        style={{ backgroundColor: design.color }}
        aria-hidden
      />
      <div className="flex-1">
        <p className="font-semibold">Vestido {design.skirt}</p>
        <p className="text-sm text-gray-500">
          {design.fabric} · escote {design.neckline} · mangas {design.sleeves.toLowerCase()}
        </p>
        {item.measurements ? (
          <p className="mt-1 text-xs text-emerald-600">A tu medida</p>
        ) : (
          <p className="mt-1 text-xs text-amber-600">Talla de referencia (sin perfil)</p>
        )}
      </div>
      <span className="font-semibold">${item.priceUsd}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Quitar del carrito"
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-stone-100 hover:text-red-600"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </li>
  );
}
