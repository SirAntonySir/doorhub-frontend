# Widget Package Standards

## Standard Capabilities

Widgets communicate their capabilities to the frontend through the `capabilities` array in their `manifest.json`:

### Configuration Capabilities

- `config:user` - Widget can be configured by user (basic)
- `config:runtime` - Widget supports runtime configuration (⚙️ button)

### Refresh Capabilities

- `refresh:manual` - Widget supports manual refresh (🔄 button)
- `refresh:auto` - Widget supports automatic refresh (timer)

### Network Capabilities

- `net:https` - Widget can make HTTPS requests
- `cache:local` - Widget can use local caching

### Internationalization

- `i18n:dynamic` - Widget supports dynamic language switching

## Example Manifest

```json
{
  "id": "com.example.my_widget",
  "name": "My Widget",
  "version": "1.0.0",
  "capabilities": [
    "config:runtime",
    "refresh:manual",
    "refresh:auto",
    "net:https",
    "cache:local",
    "i18n:dynamic"
  ],
  "sizes": ["2x2", "4x2"],
  "defaultSize": "2x2"
}
```

## Required Files

```
my-widget/
├── manifest.json          # Widget metadata & capabilities
├── ui/
│   ├── 2x2.json          # Layout for 2x2 size
│   └── 4x2.json          # Layout for 4x2 size
├── i18n/
│   ├── en.json           # English translations
│   └── de.json           # German translations
├── bindings/
│   └── source.json       # API configuration
├── logic/
│   └── transform.js      # Data transformation
└── schema/
    ├── config.schema.json # Configuration schema
    └── data.schema.json   # Data schema
```

## Frontend Integration

The frontend automatically:

- Shows ⚙️ button if `config:runtime` capability is present
- Shows 🔄 button if `refresh:manual` capability is present
- Starts auto-refresh timer if `refresh:auto` capability is present
- Validates configuration against `config.schema.json`
- Loads translations based on user language preference
