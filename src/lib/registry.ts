import type { WidgetPackage } from "./types"

// For demo: load packages from /packages/*.json (served from public)
const cache = new Map<string, WidgetPackage>();

export async function loadPackage(id: string): Promise<WidgetPackage> {
  if (cache.has(id)) return cache.get(id)!;
  const res = await fetch(`/packages/${id}.json`);
  if (!res.ok) throw new Error(`Package not found: ${id}`);
  const pkg = await res.json() as WidgetPackage;
  cache.set(id, pkg);
  return pkg;
}
