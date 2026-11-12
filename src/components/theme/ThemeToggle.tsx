"use client";

import { useEffect, useState } from "react";
import { tinyButtonClass } from "@/lib/ui";

const THEME_KEY = "tablero-tema";
const THEME_EVENT = "tablero-tema-change";
const themeButtonClass = `${tinyButtonClass} min-w-24 shrink-0 whitespace-nowrap`;

type ThemeChoice = "system" | "light" | "dark";

function isStoredTheme(value: string | null): value is ThemeChoice {
  return value === "light" || value === "dark" || value === "system";
}

function readTheme(): ThemeChoice {
  const stored = localStorage.getItem(THEME_KEY);
  return isStoredTheme(stored) ? stored : "dark";
}

function applyTheme(choice: ThemeChoice) {
  document.documentElement.setAttribute("data-theme", choice);
  const dark =
    choice === "dark" ||
    (choice === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#09090b" : "#fafafa");
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [choice, setChoice] = useState<ThemeChoice>("dark");

  useEffect(() => {
    function syncTheme() {
      const next = readTheme();
      applyTheme(next);
      setChoice(next);
      setMounted(true);
    }

    syncTheme();
    window.addEventListener(THEME_EVENT, syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener(THEME_EVENT, syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  function cycle() {
    const order: ThemeChoice[] = ["dark", "light", "system"];
    const next = order[(order.indexOf(choice) + 1) % order.length] ?? "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    setChoice(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  if (!mounted) {
    return (
      <button type="button" className={themeButtonClass} aria-label="Cambiar tema">
        Oscuro
      </button>
    );
  }

  const label = choice === "light" ? "Claro" : choice === "system" ? "Sistema" : "Oscuro";

  return (
    <button type="button" className={themeButtonClass} onClick={cycle} aria-label="Cambiar tema">
      {label}
    </button>
  );
}
