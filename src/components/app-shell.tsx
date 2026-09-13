"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
  Target,
  CreditCard,
  HandCoins,
  PiggyBank,
  Menu,
  X,
  LogOut,
  Wallet,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/receitas", label: "Receitas", icon: ArrowUpCircle },
  { href: "/dashboard/despesas", label: "Despesas", icon: ArrowDownCircle },
  { href: "/dashboard/fluxo-de-caixa", label: "Fluxo de Caixa", icon: Activity },
  { href: "/dashboard/metas", label: "Metas", icon: Target },
  { href: "/dashboard/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/dashboard/dividas", label: "Dívidas", icon: HandCoins },
  { href: "/dashboard/investimentos", label: "Investimentos", icon: PiggyBank },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
            )}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Wallet size={16} />
      </div>
      <span className="text-lg font-semibold tracking-tight text-foreground">Caixa</span>
    </div>
  );
}

export function AppShell({
  memberName,
  onSignOut,
  children,
}: {
  memberName: string;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface p-4 lg:flex">
        <div className="mb-8 mt-1">
          <Logo />
        </div>
        <div className="flex-1">
          <NavLinks />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">{memberName}</div>
            <form action={onSignOut}>
              <button
                type="submit"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <LogOut size={12} /> Sair
              </button>
            </form>
          </div>
          <ThemeToggle className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground" />
        </div>
      </aside>

      {/* Mobile topbar */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover" />
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface p-4 shadow-xl">
            <div className="mb-8 mt-1 flex items-center justify-between">
              <Logo />
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-border pt-4">
              <div className="truncate text-sm font-medium text-foreground">{memberName}</div>
              <form action={onSignOut}>
                <button
                  type="submit"
                  className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <LogOut size={12} /> Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
