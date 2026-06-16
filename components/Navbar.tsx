import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b bg-white px-8 py-4">
      <Link href="/" className="text-2xl font-bold">
        FitAtelier
      </Link>

      <div className="flex gap-6">
        <Link href="/designer">Diseñar</Link>
        <Link href="/orders">Pedidos</Link>
        <Link href="/profile">Perfil</Link>
      </div>
    </nav>
  );
}