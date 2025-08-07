import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { usePreferences } from "../context/AppStateContext";

interface ThemeContextType {
  theme: "light" | "dark" | "system";
  effectiveTheme: "light" | "dark";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { preferences, updatePreferences } = usePreferences();

  const getEffectiveTheme = (
    theme: "light" | "dark" | "system"
  ): "light" | "dark" => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  };

  const effectiveTheme = getEffectiveTheme(preferences.theme);

  const setTheme = (theme: "light" | "dark" | "system") => {
    updatePreferences({ theme });
  };

  // Apply theme to document and handle system theme changes
  useEffect(() => {
    // Always set the theme attribute based on effective theme
    document.documentElement.setAttribute("data-theme", effectiveTheme);
    
    // Add a class to the body for additional theming if needed
    document.body.className = `theme-${effectiveTheme}`;
    
    // Listen for system theme changes if in system mode
    if (preferences.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      const handleSystemThemeChange = () => {
        const newTheme = mediaQuery.matches ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", newTheme);
        document.body.className = `theme-${newTheme}`;
      };

      mediaQuery.addEventListener("change", handleSystemThemeChange);
      return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
    }
    
    // Clean up body class if switching away from system theme
    return () => {
      document.body.className = '';
    };
  }, [effectiveTheme, preferences.theme]);

  const contextValue: ThemeContextType = {
    theme: preferences.theme,
    effectiveTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
