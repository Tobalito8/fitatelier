"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "@/lib/store/shop";

const NAV_LINKS = [
  { href: "/measurements", label: "Medidas" },
  { href: "/designer", label: "Diseñar" },
  { href: "/orders", label: "Pedidos" },
] as const;

export default function SiteHeader() {
  const pathname = usePathname();
  const { cartCount, hydrated } = useShop();

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          FitAtelier
        </Link>

        <div className="flex items-center gap-1 sm:gap-4">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-stone-100 text-black" : "text-gray-600 hover:text-black"
                )}
              >
                {label}
              </Link>
            );
          })}

          <Link
            href="/cart"
            aria-label="Carrito"
            className="relative rounded-lg p-2 text-gray-600 transition-colors hover:text-black"
          >
            <ShoppingBag className="h-5 w-5" />
            {hydrated && cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            href="/profile"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-black sm:block"
          >
            Perfil
          </Link>
        </div>
      </nav>
    </header>
  );
}
