import { useEffect, useMemo, useState } from "react";
import type { GridSize, LayoutNode, WidgetPackage } from "../lib/types";
import { substitute, getWidgetConfig, substituteTemplate } from "../widgets/runtime";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

function Node({ node, widgetId, widgetData, i18nData }: {
  node: LayoutNode;
  widgetId?: string;
  widgetData?: any;
  i18nData?: Record<string, string>;
}) {
  const { component, props, children } = node;
  const style = props?.style ?? {};

  // Handle text substitution with real data
  let text = props?.text;
  if (text) {
    text = substitute(String(text), widgetId);

    // Handle i18n placeholders
    if (i18nData) {
      for (const [key, value] of Object.entries(i18nData)) {
        text = text.replaceAll(`{i18n.${key}}`, value);
      }
    }

    // Handle data placeholders
    if (widgetData) {
      for (const [key, value] of Object.entries(widgetData)) {
        if (typeof value === 'string' || typeof value === 'number') {
          text = text.replaceAll(`{data.${key}}`, String(value));
        }
      }
    }
  }

  if (component === "Card") {
    // Handle style prop properly - it might be a string (like "glass") or an object
    const cardStyle = typeof style === 'object' ? style : {};
    let cardClass = typeof style === 'string' ? `card ${style}` : 'card';

    // Handle className substitution for status-based styling
    if (props?.className) {
      let className = props.className;
      if (widgetData) {
        for (const [key, value] of Object.entries(widgetData)) {
          if (typeof value === 'string' || typeof value === 'number') {
            className = className.replaceAll(`{data.${key}}`, String(value));
          }
        }
      }
      cardClass += ` ${className}`;
    }

    return <div className={cardClass} style={{ ...cardStyle }}>{children?.map((c, i) => <Node key={i} node={c} widgetId={widgetId} widgetData={widgetData} i18nData={i18nData} />)}</div>;
  }
  if (component === "Row") {
    return <div className="widget-row" style={{ gap: props?.space ?? 8, alignItems: props?.align ?? "center" }}>{children?.map((c, i) => <Node key={i} node={c} widgetId={widgetId} widgetData={widgetData} i18nData={i18nData} />)}</div>;
  }
  if (component === "Col" || component === "Column") {
    return <div className="widget-column" style={{ gap: props?.space ?? 8 }}>{children?.map((c, i) => <Node key={i} node={c} widgetId={widgetId} widgetData={widgetData} i18nData={i18nData} />)}</div>;
  }
  if (component === "Text") {
    const textClass = `widget-text ${props?.style || ''}`;
    const wt = props?.style?.includes("title") ? 600 : 400;
    return <div className={textClass} style={{ fontWeight: wt, opacity: props?.muted ? .75 : 1 }}>{text}</div>;
  }
  if (component === "Spacer") return <div className="widget-spacer" />;

  if (component === "Image") {
    let src = props?.src || '';
    if (widgetData) {
      for (const [key, value] of Object.entries(widgetData)) {
        if (typeof value === 'string' || typeof value === 'number') {
          src = src.replaceAll(`{data.${key}}`, String(value));
        }
      }
    }
    return <img src={src} className={props?.className || ''} alt="" />;
  }

  if (component === "StatusIndicator") {
    let status = props?.status || '';
    if (widgetData) {
      for (const [key, value] of Object.entries(widgetData)) {
        if (typeof value === 'string' || typeof value === 'number') {
          status = status.replaceAll(`{data.${key}}`, String(value));
        }
      }
    }
    return <div className={`status-indicator ${status}`} />;
  }

  // Fallback debug
  return <div style={{ border: "1px dashed rgba(255,255,255,.2)", borderRadius: 8, padding: 6 }}>{component}</div>;
}

export function WidgetRenderer({ pkg, size, widgetId }: { pkg: WidgetPackage, size: GridSize, widgetId?: string }) {
  const [widgetData, setWidgetData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [pollInterval, setPollInterval] = useState(300000); // 5 minutes default
  const [i18nData, setI18nData] = useState<Record<string, string>>({});
  const [loadedWidget, setLoadedWidget] = useState<any>(null);

  const fetchData = async () => {
    if (!widgetId || !pkg.binding) return;

    setLoading(true);
    setError(null);

    try {
      // Use the transform function directly from the loaded widget
      let config = getWidgetConfig(widgetId);

      // If no specific config found, try default config for the widget
      if (!config || Object.keys(config).length === 0) {
        if (widgetId?.includes('order-status')) {
          config = getWidgetConfig('default-order-status');
        } else if (widgetId?.includes('dhl-tracking')) {
          config = getWidgetConfig('default-doorhub-dhl-tracking');
        }
      }

      // Build full configuration with defaults
      const fullConfig = {
        refreshRate: 300,
        language: "de",
        ...config,
      };

      // Validate required config fields based on widget's schema
      if (pkg.configSchema?.required) {
        const missingFields = pkg.configSchema.required.filter(
          (field: string) => !config[field]
        );
        if (missingFields.length > 0) {
          throw new Error(`Required configuration missing: ${missingFields.join(', ')}`);
        }
      }

      // Use the widget's own binding and transform
      const binding = pkg.binding;

      // Substitute placeholders in URL and headers
      const apiUrl = substituteTemplate(binding.urlTemplate, fullConfig);
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(binding.headers)) {
        headers[key] = substituteTemplate(String(value), fullConfig);
      }

      // Make API request
      let response;
      try {
        response = await fetch(apiUrl, {
          method: binding.method,
          headers,
          signal: AbortSignal.timeout(binding.timeout || 10000),
        });
      } catch (corsError) {
        if (binding.corsProxy) {
          console.warn("CORS error, trying proxy:", corsError);
          response = await fetch(binding.corsProxy + apiUrl, {
            method: binding.method,
            headers: {
              ...headers,
              Origin: window.location.origin,
            },
            signal: AbortSignal.timeout(binding.timeout || 10000),
          });
        } else {
          throw corsError;
        }
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const rawData = await response.json();

      // Apply transformation if available
      let transformedData = rawData;
      if (pkg.transform && typeof pkg.transform === 'function') {
        transformedData = pkg.transform(rawData);
      }

      setWidgetData(transformedData);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to load widget data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Load widget package and i18n data from the passed pkg
  useEffect(() => {
    // Use the already loaded package data
    setLoadedWidget(pkg);

    // Load i18n data based on user's language preference
    const config = widgetId ? getWidgetConfig(widgetId) : {};
    const language = config.language || 'de'; // Default to German as you set
    const i18n = pkg.i18n?.[language] || pkg.i18n?.['en'] || {};
    setI18nData(i18n);

    // Set poll interval from configuration
    const refreshRate = config.refreshRate || 300;
    setPollInterval(refreshRate * 1000);
  }, [pkg, widgetId]);

  // Initial data fetch - only if widget is properly configured
  useEffect(() => {
    if (pkg) {
      // Check if widget requires configuration and if it's configured
      if (pkg.binding && pkg.configSchema?.required) {
        const config = widgetId ? getWidgetConfig(widgetId) : {};
        const requiredFields = pkg.configSchema.required;
        const hasAllRequired = requiredFields.every((field: string) => config[field]);

        if (hasAllRequired) {
          fetchData();
        }
      } else {
        // For widgets that don't require configuration, fetch immediately
        fetchData();
      }
    }
  }, [pkg, widgetId]);

  // Set up refresh timer for widgets with API access
  useEffect(() => {
    if (!pollInterval || !widgetId || !pkg.binding) return;

    // Only start timer if widget supports auto-refresh
    if (!pkg.manifest.capabilities?.includes('refresh:auto')) return;

    // Only start timer if widget is properly configured (check required fields)
    if (pkg.configSchema?.required) {
      const config = getWidgetConfig(widgetId);
      const requiredFields = pkg.configSchema.required;
      const hasAllRequired = requiredFields.every((field: string) => config[field]);
      if (!hasAllRequired) return;
    }

    const interval = setInterval(() => {
      console.log(`Refreshing widget ${widgetId} data...`);
      fetchData();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [widgetId, pollInterval, pkg]);

  // Listen for manual refresh events
  useEffect(() => {
    if (!widgetId) return;

    const handleRefresh = (event: CustomEvent) => {
      if (event.detail.widgetId === widgetId) {
        console.log(`Manual refresh triggered for widget ${widgetId}`);
        fetchData();
      }
    };

    window.addEventListener('refresh-widget', handleRefresh as EventListener);
    return () => {
      window.removeEventListener('refresh-widget', handleRefresh as EventListener);
    };
  }, [widgetId]);

  const layout = pkg.ui[size] as LayoutNode | undefined;
  if (!layout) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No layout for {size}
        </div>
      </div>
    );
  }

  if (loading && !widgetData && pkg.binding) {
    return (
      <div className={`widget-${size}`} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Loading data...
        </div>
      </div>
    );
  }

  if (error && !widgetData) {
    return (
      <div className={`widget-${size}`} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  // Check if widget requires configuration
  if (!widgetData && pkg.binding && pkg.configSchema?.required) {
    const config = widgetId ? getWidgetConfig(widgetId) : {};
    const requiredFields = pkg.configSchema.required;
    const missingFields = requiredFields.filter((field: string) => !config[field]);

    if (missingFields.length > 0) {
      return (
        <div className={`widget-${size}`} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Please configure: {missingFields.join(', ')}
          </div>
        </div>
      );
    }
  }

  return (
    <div className={`widget-${size}`} style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="widget-content">
        <Node node={layout} widgetId={widgetId} widgetData={widgetData} i18nData={i18nData} />
      </div>
      {lastRefresh && (
        <div style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          fontSize: '10px',
          opacity: 0.6,
          color: 'var(--muted)'
        }}>
          {lastRefresh.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
