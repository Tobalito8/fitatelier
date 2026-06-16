import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import DashboardCard from "@/components/DashboardCard";

export default function DashboardPage() {
  return (
    <>
      <Navbar />

      <div className="flex">

        <Sidebar />

        <main className="flex-1 bg-stone-50 p-8">

          <h1 className="mb-2 text-4xl font-bold">
            Bienvenido
          </h1>

          <p className="mb-8 text-gray-500">
            Gestiona tus diseños y pedidos.
          </p>

          <div className="grid grid-cols-3 gap-6">

            <DashboardCard
              title="Diseños"
              value="4"
            />

            <DashboardCard
              title="Pedidos"
              value="2"
            />

            <DashboardCard
              title="Avatar"
              value="Activo"
            />

          </div>

          <section className="mt-10 rounded-2xl bg-white p-6 shadow">

            <h2 className="mb-4 text-xl font-bold">
              Diseños recientes
            </h2>

            <div className="space-y-4">

              <div className="rounded-lg border p-4">
                Vestido Princesa Satin
              </div>

              <div className="rounded-lg border p-4">
                Vestido Elegance Marfil
              </div>

            </div>

          </section>

        </main>

      </div>
    </>
  );
}