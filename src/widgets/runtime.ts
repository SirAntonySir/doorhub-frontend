// Configuration system - flexible to support any widget
export interface WidgetConfig {
  refreshRate?: number;
  language?: string;
  [key: string]: any; // Allow any additional properties for different widgets
}

const WIDGET_CONFIG_KEY = "doorhub.widget-configs.v1";

// Load configs from localStorage on module load
let widgetConfigs = new Map<string, WidgetConfig>();

// Initialize from localStorage
try {
  const stored = localStorage.getItem(WIDGET_CONFIG_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    widgetConfigs = new Map(Object.entries(parsed));
  }
} catch (error) {
  console.warn("Failed to load widget configs from localStorage:", error);
}

export function setWidgetConfig(widgetId: string, config: WidgetConfig) {
  widgetConfigs.set(widgetId, config);

  // Save to localStorage
  try {
    const serialized = Object.fromEntries(widgetConfigs);
    localStorage.setItem(WIDGET_CONFIG_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.warn("Failed to save widget config to localStorage:", error);
  }
}

export function getWidgetConfig(widgetId: string): WidgetConfig {
  return widgetConfigs.get(widgetId) || {};
}

export function substitute(content: string, widgetId?: string): string {
  const now = new Date();
  const TIME = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const CITY = "Berlin";
  const TEMP = "22";
  const COND = "Cloudy";

  let result = content
    .replaceAll("{TIME}", TIME)
    .replaceAll("{CITY}", CITY)
    .replaceAll("{TEMP}", TEMP)
    .replaceAll("{COND}", COND);

  // Handle dynamic config placeholders
  if (widgetId) {
    const config = getWidgetConfig(widgetId);
    for (const [key, value] of Object.entries(config)) {
      result = result.replaceAll(`{config.${key}}`, String(value || ""));
    }
  }

  return result;
}

// Template substitution for URLs and headers
export function substituteTemplate(
  template: string,
  config: Record<string, any>
): string {
  let result = template;

  // Replace {config.key} placeholders
  for (const [key, value] of Object.entries(config)) {
    result = result.replaceAll(`{config.${key}}`, String(value || ""));
  }

  return result;
}
