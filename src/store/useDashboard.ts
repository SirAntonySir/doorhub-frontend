import { create } from "zustand";
import type { InstalledWidget, GridSize } from "../lib/types";

type State = {
  items: InstalledWidget[];
  add: (w: Omit<InstalledWidget, "instanceId" | "x" | "y">) => void;
  remove: (instanceId: string) => void;
  moveResize: (items: InstalledWidget[]) => void;
  setSize: (
    instanceId: string,
    size: GridSize,
    dims: { w: number; h: number }
  ) => void;
  load: () => void;
  save: () => void;
};

const LS_KEY = "doorhub.dashboard.v1";

export const useDashboard = create<State>((set, get) => ({
  items: [],
  add: (w) => {
    const instanceId = crypto.randomUUID();
    const items = get().items;

    // Find the next available position
    let x = 0,
      y = 0;
    let placed = false;

    // Try to place the widget in the first available position
    while (!placed) {
      // Check if this position is available
      const isOccupied = items.some(
        (item) =>
          item.x < x + w.w &&
          item.x + item.w > x &&
          item.y < y + w.h &&
          item.y + item.h > y
      );

      if (!isOccupied) {
        placed = true;
      } else {
        // Move to next position
        x += 2;
        if (x >= 6) {
          // Wrap to next row
          x = 0;
          y += 2;
        }
      }
    }

    const next = [...items, { instanceId, x, y, ...w }];
    set({ items: next });
    get().save();
  },
  remove: (id) => {
    set({ items: get().items.filter((i) => i.instanceId !== id) });
    get().save();
  },
  moveResize: (items) => {
    set({ items });
    get().save();
  },
  setSize: (id, size, dims) => {
    const next = get().items.map((i) =>
      i.instanceId === id ? { ...i, size, ...dims } : i
    );
    set({ items: next });
    get().save();
  },
  load: () => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      set({ items: JSON.parse(raw) });
    } catch {}
  },
  save: () => localStorage.setItem(LS_KEY, JSON.stringify(get().items)),
}));
