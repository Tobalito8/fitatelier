import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F3ED]">
      <nav className="flex items-center justify-between p-6">
        <h1 className="text-2xl font-bold">FitAtelier</h1>

        <div className="space-x-4">
          <button>Login</button>

          <button className="rounded-xl bg-black px-4 py-2 text-white">
            Crear Cuenta
          </button>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="mb-6 text-6xl font-bold">
          Diseña vestidos hechos para tu cuerpo
        </h2>

        <p className="mb-8 max-w-2xl text-lg">
          Crea tu perfil corporal, personaliza cada detalle y recibe una prenda
          confeccionada especialmente para ti.
        </p>

        <div className="flex gap-4">
          <Link
            href="/designer"
            className="rounded-xl bg-black px-6 py-3 text-white"
          >
            Crear Mi Diseño
          </Link>

          <Link
            href="/register"
            className="rounded-xl border px-6 py-3"
          >
            Comenzar
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap gap-4"> {/*Links de ejemplo para navegación */}

          <Link href="/login">
            Login
          </Link>

          <Link href="/register">
            Registro
          </Link>

          <Link href="/dashboard">
            Dashboard
          </Link>

          <Link href="/measurements">
            Medidas
          </Link>

          <Link href="/designer">
            Diseñador
          </Link>

          <Link href="/orders">
            Pedidos
          </Link>

        </div>
      </section>
    </main>
  );
}