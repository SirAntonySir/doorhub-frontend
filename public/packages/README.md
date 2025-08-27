# 🎯 **DoorHub Widget Generator Prompt**

You are tasked with creating a new widget package for the DoorHub dashboard system. Follow this exact structure and format to create a complete, functional widget.

## 📋 **REQUIRED OUTPUT STRUCTURE**

Create a complete widget package with the following folder structure:

```
widget-name/
├── manifest.json
├── index.json
├── bindings/
│   └── source.json
├── logic/
│   └── transform.js
├── schema/
│   ├── config.schema.json
│   └── data.schema.json
├── ui/
│   └── layouts/
│       ├── 2x2.json
│       ├── 4x2.json
│       └── 4x4.json
├── i18n/
│   ├── en.json
│   └── de.json
└── assets/
    └── icon.svg
```

## 🔧 **TECHNICAL SPECIFICATIONS**

### **Available UI Components:**

- `Card` - Container with props: `style` (string), `padding` (number), `className` (string)
- `Row` - Horizontal layout with props: `align` ("center", "baseline"), `space` (number)
- `Column` - Vertical layout with props: `space` (number)
- `Text` - Text display with props: `style` ("largeTitle", "title1", "caption"), `text` (string)
- `Image` - Image display with props: `src` (string), `className` (string)
- `Spacer` - Flexible space filler
- `StatusIndicator` - Status dot with props: `status` (string)

### **Available Card Styles:**

- `glass` - Transparent glass effect
- `solid` - Solid background
- `warning` - Warning state styling
- `success` - Success state styling
- `info` - Info state styling
- `status-delivered` - Green gradient for delivered items
- `status-processing` - Purple gradient for processing items
- `status-error` - Red gradient for error states

### **Data Substitution Patterns:**

- `{data.fieldName}` - Substitute with transformed data
- `{i18n.key}` - Substitute with internationalized text
- `{config.fieldName}` - Substitute with user configuration

### **Widget Sizes:**

- `2x2` - Small widget (120px min-height, 8px padding, 12px font)
- `4x2` - Medium widget (120px min-height, 12px padding, 13px font)
- `4x4` - Large widget (240px min-height, 16px padding, 14px font)

## 📋 **DETAILED REQUIREMENTS**

### **1. manifest.json**

```json
{
  "id": "com.company.widget_name",
  "name": "Widget Display Name",
  "version": "1.0.0",
  "description": "Brief description of what the widget does",
  "author": {
    "name": "Company Name",
    "email": "support@company.com",
    "website": "https://company.com"
  },
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
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
  "permissions": ["network:api-domain.com"],
  "security": {
    "contentSecurityPolicy": "default-src 'self' https://api-domain.com; img-src 'self' data:",
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
```

### **2. index.json**

```json
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
```

### **3. bindings/source.json**

```json
{
  "method": "GET",
  "urlTemplate": "https://api.example.com/endpoint?param1={config.param1}&param2={config.param2}",
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
```

### **4. logic/transform.js**

```javascript
/**
 * Transform raw API response -> DTO conforming to schema/data.schema.json
 * @param {any} api
 * @returns {any} dto
 */
export function toDTO(api) {
  if (!api || typeof api !== "object")
    return {
      // Default values for error state
    };

  // Map API response to DTO structure
  return {
    // Transform API fields to DTO fields
    // Include status mapping for styling
    // Include logo path if applicable
  };
}
```

### **5. schema/config.schema.json**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "WidgetConfig",
  "type": "object",
  "properties": {
    "apiKey": {
      "type": "string",
      "title": "API Key",
      "description": "Your API key for authentication"
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
  "required": ["apiKey"]
}
```

### **6. schema/data.schema.json**

```json
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
```

### **7. i18n/en.json & de.json**

```json
{
  "widget_title": "Widget Title",
  "primary_label": "Primary Label",
  "secondary_label": "Secondary Label"
}
```

### **8. ui/layouts/ (2x2.json, 4x2.json, 4x4.json)**

```json
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
        {
          "component": "Image",
          "props": { "src": "{data.logo}", "className": "brand-logo" }
        },
        {
          "component": "Text",
          "props": { "style": "caption", "text": "{i18n.widget_title}" }
        },
        { "component": "Spacer" },
        {
          "component": "Text",
          "props": { "style": "caption", "text": "{data.primaryField}" }
        }
      ]
    },
    {
      "component": "Text",
      "props": { "style": "title1", "text": "{data.secondaryField}" }
    },
    {
      "component": "StatusIndicator",
      "props": { "status": "{data.status}" }
    }
  ]
}
```

## 🎨 **DESIGN GUIDELINES**

1. **Use appropriate card styles** based on data status (status-delivered, status-processing, status-error)
2. **Include brand logos** when applicable using the Image component
3. **Use StatusIndicator** for visual status feedback
4. **Scale content appropriately** for different widget sizes
5. **Provide meaningful i18n keys** for all user-facing text
6. **Handle error states** gracefully in the transform function

## 🔄 **API INTEGRATION PATTERNS**

1. **Authentication**: Use `{config.apiKey}` in headers
2. **Parameters**: Use `{config.paramName}` in URL templates
3. **Language**: Use `{config.language}` for internationalization
4. **Refresh**: Use `{config.refreshRate}` for polling intervals
5. **CORS**: Include corsProxy for cross-origin requests

## ✅ **VALIDATION CHECKLIST**

Before submitting, ensure:

- [ ] All JSON files are valid JSON
- [ ] All required fields are present in schemas
- [ ] Transform function handles error cases
- [ ] i18n files have matching keys
- [ ] Layouts work for all three sizes
- [ ] API endpoint is accessible and documented
- [ ] Status mapping is consistent across components

---

**Now create a complete widget package following this exact structure and format. Provide the API endpoint details and I'll generate the complete widget package for you.**
