#!/usr/bin/env bash
set -euo pipefail

WIDGET_DIR="doorhub-dhl-tracking"
mkdir -p "$WIDGET_DIR"/{bindings,logic,schema,ui/layouts,i18n,assets}

#####################################
# manifest.json
#####################################
cat > "$WIDGET_DIR/manifest.json" << 'JSON'
{
  "id": "com.doorhub.dhl_tracking",
  "name": "DHL Tracking",
  "version": "1.0.0",
  "description": "Track a DHL parcel and show live status, progress, and delivery state.",
  "author": {
    "name": "DoorHub",
    "email": "support@doorhub.example",
    "website": "https://doorhub.example"
  },
  "license": "MIT",
  "keywords": ["dhl", "tracking", "parcel", "logistics"],
  "category": "productivity",
  "rating": 4.5,
  "downloads": 1000,
  "sdk": {
    "min": "1.0.0",
    "target": "1.2.0",
    "apis": ["layout:v1", "data:v1", "config:v1", "i18n:v1"]
  },
  "sizes": ["2x2", "4x2", "4x4"],
  "defaultSize": "2x2",
  "capabilities": [
    "net:https",
    "cache:local",
    "config:user",
    "i18n:dynamic",
    "config:runtime",
    "refresh:manual",
    "refresh:auto"
  ],
  "permissions": ["network:www.dhl.de"],
  "security": {
    "contentSecurityPolicy": "default-src 'self' https://www.dhl.de; img-src 'self' data:",
    "sandbox": ["allow-scripts", "allow-same-origin"]
  },
  "i18n": {
    "supported": ["en", "de"],
    "default": "en"
  },
  "assets": {
    "icon": "assets/icon.svg"
  },
  "dependencies": [],
  "platform": {
    "min": "web:2021",
    "browsers": ["chrome:90", "firefox:88", "safari:14"]
  }
}
JSON

#####################################
# index.json
#####################################
cat > "$WIDGET_DIR/index.json" << 'JSON'
{
  "manifest": "manifest.json",
  "schemas": {
    "config": "schema/config.schema.json",
    "data": "schema/data.schema.json"
  },
  "ui": {
    "2x2": "ui/layouts/2x2.json",
    "4x2": "ui/layouts/4x2.json",
    "4x4": "ui/layouts/4x4.json"
  },
  "bindings": "bindings/source.json",
  "logic": "logic/transform.js",
  "i18n": {
    "en": "i18n/en.json",
    "de": "i18n/de.json"
  },
  "assets": {
    "icon": "assets/icon.svg"
  }
}
JSON

#####################################
# bindings/source.json
#####################################
cat > "$WIDGET_DIR/bindings/source.json" << 'JSON'
{
  "method": "GET",
  "urlTemplate": "https://www.dhl.de/int-verfolgen/data/search?piececode={config.piececode}&language={config.language}",
  "poll": "{config.refreshRate}",
  "headers": {
    "Accept": "application/json",
    "Authorization": "Bearer {config.apiKey}",
    "Accept-Language": "{config.language}"
  },
  "timeout": 10000,
  "retries": 2,
  "corsProxy": "https://cors-anywhere.herokuapp.com/",
  "transform": "logic/transform.js"
}
JSON

#####################################
# logic/transform.js
#####################################
cat > "$WIDGET_DIR/logic/transform.js" << 'JS'
/**
 * Transform raw DHL API response -> DTO conforming to schema/data.schema.json
 * Sources:
 * - DHL Unified tracking states (pre-transit, transit, delivered, failure, unknown)
 * - dhl.de "int-verfolgen" JSON fields (sendungen[0].sendungsdetails.*, sendungNichtGefunden.*)
 *
 * @param {any} api
 * @returns {any} dto
 */
export function toDTO(api) {
  const fallback = {
    primaryField: "-",
    secondaryField: "No data",
    status: "unknown",
    logo: "assets/icon.svg"
  };

  if (!api || typeof api !== "object") return fallback;

  try {
    const s = Array.isArray(api.sendungen) ? api.sendungen[0] : null;
    if (!s) return fallback;

    // "not found" handling
    const notFound = s.sendungNichtGefunden && (
      s.sendungNichtGefunden.keineDatenVerfuegbar === true ||
      s.sendungNichtGefunden.keineDhlPaketSendung === true
    );

    const details = s.sendungsdetails || {};
    const number = details.sendungsnummern?.sendungsnummer || s.id || "-";
    const delivered = details.istZugestellt === true;
    const returned = details.retoure === true || details.ruecksendung === true;
    const progress = details.sendungsverlauf?.fortschritt ?? null;
    const progressMax = details.sendungsverlauf?.maximalFortschritt ?? null;

    // Map to widget status (used for StatusIndicator + card gradient class)
    // Align with DHL unified states: delivered | transit | failure | pre-transit | unknown
    let status = "unknown";
    if (notFound) status = "failure";               // treat as error in UI
    else if (returned) status = "failure";
    else if (delivered) status = "delivered";
    else if (progress !== null && progressMax !== null) {
      status = progress > 0 ? "transit" : "pre-transit";
    } else {
      status = "transit";
    }

    // UI style class mapping (Card style via className="status-{data.status}")
    // DoorHub styles available: status-delivered, status-processing, status-error
    // Map DHL states -> DoorHub style keyword
    const styleStatus =
      status === "delivered" ? "delivered" :
      status === "failure"   ? "error" :
                               "processing";

    // Build secondary text
    const pct = (progress !== null && progressMax) ? Math.round((progress / progressMax) * 100) : null;
    let secondary = "—";
    if (status === "delivered") secondary = "Delivered";
    else if (status === "failure") secondary = returned ? "Returned to sender" : "Not found";
    else if (status === "pre-transit") secondary = "Label created";
    else if (status === "transit") secondary = pct !== null ? `In transit (${pct}%)` : "In transit";

    return {
      primaryField: number,
      secondaryField: secondary,
      status: styleStatus,           // delivered | processing | error
      logo: "assets/icon.svg"
    };
  } catch {
    return fallback;
  }
}
JS

#####################################
# schema/config.schema.json
#####################################
cat > "$WIDGET_DIR/schema/config.schema.json" << 'JSON'
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "WidgetConfig",
  "type": "object",
  "properties": {
    "apiKey": {
      "type": "string",
      "title": "API Key",
      "description": "Optional. For proxied/auth flows. Not required for public DHL endpoint."
    },
    "piececode": {
      "type": "string",
      "title": "Tracking Number (piececode)",
      "description": "DHL tracking number, e.g., 358864686560"
    },
    "refreshRate": {
      "type": "integer",
      "minimum": 30,
      "maximum": 3600,
      "default": 300,
      "title": "Refresh Rate (seconds)",
      "description": "How often to refresh the data"
    },
    "language": {
      "type": "string",
      "enum": ["en", "de"],
      "default": "en",
      "title": "Language",
      "description": "Display language"
    }
  },
  "required": ["apiKey", "piececode"]
}
JSON

#####################################
# schema/data.schema.json
#####################################
cat > "$WIDGET_DIR/schema/data.schema.json" << 'JSON'
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "WidgetDTO",
  "type": "object",
  "required": ["primaryField"],
  "properties": {
    "primaryField": { "type": "string" },
    "secondaryField": { "type": "string" },
    "status": { "type": "string" },
    "logo": { "type": "string" }
  }
}
JSON

#####################################
# i18n/en.json
#####################################
cat > "$WIDGET_DIR/i18n/en.json" << 'JSON'
{
  "widget_title": "DHL Tracking",
  "primary_label": "Tracking No.",
  "secondary_label": "Status"
}
JSON

#####################################
# i18n/de.json
#####################################
cat > "$WIDGET_DIR/i18n/de.json" << 'JSON'
{
  "widget_title": "DHL Sendungsverfolgung",
  "primary_label": "Sendungsnr.",
  "secondary_label": "Status"
}
JSON

#####################################
# ui/layouts/2x2.json
#####################################
cat > "$WIDGET_DIR/ui/layouts/2x2.json" << 'JSON'
{
  "component": "Card",
  "props": {
    "style": "glass",
    "padding": 8,
    "className": "status-{data.status}"
  },
  "children": [
    {
      "component": "Row",
      "props": { "align": "center", "space": 8 },
      "children": [
        { "component": "Image", "props": { "src": "{data.logo}", "className": "brand-logo" } },
        { "component": "Text", "props": { "style": "caption", "text": "{i18n.widget_title}" } },
        { "component": "Spacer" },
        { "component": "Text", "props": { "style": "caption", "text": "{data.primaryField}" } }
      ]
    },
    { "component": "Text", "props": { "style": "title1", "text": "{data.secondaryField}" } },
    { "component": "StatusIndicator", "props": { "status": "{data.status}" } }
  ]
}
JSON

#####################################
# ui/layouts/4x2.json
#####################################
cat > "$WIDGET_DIR/ui/layouts/4x2.json" << 'JSON'
{
  "component": "Card",
  "props": {
    "style": "glass",
    "padding": 12,
    "className": "status-{data.status}"
  },
  "children": [
    {
      "component": "Row",
      "props": { "align": "center", "space": 8 },
      "children": [
        { "component": "Image", "props": { "src": "{data.logo}", "className": "brand-logo" } },
        { "component": "Text", "props": { "style": "caption", "text": "{i18n.widget_title}" } },
        { "component": "Spacer" },
        { "component": "Text", "props": { "style": "caption", "text": "{data.primaryField}" } }
      ]
    },
    { "component": "Text", "props": { "style": "title1", "text": "{data.secondaryField}" } },
    { "component": "StatusIndicator", "props": { "status": "{data.status}" } }
  ]
}
JSON

#####################################
# ui/layouts/4x4.json
#####################################
cat > "$WIDGET_DIR/ui/layouts/4x4.json" << 'JSON'
{
  "component": "Card",
  "props": {
    "style": "glass",
    "padding": 16,
    "className": "status-{data.status}"
  },
  "children": [
    {
      "component": "Row",
      "props": { "align": "center", "space": 12 },
      "children": [
        { "component": "Image", "props": { "src": "{data.logo}", "className": "brand-logo" } },
        { "component": "Column", "props": { "space": 4 }, "children": [
          { "component": "Text", "props": { "style": "caption", "text": "{i18n.widget_title}" } },
          { "component": "Text", "props": { "style": "caption", "text": "{i18n.primary_label}: {data.primaryField}" } }
        ]},
        { "component": "Spacer" },
        { "component": "StatusIndicator", "props": { "status": "{data.status}" } }
      ]
    },
    { "component": "Text", "props": { "style": "largeTitle", "text": "{data.secondaryField}" } }
  ]
}
JSON

#####################################
# assets/icon.svg
#####################################
cat > "$WIDGET_DIR/assets/icon.svg" << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="DHL">
  <rect x="2" y="12" width="60" height="40" rx="8" fill="#ffcc00"/>
  <path d="M10 32h16l-2 6H8l2-6zm18 0h16l-2 6H26l2-6zm18 0h8l-2 6h-8l2-6z" fill="#e31b23"/>
  <circle cx="48" cy="44" r="6" fill="#111"/>
  <circle cx="20" cy="44" r="6" fill="#111"/>
</svg>
SVG

echo "✅ Widget package created at: $WIDGET_DIR"
