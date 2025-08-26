import type { WidgetPackage } from "./types";

// For demo: load packages from /packages/*.json (served from public)
const cache = new Map<string, WidgetPackage>();

export async function loadPackage(id: string): Promise<WidgetPackage> {
  if (cache.has(id)) return cache.get(id)!;

  try {
    // Try new folder structure first
    const indexRes = await fetch(`/packages/${id}/index.json`);
    if (indexRes.ok) {
      const index = await indexRes.json();
      const manifestRes = await fetch(`/packages/${id}/${index.manifest}`);
      if (!manifestRes.ok) throw new Error(`Manifest not found for ${id}`);
      const manifest = await manifestRes.json();

      // Load UI layouts
      const ui: Record<string, any> = {};
      for (const [size, path] of Object.entries(index.ui)) {
        try {
          const layoutRes = await fetch(`/packages/${id}/${path}`);
          if (layoutRes.ok) {
            ui[size] = await layoutRes.json();
          } else {
            console.error(
              `Failed to load UI layout ${size}:`,
              layoutRes.status,
              layoutRes.statusText
            );
          }
        } catch (error) {
          console.error(`Error loading UI layout ${size}:`, error);
        }
      }

      // Load i18n files
      const i18n: Record<string, any> = {};
      for (const [lang, path] of Object.entries(index.i18n || {})) {
        try {
          const i18nRes = await fetch(`/packages/${id}/${path}`);
          if (i18nRes.ok) {
            i18n[lang] = await i18nRes.json();
          } else {
            console.error(
              `Failed to load i18n ${lang}:`,
              i18nRes.status,
              i18nRes.statusText
            );
          }
        } catch (error) {
          console.error(`Error loading i18n ${lang}:`, error);
        }
      }

      // Load binding if present
      let binding;
      if (index.bindings) {
        try {
          const bindingRes = await fetch(`/packages/${id}/${index.bindings}`);
          if (bindingRes.ok) {
            binding = await bindingRes.json();
          } else {
            console.error(
              `Failed to load binding:`,
              bindingRes.status,
              bindingRes.statusText
            );
          }
        } catch (error) {
          console.error(`Error loading binding:`, error);
        }
      }

      // Load schemas if present
      let configSchema, dataSchema;
      if (index.schemas?.config) {
        try {
          const configSchemaRes = await fetch(
            `/packages/${id}/${index.schemas.config}`
          );
          if (configSchemaRes.ok) {
            configSchema = await configSchemaRes.json();
          } else {
            console.error(
              `Failed to load config schema:`,
              configSchemaRes.status,
              configSchemaRes.statusText
            );
          }
        } catch (error) {
          console.error(`Error loading config schema:`, error);
        }
      }
      if (index.schemas?.data) {
        try {
          const dataSchemaRes = await fetch(
            `/packages/${id}/${index.schemas.data}`
          );
          if (dataSchemaRes.ok) {
            dataSchema = await dataSchemaRes.json();
          } else {
            console.error(
              `Failed to load data schema:`,
              dataSchemaRes.status,
              dataSchemaRes.statusText
            );
          }
        } catch (error) {
          console.error(`Error loading data schema:`, error);
        }
      }

      // Load transform logic if present
      let transform;
      if (index.logic) {
        try {
          const logicRes = await fetch(`/packages/${id}/${index.logic}`);
          if (logicRes.ok) {
            const logicCode = await logicRes.text();
            // Create a function from the code
            transform = new Function(
              "api",
              `
              ${logicCode}
              return toDTO(api);
            `
            );
          } else {
            console.error(
              `Failed to load transform logic:`,
              logicRes.status,
              logicRes.statusText
            );
          }
        } catch (error) {
          console.error(`Error loading transform logic:`, error);
        }
      }

      const pkg: WidgetPackage = {
        manifest,
        ui,
        i18n,
        binding,
        configSchema,
        dataSchema,
        transform,
      };

      cache.set(id, pkg);
      return pkg;
    }
  } catch (error) {
    console.warn(`Failed to load package ${id} as folder structure:`, error);
  }

  // Fallback to old single JSON format
  const res = await fetch(`/packages/${id}.json`);
  if (!res.ok) throw new Error(`Package not found: ${id}`);
  const pkg = (await res.json()) as WidgetPackage;
  cache.set(id, pkg);
  return pkg;
}
