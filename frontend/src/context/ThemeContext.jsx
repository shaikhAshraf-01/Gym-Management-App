import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "gymops-theme"; // stored value: "light" | "dark"

function getInitialTheme() {
  if (typeof window === "undefined") return "dark";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  // No saved preference yet -> keep the app's current look (dark) as
  // the default, so nobody's screen changes without them choosing to.
  return "dark";
}

// Wrap the app with this once (see main.jsx). It keeps a `dark` class
// on <html> in sync with the chosen theme -- Tailwind's `dark:`
// variant is configured (see index.css) to key off that class instead
// of the OS's prefers-color-scheme, so the toggle is fully manual and
// persists across sessions via localStorage.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside a <ThemeProvider>");
  }
  return context;
}