import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 bg-[#F7F3ED]">
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
          Diseña vestidos hechos para tu cuerpo
        </h2>

        <p className="mb-8 max-w-2xl text-lg text-gray-700">
          Crea un modelo de tu cuerpo a escala, personaliza cada detalle y
          exporta el patrón listo para confeccionar tu prenda a la medida.
        </p>

        <div className="flex flex-wrap gap-4">
          <Link href="/measurements" className="rounded-xl bg-black px-6 py-3 text-white">
            Crear mi perfil
          </Link>

          <Link href="/designer" className="rounded-xl border border-gray-300 px-6 py-3">
            Ir al diseñador
          </Link>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          <Step n={1} title="Toma tus medidas" desc="Captura tu perfil corporal o estímalo desde una foto." />
          <Step n={2} title="Diseña tu vestido" desc="Escote, mangas, falda y tela sobre tu avatar a escala." />
          <Step n={3} title="Exporta el patrón" desc="Descarga las piezas a tamaño real para confeccionar." />
        </div>
      </section>
    </main>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
        {n}
      </div>
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
}
