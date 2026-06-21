# Basic Example

A minimal CRUD example showing how to use `express-openapi-decorators` to
document a simple `User` resource.

## What it demonstrates

- `@Controller` + `@Get` / `@Post` / `@Param` for routing
- `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBody` for documentation
- `createOpenApiDocument` to build the spec
- `createRouterFromControllers` to wire routes
- `setupSwaggerUI` to serve the interactive UI

## Files

- `src/dto.ts` — `UserDto` and `CreateUserDto` data shapes
- `src/user.controller.ts` — the controller
- `src/server.ts` — the Express bootstrap
- `openapi.config.ts` — the CLI config

## How to run

```bash
# 1. Install dependencies (from the package root)
cd ../..
npm install
npm run build

# 2. From the example directory
cd examples/basic
npm install
npm link @developersailor/express-openapi-decorators

# 3. Start the server
npm start
```

Then visit:

- API root: <http://localhost:3000/users>
- Swagger UI: <http://localhost:3000/docs>

## How to generate the OpenAPI document with the CLI

```bash
npm run openapi
```

This produces `openapi.json` (or `openapi.yaml` with `--format yaml`).

## What to look at

- `user.controller.ts` shows how decorators translate route handlers
  into OpenAPI operations.
- `server.ts` is the minimum glue: `app.use(router)` + `setupSwaggerUI`.
- `openapi.config.ts` is the same info, but consumable by the CLI.
