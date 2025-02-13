# 🧞‍♂️ Aladdin AI Services

An intelligent AI service built with Koa.js, LangChain, and TypeScript.

## Technology Stack

- **Backend Framework**: Koa.js
- **AI/ML**: LangChain (OpenAI Integration)
- **Language**: TypeScript
- **Build Tool**: Webpack
- **Development Tools**: ESLint, Prettier

## Prerequisites

- Node.js (v16 or higher recommended)
- yarn or npm

## 🚀 Quick Start

```bash
# Clone repository
git clone [repository-url]
cd aladdin-ai-services

# Install dependencies
yarn install
```

## Environment Configuration

Create a `.env` file in the root directory:

```env
NODE_ENV=development
# Add other required environment variables
```

## Available Scripts

```bash
# Start development server with hot-reload
yarn dev

# Build for production
yarn build

# Lint code
yarn lint

# Fix linting issues
yarn lint:fix
```

## 📁 Project Structure

```
.
├── README.md                      # Project documentation
├── build.sh                       # Build script
├── dist/                          # Compiled code directory
├── docs/                          # Documentation directory
├── eslint.config.mjs              # ESLint configuration
├── examples/                      # Example implementations
│   ├── index.html                # Example HTML page
│   ├── index.js                  # Example JavaScript code
│   ├── logo.svg                  # Project logo
│   └── styles.css                # Example styles
├── jest.config.js                # Jest testing configuration
├── layer/                        # AWS Lambda layers
│   └── nodejs/                   # Node.js dependencies layer
├── src/                         # Source code directory
│   ├── agents/                  # Agent implementations
│   │   ├── base.agent.ts        # Base agent class
│   │   ├── crypto.agent.ts      # Cryptocurrency agent
│   │   └── defi.agent.ts        # DeFi agent
│   ├── main.ts                  # Application entry point
│   ├── services/                # Service implementations
│   ├── tools/                   # Utility tools
│   └── utils/                   # Utility functions
└── tests/                       # Test directory
```

### Key Directories

- `/src`: Source code including agents, services, and utilities
- `/dist`: Compiled JavaScript code
- `/examples`: Example implementations and demos
- `/docs`: Project documentation
- `/layer`: AWS Lambda layers
- `/tests`: Test files and resources

## Dependencies

### Core Dependencies

- `koa`: ^2.15.3
- `@koa/router`: ^13.1.0
- `@koa/cors`: ^5.0.0
- `koa-bodyparser`: ^4.4.1
- `koa-static`: ^5.0.0
- `@langchain/core`: ^0.3.28
- `@langchain/openai`: ^0.3.16
- `@langchain/community`: ^0.3.24
- `langchain`: ^0.3.10
- `bignumber.js`: ^9.1.2
- `serverless-http`: ^3.2.0
- `dotenv`: ^16.4.7

### Development Dependencies

- TypeScript & related tooling
- Webpack & related plugins
- ESLint & Prettier for code formatting
- Development utilities (ts-node-dev, cross-env)

## Development Guide

1. Start the development server:

```bash
yarn dev
```

2. The server will start with hot-reload enabled

## Production Build

```bash
yarn build
```

This will create a production build in the `dist` directory.

## Code Style

This project uses ESLint and Prettier for code formatting. To maintain consistency:

1. Enable ESLint in your editor
2. Run `yarn lint` to check for issues
3. Run `yarn lint:fix` to automatically fix issues

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Ensure code meets standards
5. Push to your branch
6. Submit a Pull Request

## License

ISC

---

For more information or issues, please [create an issue](repository-issues-url).

## Contact

For questions or suggestions:

- Email: [your-email@example.com]
- Website: [website-url]
