# Aladdin AI Services

This project provides AI-powered services built with Mastra and OpenAI.

## Overview

Aladdin AI Services is a collection of AI agents that offer various functionalities through a unified interface. The project leverages Mastra to create and manage AI agents with access to specialized tools.

## Features

- AI-powered agents for different domains
- Integration with OpenAI's models
- Custom tools for enhanced capabilities
- Easy-to-use development environment

## Prerequisites

- Node.js 18 or higher
- Yarn package manager
- OpenAI API key

## Installation

Clone the repository and install dependencies:

```bash
git clone [repository-url]
cd aladdin-ai-services
yarn install
```

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
OPENAI_API_KEY=your_openai_api_key
```

## Development

Start the development server:

```bash
yarn dev
```

This will launch the Mastra development environment where you can test your agents.

## Project Structure

```
aladdin-ai-services/
├── src/
│   ├── agents/
│   │   └── [agent files]
│   ├── tools/
│   │   └── [tool files]
│   └── index.ts
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- `@mastra/core`: Core library for creating AI agents
- `@ai-sdk/openai`: SDK for OpenAI integration
- `edwin-sdk`: SDK for Edwin platform
- `zod`: Schema validation library

## Adding Dependencies

To add new dependencies:

```bash
yarn add package-name
```

To add development dependencies:

```bash
yarn add package-name --dev
```

## Development Dependencies

- `typescript`: TypeScript compiler
- `tsx`: TypeScript execution engine
- `@types/node`: TypeScript definitions for Node.js

## Scripts

- `yarn dev`: Start development server

## License

ISC

## Author

[Your Name/Organization]