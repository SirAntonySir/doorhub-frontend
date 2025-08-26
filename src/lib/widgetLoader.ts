import type { WidgetPackage } from "./types";

export interface WidgetManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email: string;
    website: string;
  };
  license: string;
  keywords: string[];
  category: string;
  rating: number;
  downloads: number;
  sdk: {
    min: string;
    target: string;
    apis: string[];
  };
  sizes: string[];
  defaultSize: string;
  capabilities?: string[];
  permissions?: string[];
  security: {
    contentSecurityPolicy: string;
    sandbox: string[];
  };
  i18n: {
    supported: string[];
    default: string;
  };
  assets: {
    icon: string;
    screenshots?: string[];
    preview?: string;
  };
  dependencies: string[];
  platform: {
    min: string;
    browsers: string[];
  };
}

export interface WidgetPackageIndex {
  manifest: string;
  schemas: {
    config?: string;
    data?: string;
  };
  ui: Record<string, string>;
  bindings?: string;
  logic?: string;
  i18n: Record<string, string>;
  assets: Record<string, string>;
  tests?: Record<string, string>;
}

export interface LoadedWidget {
  manifest: WidgetManifest;
  ui: Record<string, any>;
  binding?: any;
  i18n: Record<string, any>;
  configSchema?: any;
  dataSchema?: any;
  transform?: Function;
}

class WidgetLoader {
  private cache = new Map<string, LoadedWidget>();
  private baseUrl = "/packages";

  async loadWidget(widgetId: string): Promise<LoadedWidget> {
    // Check cache first
    if (this.cache.has(widgetId)) {
      return this.cache.get(widgetId)!;
    }

    try {
      // Load package index
      const indexResponse = await fetch(
        `${this.baseUrl}/${widgetId}/index.json`
      );
      if (!indexResponse.ok) {
        throw new Error(`Widget package not found: ${widgetId}`);
      }
      const packageIndex: WidgetPackageIndex = await indexResponse.json();

      // Load manifest
      const manifestResponse = await fetch(
        `${this.baseUrl}/${widgetId}/${packageIndex.manifest}`
      );
      if (!manifestResponse.ok) {
        throw new Error(`Widget manifest not found: ${widgetId}`);
      }
      const manifest: WidgetManifest = await manifestResponse.json();

      // Validate SDK compatibility
      if (!this.isCompatible(manifest.sdk)) {
        throw new Error(
          `Widget ${widgetId} requires SDK ${manifest.sdk.min} or higher`
        );
      }

      // Load UI layouts
      const ui: Record<string, any> = {};
      for (const [size, path] of Object.entries(packageIndex.ui)) {
        try {
          const layoutResponse = await fetch(
            `${this.baseUrl}/${widgetId}/${path}`
          );
          if (layoutResponse.ok) {
            ui[size] = await layoutResponse.json();
          }
        } catch (error) {
          console.warn(
            `Failed to load layout ${size} for widget ${widgetId}:`,
            error
          );
        }
      }

      // Load i18n files
      const i18n: Record<string, any> = {};
      for (const [lang, path] of Object.entries(packageIndex.i18n)) {
        try {
          const i18nResponse = await fetch(
            `${this.baseUrl}/${widgetId}/${path}`
          );
          if (i18nResponse.ok) {
            i18n[lang] = await i18nResponse.json();
          }
        } catch (error) {
          console.warn(
            `Failed to load i18n ${lang} for widget ${widgetId}:`,
            error
          );
        }
      }

      // Load optional components
      let binding, configSchema, dataSchema, transform;

      // Load binding if present
      if (packageIndex.bindings) {
        try {
          const bindingResponse = await fetch(
            `${this.baseUrl}/${widgetId}/${packageIndex.bindings}`
          );
          if (bindingResponse.ok) {
            binding = await bindingResponse.json();
          }
        } catch (error) {
          console.warn(`Failed to load binding for widget ${widgetId}:`, error);
        }
      }

      // Load schemas if present
      if (packageIndex.schemas.config) {
        try {
          const schemaResponse = await fetch(
            `${this.baseUrl}/${widgetId}/${packageIndex.schemas.config}`
          );
          if (schemaResponse.ok) {
            configSchema = await schemaResponse.json();
          }
        } catch (error) {
          console.warn(
            `Failed to load config schema for widget ${widgetId}:`,
            error
          );
        }
      }

      if (packageIndex.schemas.data) {
        try {
          const schemaResponse = await fetch(
            `${this.baseUrl}/${widgetId}/${packageIndex.schemas.data}`
          );
          if (schemaResponse.ok) {
            dataSchema = await schemaResponse.json();
          }
        } catch (error) {
          console.warn(
            `Failed to load data schema for widget ${widgetId}:`,
            error
          );
        }
      }

      // Load transform logic if present
      if (packageIndex.logic) {
        try {
          const logicResponse = await fetch(
            `${this.baseUrl}/${widgetId}/${packageIndex.logic}`
          );
          if (logicResponse.ok) {
            const logicCode = await logicResponse.text();
            // Create a function from the code
            const logicFunction = new Function(
              "api",
              `
              ${logicCode}
              return toDTO(api);
            `
            );
            transform = logicFunction;
          }
        } catch (error) {
          console.warn(
            `Failed to load transform logic for widget ${widgetId}:`,
            error
          );
        }
      }

      const loadedWidget: LoadedWidget = {
        manifest,
        ui,
        binding,
        i18n,
        configSchema,
        dataSchema,
        transform,
      };

      // Cache the loaded widget
      this.cache.set(widgetId, loadedWidget);
      return loadedWidget;
    } catch (error) {
      console.error(`Failed to load widget ${widgetId}:`, error);
      throw error;
    }
  }

  private isCompatible(sdk: { min: string }): boolean {
    // Simple version check - in production, use proper semver
    const currentSDK = "1.2.0";
    return currentSDK >= sdk.min;
  }

  async getAvailableWidgets(): Promise<string[]> {
    // In a real implementation, this would query a widget registry/store
    // For demo purposes, return just the order-status widget
    return ["order-status"];
  }

  async searchWidgets(
    query: string,
    category?: string
  ): Promise<WidgetManifest[]> {
    // In a real implementation, this would search a widget store
    const widgets = await this.getAvailableWidgets();
    const manifests: WidgetManifest[] = [];

    for (const widgetId of widgets) {
      try {
        const widget = await this.loadWidget(widgetId);
        if (
          widget.manifest.name.toLowerCase().includes(query.toLowerCase()) ||
          widget.manifest.description
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          widget.manifest.keywords.some((k) =>
            k.toLowerCase().includes(query.toLowerCase())
          )
        ) {
          if (!category || widget.manifest.category === category) {
            manifests.push(widget.manifest);
          }
        }
      } catch (error) {
        console.warn(`Failed to load widget ${widgetId} during search:`, error);
      }
    }

    return manifests;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const widgetLoader = new WidgetLoader();
