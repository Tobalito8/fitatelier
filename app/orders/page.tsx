export default function OrdersPage() {
  return (
    <main className="p-10">
      <h1 className="mb-8 text-3xl font-bold">
        Mis Pedidos
      </h1>

      <div className="space-y-4">
        <div className="rounded border p-4">
          Pedido #1001 - En Producción
        </div>

        <div className="rounded border p-4">
          Pedido #1002 - Enviado
        </div>
      </div>
    </main>
  );
}