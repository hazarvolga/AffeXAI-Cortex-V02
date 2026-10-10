# CMS Components

## Overview
This directory contains the component library for the AffeXAI Cortex CMS system. All components are built with React, TypeScript, and Tailwind CSS, following the AffeXAI Cortex design system.

## Components

### Core Components
- `TextComponent` - For all textual content
- `ButtonComponent` - For actions and navigation
- `ImageComponent` - For displaying images
- `ContainerComponent` - For layout and grouping

### Advanced Components
- `CardComponent` - Content cards with consistent styling
- `GridComponent` - Responsive grid layouts

### Supporting Components
- `PageRenderer` - Renders CMS pages from data structures
- `ComponentConfig` - Configuration interface for components
- `DragDropDemo` - Demonstration of drag-and-drop functionality

## Demo Pages
To view the components in action, visit these demo pages:
- `/cms-demo` - Basic component showcase
- `/cms-demo-enhanced` - Advanced component features
- `/cms-drag-drop-demo` - Drag-and-drop interface demo
- `/cms-responsive-demo` - Responsive design demo
- `/cms-component-test` - Interactive component testing

## Validation
Run the component validation script to ensure all components are properly configured:
```bash
npm run validate-cms
```

## Documentation
- [Design System](../../../DESIGN_SYSTEM.md)
- [Component Usage Guide](../../../CMS_COMPONENTS_GUIDE.md)
- [Implementation Plan](../../../CMS_IMPLEMENTATION_PLAN.md)
- [Database Schema](../../../CMS_DATABASE_SCHEMA.md)