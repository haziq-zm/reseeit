import { create } from "zustand";

type ThemeMode = "system" | "light" | "dark";

interface AppState {
  theme: ThemeMode;
  receiptSearch: string;
  setTheme: (t: ThemeMode) => void;
  setReceiptSearch: (q: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: "system",
  receiptSearch: "",
  setTheme: (theme) => set({ theme }),
  setReceiptSearch: (receiptSearch) => set({ receiptSearch }),
}));
