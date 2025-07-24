# Project Structure

## Root Level
- `src/` - Application source code
- `node_modules/` - Dependencies
- `angular.json` - Angular CLI configuration
- `package.json` - Project dependencies and scripts
- `tsconfig.*.json` - TypeScript configurations
- `karma.conf.js` - Test configuration

## Source Structure (`src/`)
```
src/
├── main.ts                    # Application bootstrap
├── index.html                 # Main HTML template
├── styles.scss               # Global styles and Material theme
├── test.ts                   # Test configuration
├── tree-dynamic-example.ts   # Main component (root component)
├── dynamic-data-source.ts    # Tree data source implementation
├── dynamic-database.ts       # Data service for tree nodes
└── tree-data.ts             # Static tree data definition
```

## Architecture Patterns

### Component Structure
- **Standalone Components**: All components use standalone: true
- **Signal-based State**: Uses Angular signals for reactive state management
- **Dependency Injection**: Services injected via `inject()` function
- **OnPush Change Detection**: Optimized change detection strategy

### Data Flow
1. `DynamicDatabase` - Provides tree data and node operations
2. `DynamicDataSource` - Implements CDK DataSource for tree control
3. `TreeDynamicExample` - Main component orchestrating the tree display
4. `DynamicFlatNode` - Node model with loading state signals

### File Naming Conventions
- Components: `kebab-case.ts` (e.g., `tree-dynamic-example.ts`)
- Services: `kebab-case.ts` (e.g., `dynamic-database.ts`)
- Data files: `kebab-case.ts` (e.g., `tree-data.ts`)
- Interfaces/Models: Defined within component files

### Import Organization
- Angular core imports first
- Angular Material imports grouped
- Local imports last
- Standalone component imports in decorator