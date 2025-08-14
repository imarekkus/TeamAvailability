import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // On mount, read the saved preference or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
      setIsDark(savedTheme === "dark");
    } else {
      // If no saved theme, default to light
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className="absolute top-4 right-4 px-3 py-2 rounded bg-gray-300 dark:bg-gray-700 text-black dark:text-white shadow"
    >
      {isDark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
