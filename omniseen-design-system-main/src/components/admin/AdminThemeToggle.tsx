import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

export default function AdminThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem("omniseen-admin-theme") || "dark");

  useEffect(() => {
    localStorage.setItem("omniseen-admin-theme", theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");

  // Return theme along with toggle button so parent can use it
  return { theme, toggle, ThemeButton: () => (
    <button
      onClick={toggle}
      className="p-2 rounded-lg transition-colors"
      style={{ background: "var(--admin-card2)", border: "1px solid var(--admin-border)" }}
    >
      {theme === "dark" ? <Moon className="h-4 w-4" style={{ color: "var(--admin-cyan)" }} /> : <Sun className="h-4 w-4" style={{ color: "var(--admin-yellow)" }} />}
    </button>
  )};
}
