# Advanced Example

A kitchen-sink example combining many of the decorators in one place.

## What it demonstrates

- `@ApiBearerAuth()` — controller-level Bearer security
- `@ApiTags` + top-level `tags: [{...}]` for richer tag descriptions
- `@ApiExtension('x-internal-team', 'fulfilment')` — adding a custom
  `x-*` extension at the controller level (inherited by every operation)
- `@ApiCallback` on a POST — declaring a webhook the API will call
- `@ApiExcludeEndpoint()` on a metrics route — keeping it out of the
  public document while still serving the route at runtime

## How to run

```bash
# from the package root, after `npm install && npm run build`
cd examples/advanced
npm install
npm link @developersailor/express-openapi-decorators
npm start
```

The `/_internal/metrics` route is reachable but does not appear in
the Swagger UI or the generated document.

## CLI

```bash
npm run openapi
```

The generated document includes:

- A `bearer` security scheme
- A `tags` array with the description
- An `x-internal-team: fulfilment` field on every operation
- A `callbacks.onShipped` block on the POST
- No entry for the `/_internal/metrics` route
