export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md p-10">
      <h1 className="mb-6 text-3xl font-bold">
        Crear Cuenta
      </h1>

      <input
        className="mb-4 w-full border p-3"
        placeholder="Nombre"
      />

      <input
        className="mb-4 w-full border p-3"
        placeholder="Email"
      />

      <input
        className="mb-4 w-full border p-3"
        type="password"
        placeholder="Password"
      />

      <button className="w-full rounded bg-black p-3 text-white">
        Registrarme
      </button>
    </main>
  );
}