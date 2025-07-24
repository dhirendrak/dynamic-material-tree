# Technology Stack

## Framework & Libraries
- **Angular 19** (next version) - Primary framework
- **Angular Material 19** - UI component library
- **Angular CDK** - Component Development Kit for tree functionality
- **TypeScript 5.5** - Primary language
- **SCSS** - Styling preprocessor
- **RxJS 7.4** - Reactive programming
- **Moment.js** - Date handling (via Material moment adapter)

## Build System
- **Angular CLI** - Build toolchain and development server
- **Karma + Jasmine** - Testing framework

## Common Commands
```bash
# Development
npm start              # Start dev server (ng serve)
npm run build          # Production build
npm run watch          # Development build with watch mode
npm test              # Run unit tests

# Angular CLI shortcuts
ng serve              # Start development server
ng build              # Build the project
ng test               # Run tests
```

## Project Configuration
- Uses standalone components (no NgModules)
- Strict TypeScript configuration enabled
- SCSS styling with Material theming
- Component prefix: `app`
- Source root: `src/`
- Output: `dist/example-app/`

## Key Dependencies
- Zone.js for change detection
- Angular animations for Material components
- Angular localization support included