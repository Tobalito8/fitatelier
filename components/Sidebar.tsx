import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-white p-6">
      <ul className="space-y-4">
        <li>
          <Link href="/dashboard">Dashboard</Link>
        </li>

        <li>
          <Link href="/measurements">Medidas</Link>
        </li>

        <li>
          <Link href="/designer">Diseñador</Link>
        </li>

        <li>
          <Link href="/orders">Pedidos</Link>
        </li>

        <li>
          <Link href="/profile">Perfil</Link>
        </li>
      </ul>
    </aside>
  );
}