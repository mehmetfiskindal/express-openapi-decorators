# Upload Example

Demonstrates how to document a multipart file upload endpoint.

## What it demonstrates

- `@ApiConsumes('multipart/form-data')` to set the request content type
- `@ApiFile(options)` to declare a single file upload
- The generated spec produces a `multipart/form-data` request body
  with a `string`/`binary` field per `@ApiFile`

## How to run

```bash
# from the package root, after running `npm install && npm run build`
cd examples/upload
npm install
npm link @developersailor/express-openapi-decorators
npm start
```

Try uploading with curl:

```bash
curl -i -F "avatar=@./some-image.png" http://localhost:3000/uploads/avatar
```

The Swagger UI shows a "Choose File" button for the `avatar` field.

## CLI

```bash
npm run openapi
```

The generated document will contain a `multipart/form-data` body schema
with `avatar` as a `binary` string.
