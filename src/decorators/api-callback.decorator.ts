import { metadataStorage } from '../metadata/metadata-storage.js';
import type { OperationObject } from '../types/openapi.types.js';

/**
 * Shape of a single OpenAPI callback entry.
 * Mirrors the structure of a `paths` object so users can describe the
 * outgoing HTTP request the API will make when an event happens.
 *
 * @example
 * ```typescript
 * const onOrderShipped: ApiCallbackDefinition = {
 *   '{$request.query.url}': {
 *     post: {
 *       requestBody: { ... },
 *       responses: { '200': { description: 'Webhook received' } }
 *     }
 *   }
 * };
 * ```
 */
export type ApiCallbackDefinition = Record<string, OperationObject | Record<string, unknown>>;

/**
 * @ApiCallback — declares a webhook / callback entry on an operation.
 * Callbacks are emitted under `operation.callbacks.<name>` in the
 * generated OpenAPI document.
 *
 * @param name - Name of the callback entry (the key under `callbacks`)
 * @param definition - Path-item-like object describing the callback
 *
 * @example
 * ```typescript
 * @Post('/orders')
 * @ApiCallback('onShipped', {
 *   '{$request.body#/shippingWebhookUrl}': {
 *     post: {
 *       requestBody: { ... },
 *       responses: { '200': { description: 'OK' } }
 *     }
 *   }
 * })
 * placeOrder() {}
 * ```
 */
export function ApiCallback(
  name: string,
  definition: ApiCallbackDefinition
): MethodDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    // Flatten the definition into one or more path-expression entries.
    // OpenAPI's `callbacks` map is `{ name: { 'expression': pathItem } }`.
    for (const [expression, pathItem] of Object.entries(definition)) {
      metadataStorage.addCallback({
        target: target.constructor,
        methodName: propertyKey as string,
        name,
        expression,
        pathItem: pathItem as Record<string, unknown>,
      });
    }
  };
}

/**
 * @ApiCallbacks — shorthand for declaring multiple named callbacks
 * on a single operation.
 *
 * @example
 * ```typescript
 * @ApiCallbacks({
 *   onShipped: { '{$request.body#/shippingWebhookUrl}': { post: { ... } } },
 *   onCancelled: { '{$request.body#/cancellationWebhookUrl}': { post: { ... } } },
 * })
 * ```
 */
export function ApiCallbacks(
  definitions: Record<string, ApiCallbackDefinition>
): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    for (const [name, definition] of Object.entries(definitions)) {
      const dec = ApiCallback(name, definition);
      // The decorator is a MethodDecorator; we call it explicitly with
      // the three arguments to satisfy TS's strict signature check.
      (dec as MethodDecorator)(target, propertyKey, descriptor);
    }
  };
}
