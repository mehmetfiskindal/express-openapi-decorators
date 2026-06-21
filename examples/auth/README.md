# Auth Example

Demonstrates how to document a Bearer-token-protected endpoint.

## What it demonstrates

- `@ApiBearerAuth(name, options)` on a controller (or method)
- `@Use(authMiddleware)` to apply a route-level middleware
- A toy `bearerAuth` middleware that returns 401 on missing tokens
- Documented `401` and `200` responses

## How to run

```bash
# from the package root, after running `npm install && npm run build`
cd examples/auth
npm install
npm link @developersailor/express-openapi-decorators
npm start
```

Then try:

```bash
# Without token — 401
curl -i http://localhost:3000/profile/

# With a (fake) token — 200
curl -i -H "Authorization: Bearer anything" http://localhost:3000/profile/
```

The Swagger UI at <http://localhost:3000/docs> shows the lock icon next
to the `/profile/` route and lets you paste a token to authorize the
request.

## CLI

```bash
npm run openapi
```

The generated spec includes the `bearerAuth` security scheme in
`components.securitySchemes` and a `security: [{ bearerAuth: [] }]` block
on the protected operation.
