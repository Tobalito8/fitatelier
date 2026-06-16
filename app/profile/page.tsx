export default function ProfilePage() {
  return (
    <main className="p-10">
      <h1 className="mb-6 text-3xl font-bold">
        Mi Perfil
      </h1>

      <div className="max-w-xl space-y-4">
        <input
          className="w-full border p-3"
          placeholder="Nombre"
        />

        <input
          className="w-full border p-3"
          placeholder="Email"
        />
      </div>
    </main>
  );
}