# Hono Example

This example demonstrates how to use `openapi-decorators` with [Hono](https://hono.dev/).

## Features Demonstrated

- Decorator-based controller routing with `HonoAdapter` (`createHonoAppFromControllers`).
- Universal parameter decorators (`@Param`, `@Query`, `@Body`).
- Direct JSON returning from controller methods without needing manual `res.json` / `c.json`.
- Automatic Swagger UI on Hono with `setupSwaggerUI(app, { path: '/docs', document })`.
- Static OpenAPI document generation via CLI: `npx openapi-decorators generate openapi.config.ts openapi.json`.

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Visit:
- API endpoint: [http://localhost:3000/users](http://localhost:3000/users)
- Swagger UI: [http://localhost:3000/docs](http://localhost:3000/docs)

## Generate OpenAPI Document

```bash
npm run openapi
```
