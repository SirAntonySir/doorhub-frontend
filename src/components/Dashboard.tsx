import { WidthProvider, Responsive, Layout } from "react-grid-layout";
import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "../store/useDashboard";
import { loadPackage } from "../lib/registry";
import { WidgetRenderer } from "./WidgetRenderer";
import { Sidebar } from "./Sidebar";
import type { GridSize } from "../lib/types";
import { parseGridSize } from "../lib/types";
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

// Remove hardcoded sizes - we'll use parseGridSize utility instead

const TEST_WIDGETS = [
  { id: "order-status", label: "Order Status" },
  { id: "doorhub-dhl-tracking", label: "DHL Tracking" },
  { id: "example-dynamic-sizes", label: "Dynamic Sizes Example" }
];

export default function Dashboard() {
  const { items, add, remove, moveResize, setSize, load } = useDashboard();
  const [packages, setPackages] = useState<Record<string, any>>({});
  const [selectedWidget, setSelectedWidget] = useState("order-status");
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('doorhub.theme') || 'dark');
  const [language, setLanguage] = useState<string>(() => localStorage.getItem('doorhub.language') || 'en');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() =>
    localStorage.getItem('doorhub.sidebar.collapsed') === 'true'
  );
  const [viewportHeight, setViewportHeight] = useState<number>(800);
  const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, widgetId: string } | null>(null);

  useEffect(() => { load(); }, [load]);

  // Handle viewport height changes for mobile browsers
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

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

  // Persist language preference
  useEffect(() => {
    localStorage.setItem('doorhub.language', language);
  }, [language]);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('doorhub.sidebar.collapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  const layouts = useMemo(() => {
    const lg: Layout[] = items.map(it => ({
      i: it.instanceId, x: it.x, y: it.y, w: it.w, h: it.h
    }));
    const md: Layout[] = items.map(it => ({
      i: it.instanceId, x: it.x, y: it.y, w: Math.min(it.w, 4), h: it.h
    }));
    const sm: Layout[] = items.map(it => ({
      i: it.instanceId, x: it.x, y: it.y, w: Math.min(it.w, 3), h: it.h
    }));
    return { lg, md, sm };
  }, [items]);

  function onLayoutChange(current: Layout[]) {
    // Close context menu when layout changes (dragging)
    if (contextMenu) {
      setContextMenu(null);
    }

    const next = items.map(it => {
      const m = current.find(l => l.i === it.instanceId);
      return m ? { ...it, x: m.x, y: m.y, w: m.w, h: m.h } : it;
    });
    moveResize(next);
  }

  const handleAddWidget = () => {
    const pkg = packages[selectedWidget];
    if (!pkg) return;

    // Use the widget's default size or first available size
    const size = pkg.manifest.defaultSize || pkg.manifest.sizes[0];
    const dims = parseGridSize(size);
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
    const dims = parseGridSize(size as GridSize);
    setSize(instanceId, size as GridSize, dims);
  };

  const handleRemoveWidget = (instanceId: string) => {
    remove(instanceId);
    setSelectedWidgets(prev => {
      const next = new Set(prev);
      next.delete(instanceId);
      return next;
    });
  };

  // Gesture handling
  const handleWidgetTap = (e: React.MouseEvent | React.TouchEvent, instanceId: string) => {
    e.stopPropagation();

    if (e.type === 'touchstart') {
      // On touch, toggle selection
      setSelectedWidgets(prev => {
        const next = new Set(prev);
        if (next.has(instanceId)) {
          next.delete(instanceId);
        } else {
          next.add(instanceId);
        }
        return next;
      });
    }
  };

  const handleWidgetLongPress = (e: React.TouchEvent, instanceId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setContextMenu({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      widgetId: instanceId
    });
  };

  const handleContextMenuAction = (action: string, widgetId: string) => {
    // Find the widget instance to get the correct package
    const widget = items.find(item => item.instanceId === widgetId);
    if (!widget) return;

    const pkg = packages[widget.widgetId];

    switch (action) {
      case 'configure':
        if (pkg?.manifest?.capabilities?.includes('config:runtime')) {
          // Configuration logic - prompt for required fields
          const config: Record<string, any> = {};
          let allConfigured = true;

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
              setWidgetConfig(widgetId, config);
              // Trigger a refresh after configuration
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('refresh-widget', {
                  detail: { widgetId }
                }));
              }, 100);
            });
          }
        }
        break;
      case 'refresh':
        if (pkg?.manifest?.capabilities?.includes('refresh:manual') && pkg?.binding) {
          window.dispatchEvent(new CustomEvent('refresh-widget', {
            detail: { widgetId }
          }));
        }
        break;
      case 'remove':
        handleRemoveWidget(widgetId);
        break;
    }
    setContextMenu(null);
  };

  const clearSelection = () => {
    setSelectedWidgets(new Set());
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  return (
    <>
      <Sidebar
        selectedWidget={selectedWidget}
        setSelectedWidget={setSelectedWidget}
        theme={theme}
        setTheme={setTheme}
        onAddWidget={handleAddWidget}
        packages={packages}
        testWidgets={TEST_WIDGETS}
        language={language}
        setLanguage={setLanguage}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className="dashboard-with-sidebar">
        <div className="grid-wrap" style={{
          backgroundImage: `radial-gradient(circle at ${UNIT_W / 2}px ${UNIT_H / 2}px, var(--grid-dot) 1px, transparent 1px)`,
          backgroundSize: `${UNIT_W}px ${UNIT_H}px`,
          padding: 'var(--gap)',
          height: '100vh'
        }}>
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            onLayoutChange={onLayoutChange}
            rowHeight={UNIT_H}
            margin={[GRID_PADDING, GRID_PADDING]}
            cols={{ lg: 8, md: 6, sm: 4, xs: 3, xxs: 2 }}
            maxRows={Math.floor(viewportHeight / UNIT_H)}
            isBounded
            isDraggable={true}
            isResizable={false}
            draggableHandle=".widget-drag-handle"
            preventCollision={false}
            compactType="vertical"
            useCSSTransforms={true}
            transformScale={1}
          >
            {items.map(it => {
              const pkg = packages[it.widgetId];
              const isSelected = selectedWidgets.has(it.instanceId);
              return (
                <div key={it.instanceId} className="rgl-item" data-grid={{ x: it.x, y: it.y, w: it.w, h: it.h }}>
                  <div
                    className={`widget-container ${isSelected ? 'selected' : ''}`}
                    style={{
                      position: 'relative',
                      height: '100%',
                      boxSizing: 'border-box'
                    }}
                    onClick={(e) => handleWidgetTap(e, it.instanceId)}
                    onTouchStart={(e) => {
                      // Handle tap selection
                      handleWidgetTap(e, it.instanceId);

                      // Long press detection
                      const longPressTimer = setTimeout(() => {
                        handleWidgetLongPress(e, it.instanceId);
                      }, 500);

                      const handleTouchEnd = () => {
                        clearTimeout(longPressTimer);
                        document.removeEventListener('touchend', handleTouchEnd);
                      };

                      document.addEventListener('touchend', handleTouchEnd);
                    }}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="selection-indicator">
                        <span className="material-icons">check_circle</span>
                      </div>
                    )}

                    {/* Widget actions - show on hover for desktop */}
                    <div className="widget-actions">
                      <select
                        className="chip size-select"
                        value={it.size}
                        onChange={(e) => handleSizeChange(it.instanceId, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {pkg?.manifest?.sizes?.map((size: string) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                      {pkg && pkg.manifest && (
                        <>
                          {/* Configuration button - show if widget supports runtime configuration */}
                          {pkg.manifest.capabilities?.includes('config:runtime') && (
                            <button
                              className="chip"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContextMenuAction('configure', it.instanceId);
                              }}
                              title="Configure Widget"
                            >
                              <span className="material-icons">settings</span>
                            </button>
                          )}

                          {/* Refresh button - show if widget supports manual refresh and has API binding */}
                          {pkg.manifest.capabilities?.includes('refresh:manual') && pkg.binding && (
                            <button
                              className="chip"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContextMenuAction('refresh', it.instanceId);
                              }}
                              title="Refresh Data"
                            >
                              <span className="material-icons">refresh</span>
                            </button>
                          )}
                        </>
                      )}
                      <button
                        className="chip"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveWidget(it.instanceId);
                        }}
                        title="Remove Widget"
                      >
                        <span className="material-icons">close</span>
                      </button>
                    </div>

                    {/* Widget content with drag handle */}
                    <div className="widget-drag-handle">
                      {pkg ? <WidgetRenderer pkg={pkg} size={it.size} widgetId={it.instanceId} language={language} /> : <div className="card">Loading…</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (() => {
        const widget = items.find(item => item.instanceId === contextMenu.widgetId);
        if (!widget) return null;

        const pkg = packages[widget.widgetId];
        if (!pkg) return null;

        return (
          <div
            className="context-menu"
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 2000
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="context-menu-content">
              {pkg.manifest?.capabilities?.includes('config:runtime') && (
                <button
                  className="context-menu-item"
                  onClick={() => handleContextMenuAction('configure', contextMenu.widgetId)}
                >
                  <span className="material-icons">settings</span>
                  Configure
                </button>
              )}
              {pkg.manifest?.capabilities?.includes('refresh:manual') && pkg.binding && (
                <button
                  className="context-menu-item"
                  onClick={() => handleContextMenuAction('refresh', contextMenu.widgetId)}
                >
                  <span className="material-icons">refresh</span>
                  Refresh
                </button>
              )}
              <button
                className="context-menu-item danger"
                onClick={() => handleContextMenuAction('remove', contextMenu.widgetId)}
              >
                <span className="material-icons">delete</span>
                Remove
              </button>
            </div>
          </div>
        );
      })()}

      {/* Action Bar for Selected Widgets */}
      {selectedWidgets.size > 0 && (
        <div className="action-bar">
          <div className="action-bar-content">
            <span className="action-bar-text">
              {selectedWidgets.size} widget{selectedWidgets.size > 1 ? 's' : ''} selected
            </span>
            <div className="action-bar-actions">
              {/* Size selector for single widget selection */}
              {selectedWidgets.size === 1 && (() => {
                const selectedWidgetId = Array.from(selectedWidgets)[0];
                const widget = items.find(item => item.instanceId === selectedWidgetId);
                const pkg = widget ? packages[widget.widgetId] : null;

                return pkg?.manifest?.sizes ? (
                  <select
                    className="action-bar-select"
                    value={widget?.size || ''}
                    onChange={(e) => {
                      if (widget) {
                        handleSizeChange(widget.instanceId, e.target.value);
                      }
                    }}
                  >
                    {pkg.manifest.sizes.map((size: string) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                ) : null;
              })()}

              <button
                className="action-bar-button"
                onClick={() => {
                  selectedWidgets.forEach(id => handleRemoveWidget(id));
                  clearSelection();
                }}
              >
                <span className="material-icons">delete</span>
                Remove All
              </button>
              <button
                className="action-bar-button"
                onClick={clearSelection}
              >
                <span className="material-icons">close</span>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close context menu */}
      {contextMenu && (
        <div
          className="context-menu-backdrop"
          onClick={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
