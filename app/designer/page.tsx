export default function DesignerPage() {
  return (
    <div className="grid min-h-screen grid-cols-[320px_1fr_360px] bg-stone-50">
      
      {/* PANEL IZQUIERDO */}
      <aside className="border-r bg-white p-6">
        <h1 className="mb-6 text-2xl font-bold">
          Diseñador de Vestidos
        </h1>

        <div className="space-y-6">

          <div>
            <h3 className="mb-2 font-semibold">Escote</h3>

            <select className="w-full rounded-lg border p-3">
              <option>Redondo</option>
              <option>V</option>
              <option>Corazón</option>
              <option>Halter</option>
            </select>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Mangas</h3>

            <select className="w-full rounded-lg border p-3">
              <option>Sin mangas</option>
              <option>Corta</option>
              <option>Larga</option>
              <option>Globo</option>
            </select>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Tela</h3>

            <select className="w-full rounded-lg border p-3">
              <option>Satín</option>
              <option>Chifón</option>
              <option>Tul</option>
              <option>Encaje</option>
            </select>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Color</h3>

            <input
              type="color"
              className="h-12 w-full"
            />
          </div>
        </div>
      </aside>

      {/* AVATAR */}
      <main className="flex flex-col items-center justify-center">

        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold">
            Vista Previa
          </h2>

          <p className="text-gray-500">
            Próximamente avatar 3D
          </p>
        </div>

        <div className="flex h-[650px] w-[400px] items-center justify-center rounded-3xl border bg-white shadow">
          <span className="text-2xl">
            👗 Avatar + Vestido
          </span>
        </div>

      </main>

      {/* RESUMEN */}
      <aside className="border-l bg-white p-6">

        <h2 className="mb-6 text-2xl font-bold">
          Resumen
        </h2>

        <div className="space-y-4">

          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">
              Tela
            </h3>

            <p>Satín Premium</p>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">
              Color
            </h3>

            <p>Marfil</p>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">
              Tiempo Producción
            </h3>

            <p>7 - 10 días</p>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">
              Precio Estimado
            </h3>

            <p className="text-3xl font-bold">
              $150 USD
            </p>
          </div>

          <button className="w-full rounded-xl bg-black p-4 text-white">
            Agregar al Carrito
          </button>

        </div>

      </aside>

    </div>
  );
}