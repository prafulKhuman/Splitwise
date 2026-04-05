"use client";
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

type Mode = "light" | "dark";
type ThemeCtx = { mode: Mode; toggleMode: () => void };

const ThemeModeContext = createContext<ThemeCtx>({ mode: "light", toggleMode: () => {} });
export const useThemeMode = () => useContext(ThemeModeContext);

const getDesign = (mode: Mode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: "#6C63FF", light: "#8B83FF", dark: "#4B44CC" },
      secondary: { main: "#FF6B8A", light: "#FF8FA8", dark: "#CC5570" },
      success: { main: "#1DC9B7" },
      warning: { main: "#FFB822" },
      error: { main: "#FD397A" },
      background: mode === "dark"
        ? { default: "#121212", paper: "#1E1E2D" }
        : { default: "#F2F3F8", paper: "#FFFFFF" },
      text: mode === "dark"
        ? { primary: "#E4E6EF", secondary: "#8C8CA1" }
        : { primary: "#3F4254", secondary: "#B5B5C3" },
    },
    typography: {
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      h4: { fontWeight: 700, fontSize: "1.5rem", "@media (min-width:600px)": { fontSize: "2rem" } },
      h5: { fontWeight: 700, fontSize: "1.2rem", "@media (min-width:600px)": { fontSize: "1.5rem" } },
      h6: { fontWeight: 600, fontSize: "1rem", "@media (min-width:600px)": { fontSize: "1.25rem" } },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: { body: { WebkitTapHighlightColor: "transparent", overscrollBehavior: "none" } },
      },
      MuiAppBar: { styleOverrides: { root: { borderRadius: 0 } } },
      MuiAvatar: { styleOverrides: { root: { borderRadius: "50%" } } },
      MuiMenu: { styleOverrides: { paper: { borderRadius: "0 !important" } } },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none", fontWeight: 600, borderRadius: 10,
            padding: "10px 20px", minHeight: 44,
            "@media (max-width:600px)": { padding: "8px 16px", fontSize: "0.85rem" },
          },
        },
      },
      MuiTextField: {
        styleOverrides: { root: { "& .MuiOutlinedInput-root": { borderRadius: 10 } } },
      },
      MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiCard: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiDialog: {
        styleOverrides: {
          paper: {
            margin: 16, width: "calc(100% - 32px)", maxHeight: "calc(100% - 32px)",
            "@media (max-width:600px)": {
              margin: 0, width: "100%", maxWidth: "100%", maxHeight: "100%",
              borderRadius: "16px 16px 0 0", position: "fixed", bottom: 0,
            },
          },
        },
      },
      MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    },
  });

export default function ThemeRegistry({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme-mode") as Mode | null;
    if (saved) setMode(saved);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setMode("dark");
  }, []);

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme-mode", next);
      return next;
    });
  };

  const theme = useMemo(() => getDesign(mode), [mode]);

  if (!mounted) return null;

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
