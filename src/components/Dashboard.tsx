import { WidthProvider, Responsive, Layout } from "react-grid-layout";
import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "../store/useDashboard";
import { loadPackage } from "../lib/registry";
import { WidgetRenderer } from "./WidgetRenderer";
import type { GridSize } from "../lib/types";
import { setWidgetConfig } from "../widgets/runtime";


import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

// Read from CSS variables (fallback to numbers if not present)
const cssVar = (name: string, fallback: number) => {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseInt(v.replace("px", ""), 10);
  return Number.isFinite(n) ? n : fallback;
};

const UNIT_W = cssVar("--unit", 80);  // px per grid unit (col)
const UNIT_H = cssVar("--unit", 80);  // px per grid unit (row)
const GRID_PADDING = cssVar("--gap", 12);

const sizeToDims: Record<GridSize, { w: number; h: number }> = {
  "2x2": { w: 2, h: 2 },
  "4x2": { w: 4, h: 2 },
  "4x4": { w: 4, h: 4 },
};

const TEST_WIDGETS = [
  { id: "order-status", label: "Order Status (2x2/4x2/4x4)" },
  { id: "doorhub-dhl-tracking", label: "DHL Tracking (2x2/4x2/4x4)" }
];

export default function Dashboard() {
  const { items, add, remove, moveResize, setSize, load } = useDashboard();
  const [packages, setPackages] = useState<Record<string, any>>({});
  const [selectedWidget, setSelectedWidget] = useState("order-status");
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('doorhub.theme') || 'dark');

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    (async () => {
      const pkgs: Record<string, any> = {};
      for (const w of TEST_WIDGETS) { pkgs[w.id] = await loadPackage(w.id); }
      setPackages(pkgs);
    })();
  }, []);

  // Apply theme to documentElement and persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
    } else {
      root.removeAttribute('data-theme');
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
    }
    localStorage.setItem('doorhub.theme', theme);
  }, [theme]);

  const layouts = useMemo(() => {
    const lg: Layout[] = items.map(it => ({
      i: it.instanceId, x: it.x, y: it.y, w: it.w, h: it.h
    }));
    return { lg };
  }, [items]);

  function onLayoutChange(current: Layout[]) {
    const next = items.map(it => {
      const m = current.find(l => l.i === it.instanceId);
      return m ? { ...it, x: m.x, y: m.y, w: m.w, h: m.h } : it;
    });
    moveResize(next);
  }

  const handleAddWidget = () => {
    const dims = { w: 2, h: 2 };
    const size = '2x2' as GridSize;
    add({ widgetId: selectedWidget, size, ...dims });

    // Set default configuration for widgets
    if (selectedWidget === 'order-status') {
      // Set a default configuration that will be used for any order-status widget
      setWidgetConfig('default-order-status', {
        orderNo: '345338',
        shopNo: 'D4EL',
        refreshRate: 300,
        language: 'de'
      });
    } else if (selectedWidget === 'doorhub-dhl-tracking') {
      // Set default configuration for DHL tracking widget
      setWidgetConfig('default-doorhub-dhl-tracking', {
        apiKey: 'Fz6Rzo3TUOQQ8EL72hTd00PfDUTZtUWv',
        piececode: '358864686560',
        refreshRate: 300,
        language: 'de'
      });
    }
  };

  const handleSizeChange = (instanceId: string, size: string) => {
    const dims = size === '2x2' ? { w: 2, h: 2 } : size === '4x2' ? { w: 4, h: 2 } : { w: 4, h: 4 };
    setSize(instanceId, size as GridSize, dims);
  };

  const handleRemoveWidget = (instanceId: string) => {
    remove(instanceId);
  };

  return (
    <>
      <div className="toolbar">
        <strong>DoorHub</strong>
        <select
          value={selectedWidget}
          onChange={(e) => setSelectedWidget(e.target.value)}
        >
          {TEST_WIDGETS.map(w => (
            <option key={w.id} value={w.id}>{w.label}</option>
          ))}
        </select>
        <button onClick={handleAddWidget}>Add widget</button>
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>

      <div className="grid-wrap" style={{
        backgroundImage: `radial-gradient(circle at ${UNIT_W / 2}px ${UNIT_H / 2}px, var(--grid-dot) 1px, transparent 1px)`,
        backgroundSize: `${UNIT_W}px ${UNIT_H}px`,
        padding: 'var(--gap)'
      }}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={onLayoutChange}
          rowHeight={UNIT_H}
          margin={[GRID_PADDING, GRID_PADDING]}
          cols={{ lg: 8, md: 8, sm: 6, xs: 4, xxs: 2 }}
          isBounded
          draggableHandle=".drag-handle"
        >
          {items.map(it => {
            const pkg = packages[it.widgetId];
            return (
              <div key={it.instanceId} className="rgl-item" data-grid={{ x: it.x, y: it.y, w: it.w, h: it.h }}>
                <div style={{
                  position: 'relative',
                  height: '100%',
                  boxSizing: 'border-box'
                }}>
                  <div className="widget-actions">
                    <button className="chip drag-handle">⇅</button>
                    <select
                      className="chip size-select"
                      value={it.size}
                      onChange={(e) => handleSizeChange(it.instanceId, e.target.value)}
                    >
                      <option value="2x2">2x2</option>
                      <option value="4x2">4x2</option>
                      <option value="4x4">4x4</option>
                    </select>
                    {pkg && pkg.manifest && (
                      <>
                        {/* Configuration button - show if widget supports runtime configuration */}
                        {pkg.manifest.capabilities?.includes('config:runtime') && (
                          <button
                            className="chip"
                            onClick={() => {
                              const config: Record<string, any> = {};
                              let allConfigured = true;

                              // Dynamically prompt for each required field
                              if (pkg.configSchema?.required) {
                                for (const field of pkg.configSchema.required) {
                                  const fieldSchema = pkg.configSchema.properties?.[field];
                                  const title = fieldSchema?.title || field;
                                  const value = prompt(`Enter ${title}:`);
                                  if (value) {
                                    config[field] = value;
                                  } else {
                                    allConfigured = false;
                                    break;
                                  }
                                }
                              }

                              if (allConfigured && Object.keys(config).length > 0) {
                                import('../widgets/runtime').then(({ setWidgetConfig }) => {
                                  setWidgetConfig(it.instanceId, config);

                                  // Trigger a refresh after configuration is complete
                                  setTimeout(() => {
                                    window.dispatchEvent(new CustomEvent('refresh-widget', {
                                      detail: { widgetId: it.instanceId }
                                    }));
                                  }, 100);
                                });
                              }
                            }}
                            title="Configure Widget"
                          >
                            ⚙️
                          </button>
                        )}

                        {/* Refresh button - show if widget supports manual refresh and has API binding */}
                        {pkg.manifest.capabilities?.includes('refresh:manual') && pkg.binding && (
                          <button
                            className="chip"
                            onClick={() => {
                              // Trigger a refresh by dispatching a custom event
                              window.dispatchEvent(new CustomEvent('refresh-widget', {
                                detail: { widgetId: it.instanceId }
                              }));
                            }}
                            title="Refresh Data"
                          >
                            🔄
                          </button>
                        )}
                      </>
                    )}
                    <button
                      className="chip"
                      onClick={() => handleRemoveWidget(it.instanceId)}
                    >
                      ✕
                    </button>
                  </div>
                  {pkg ? <WidgetRenderer pkg={pkg} size={it.size} widgetId={it.instanceId} /> : <div className="card">Loading…</div>}
                </div>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>
    </>
  );
}
