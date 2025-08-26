export type GridSize = "2x2" | "4x2" | "4x4";

export type WidgetManifest = {
  id: string;
  name: string;
  version: string;
  sizes: GridSize[];
  assets?: Record<string,string[]>;
};

export type LayoutNode = {
  component: string;
  props?: Record<string, any>;
  children?: LayoutNode[];
};

export type WidgetPackage = {
  manifest: WidgetManifest;
  ui: Record<GridSize, LayoutNode>;
  // Minimal demo: config/data schemas are omitted but can be added (JSON Schema)
};

export type InstalledWidget = {
  instanceId: string;
  widgetId: string;
  size: GridSize;
  // react-grid-layout needs grid units; let each unit be 80px wide, 80px tall baseline
  w: number; h: number; x: number; y: number;
};
