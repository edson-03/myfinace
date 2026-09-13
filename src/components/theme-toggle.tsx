"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  if (dark === null) {
    return <div className={className} style={{ width: 36, height: 36 }} />;
  }

  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema"
      className={className}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
