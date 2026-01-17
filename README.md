# auto-dimmer

Chrome extension that automatically dims bright webpages based on visual brightness detection.

Unlike dark mode extensions that manipulate CSS (often breaking layouts), Auto Dimmer works by overlaying a transparent layer that dims bright pages without affecting the underlying design.

## Features

- Automatic brightness detection by sampling visible page pixels
- Smooth, animated dimming transitions
- Dynamic mode that continuously adjusts dimming based on page content
- Per-site settings with individual dim intensity controls
- Whitelist (always dim) and blacklist (never dim) for specific sites
- Manual override control
- Persists settings across browser sessions

## Installation

### Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `auto-dimmer` directory

### Generate Icons

To generate proper PNG icons from the SVG source:

```bash
npm run generate-icons
```

## Usage

Click the extension icon to access settings:

- **Enable/Disable** - Toggle the extension globally
- **Dim Intensity** - How much to dim bright pages (0-100%)
- **Brightness Threshold** - Pages brighter than this will be dimmed
- **Dynamic Mode** - Continuously adjust dimming based on content changes
- **Smooth Transitions** - Animate dimming changes
- **Per-Site Settings** - Configure specific sites differently
- **Whitelist/Blacklist** - Always or never dim specific sites
- **Manual Control** - Override automatic dimming

## Development

```bash
npm install      # Install dependencies
npm run build    # Build TypeScript
npm run watch    # Build with watch mode
npm run format   # Format code with Prettier
```

## License

MIT
