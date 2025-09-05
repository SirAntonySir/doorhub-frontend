export type GridSize = string; // Dynamic sizes like "2x2", "4x2", "4x4", "3x1", "3x3", etc.

export type WidgetManifest = {
  id: string;
  name: string;
  version: string;
  sizes: GridSize[];
  defaultSize?: GridSize;
  capabilities?: string[];
  permissions?: string[];
  assets?: Record<string, string[]>;
};

export type LayoutNode = {
  component: string;
  props?: Record<string, any>;
  children?: LayoutNode[];
};

export type WidgetPackage = {
  manifest: WidgetManifest;
  ui: Record<string, LayoutNode>; // Allow any size key from manifest
  i18n?: Record<string, Record<string, string>>;
  binding?: any;
  transform?: Function;
  configSchema?: any;
  dataSchema?: any;
};

export type InstalledWidget = {
  instanceId: string;
  widgetId: string;
  size: GridSize;
  // react-grid-layout needs grid units; let each unit be 80px wide, 80px tall baseline
  w: number;
  h: number;
  x: number;
  y: number;
};

// Utility function to parse grid size strings like "2x2", "4x2", "3x1" etc.
export function parseGridSize(size: GridSize): { w: number; h: number } {
  const match = size.match(/^(\d+)x(\d+)$/);
  if (!match) {
    console.warn(`Invalid grid size format: ${size}, defaulting to 2x2`);
    return { w: 2, h: 2 };
  }
  return {
    w: parseInt(match[1], 10),
    h: parseInt(match[2], 10),
  };
}
