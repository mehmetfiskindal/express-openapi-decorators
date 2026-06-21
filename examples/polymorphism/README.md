# Polymorphism Example

Demonstrates how to document a property that can be one of several
DTO classes, using OpenAPI's `oneOf` + `discriminator` composition.

## What it demonstrates

- `@ApiProperty({ oneOf: [...], discriminator: { propertyName: 'kind' } })`
  to emit a polymorphic schema
- The generated spec references `Cat` and `Dog` under `#/components/schemas`
  and the request body shows both with a `kind` discriminator

## How to run

```bash
# from the package root, after `npm install && npm run build`
cd examples/polymorphism
npm install
npm link @developersailor/express-openapi-decorators
npm start
```

The Swagger UI shows a request body with a `pet` field and a schema
selector for the discriminator.

## CLI

```bash
npm run openapi
```

The generated document has:

```json
"PetEnvelope": {
  "type": "object",
  "properties": {
    "pet": {
      "oneOf": [
        { "$ref": "#/components/schemas/Cat" },
        { "$ref": "#/components/schemas/Dog" }
      ],
      "discriminator": { "propertyName": "kind" }
    }
  }
}
```
