import { metadataStorage } from '../metadata/metadata-storage.js';
import type { RouteParamType } from '../metadata/metadata-types.js';

function createParamDecorator(type: RouteParamType) {
  return (nameOrTarget?: any, propertyKey?: string | symbol, parameterIndex?: number): any => {
    const decorator = (paramName?: string): ParameterDecorator => {
      return (target: Object, propKey: string | symbol | undefined, index: number) => {
        if (!propKey) return;
        const targetConstructor = (
          typeof target === 'function' ? target : target.constructor
        ) as Function;

        metadataStorage.addRouteParam({
          target: targetConstructor,
          methodName: String(propKey),
          index,
          type,
          paramName,
        });
      };
    };

    // If called directly as decorator: @Param (target, key, index)
    if (typeof parameterIndex === 'number') {
      return decorator()(nameOrTarget, propertyKey, parameterIndex);
    }

    // If called as factory: @Param('id') or @Param()
    const paramName = typeof nameOrTarget === 'string' ? nameOrTarget : undefined;
    return decorator(paramName);
  };
}

/**
 * Route path parameter decorator.
 * Can be used as `@Param('id')`, `@Param()`, or `@Param`.
 *
 * @example
 * ```typescript
 * @Get('/:id')
 * getUser(@Param('id') id: string) { ... }
 * ```
 */
export const Param = createParamDecorator('param');

/**
 * Query parameter decorator.
 * Can be used as `@Query('q')`, `@Query()`, or `@Query`.
 *
 * @example
 * ```typescript
 * @Get('/')
 * listUsers(@Query('limit') limit?: string) { ... }
 * ```
 */
export const Query = createParamDecorator('query');

/**
 * Request body decorator.
 * Can be used as `@Body()` or `@Body`.
 *
 * @example
 * ```typescript
 * @Post('/')
 * createUser(@Body() body: CreateUserDto) { ... }
 * ```
 */
export const Body = createParamDecorator('body');

/**
 * Request header decorator.
 * Can be used as `@Headers('authorization')`, `@Headers()`, or `@Headers`.
 *
 * @example
 * ```typescript
 * @Get('/')
 * getProfile(@Headers('authorization') token: string) { ... }
 * ```
 */
export const Headers = createParamDecorator('header');

/**
 * Native request object decorator.
 * Can be used as `@Req()` or `@Req`.
 */
export const Req = createParamDecorator('req');

/**
 * Native response object decorator.
 * Can be used as `@Res()` or `@Res`.
 */
export const Res = createParamDecorator('res');

/**
 * Framework context decorator.
 * Can be used as `@Context()` or `@Context`.
 * In Hono: provides Hono Context `c`.
 * In Express: provides `{ req, res }`.
 */
export const Context = createParamDecorator('context');

/**
 * Alias for `@Context` / `@Context()`
 */
export const Ctx = Context;
