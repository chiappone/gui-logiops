# Logiops GUI

A modern GUI application for configuring Logitech devices with logiops on Linux.

## Development Setup

This project is built with Electron, React, and TypeScript.

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
npm install
```

### Development

To start the development environment:

```bash
npm run dev
```

or

```bash
npx electron dist/main/main.js
```

This will start both the webpack dev server for the renderer process and the Electron main process.

### Building

To build the application for production:

```bash
npm run build
```

### Linting

To run ESLint:

```bash
npm run lint
```

To automatically fix linting issues:

```bash
npm run lint:fix
```

### Project Structure

```
src/
├── main/                 # Electron main process
│   ├── main.ts          # Main application entry point
│   └── preload.ts       # Preload script for secure IPC
└── renderer/            # React renderer process
    ├── components/      # React components
    ├── services/        # Business logic and API services
    ├── styles/          # CSS styles
    ├── types/           # TypeScript type definitions
    ├── utils/           # Utility functions
    ├── App.tsx          # Main React component
    ├── index.tsx        # React entry point
    └── index.html       # HTML template
```

### Build Output

```
dist/
├── main/                # Compiled main process
└── renderer/            # Compiled renderer process
```

## Features

This GUI application will provide:

- Intuitive interface for configuring Logitech devices
- Support for DPI settings, button mappings, and gestures
- Real-time configuration validation
- Configuration file preview and export
- Integration with the logid daemon

## License

MIT
