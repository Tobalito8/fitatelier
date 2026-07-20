import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-gray-500 sm:flex-row">
        <p>© {new Date().getFullYear()} FitAtelier — vestidos a tu medida.</p>
        <div className="flex gap-4">
          <Link href="/measurements" className="hover:text-black">
            Medidas
          </Link>
          <Link href="/designer" className="hover:text-black">
            Diseñar
          </Link>
          <Link href="/orders" className="hover:text-black">
            Pedidos
          </Link>
        </div>
      </div>
    </footer>
  );
}
