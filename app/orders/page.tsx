"use client";

import Link from "next/link";
import { useShop, type Order, type OrderStatus } from "@/lib/store/shop";

const STATUS_STYLES: Record<OrderStatus, string> = {
  "En producción": "bg-amber-100 text-amber-800",
  Enviado: "bg-blue-100 text-blue-800",
  Entregado: "bg-emerald-100 text-emerald-800",
};

export default function OrdersPage() {
  const { orders, hydrated } = useShop();

  return (
    <main className="mx-auto max-w-3xl p-6 md:p-10">
      <h1 className="mb-8 text-3xl font-bold">Mis Pedidos</h1>

      {!hydrated ? (
        <p className="text-gray-500">Cargando…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <p className="mb-4 text-gray-500">Todavía no tienes pedidos.</p>
          <Link
            href="/designer"
            className="inline-block rounded-xl bg-black px-6 py-3 text-white"
          >
            Diseñar un vestido →
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </ul>
      )}
    </main>
  );
}

function OrderRow({ order }: { order: Order }) {
  const pieces = order.items.length;
  return (
    <li className="rounded-2xl border bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold">Pedido #{order.id}</span>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[order.status]}`}>
          {order.status}
        </span>
      </div>
      <p className="text-sm text-gray-500">
        {pieces} {pieces === 1 ? "prenda" : "prendas"} ·{" "}
        {new Date(order.createdAt).toLocaleDateString("es-MX")}
      </p>
      <p className="mt-2 text-lg font-bold">${order.totalUsd} USD</p>
    </li>
  );
}
