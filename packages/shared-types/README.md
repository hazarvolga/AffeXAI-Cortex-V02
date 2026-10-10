# @affexai/shared-types

Shared TypeScript type definitions for Affexai frontend and backend applications.

## Installation

```bash
# Install dependencies
npm install

# Build types
npm run build

# Watch mode for development
npm run watch
```

## Usage

### In Frontend (Next.js)
```typescript
import { User, Page, Component } from '@affexai/shared-types';
```

### In Backend (NestJS)
```typescript
import { User, CreateUserDto, UpdateUserDto } from '@affexai/shared-types';
```

## Type Categories

- **User Types**: User entities and DTOs
- **CMS Types**: Page and Component types
- **Auth Types**: Authentication and authorization
- **API Types**: API request/response formats
- **Common Types**: Shared utility types

## Development

When adding new types:
1. Create type file in `src/`
2. Export from `src/index.ts`
3. Run `npm run build`
4. Update documentation

## Type Safety Rules

- All dates should be `Date` objects
- Use enums for status fields
- Required fields should not be optional
- Use strict typing (no `any`)
