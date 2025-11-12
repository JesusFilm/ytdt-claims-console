# Contributing

Thank you for your interest in contributing to ytdt-claims-console!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/ytdt-claims-console.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development

### Prerequisites

- Node.js (see `.nvmrc` or `package.json` for version)
- pnpm (version specified in `packageManager` field)

### Running the Development Server

```bash
pnpm dev
```

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint errors
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm test` - Run tests
- `pnpm test:ui` - Run tests with UI
- `pnpm test:coverage` - Run tests with coverage
- `pnpm type-check` - Run TypeScript type checking

## Code Style

- Code is automatically formatted with Prettier
- ESLint is used for linting
- Pre-commit hooks (via husky) will run linting and formatting automatically

## Making Changes

1. Make your changes
2. Ensure tests pass: `pnpm test`
3. Ensure linting passes: `pnpm lint`
4. Ensure type checking passes: `pnpm type-check`
5. Format your code: `pnpm format`

## Submitting Changes

1. Commit your changes: `git commit -m "Add feature: description"`
2. Push to your fork: `git push origin feature/your-feature-name`
3. Open a Pull Request on GitHub

## Pull Request Guidelines

- Provide a clear description of your changes
- Reference any related issues
- Ensure all CI checks pass
- Keep PRs focused and reasonably sized

## Questions?

Feel free to open an issue for any questions or concerns.
