/**
 * Hono adapter for automatic route registration.
 * Registers Hono routes based on decorator metadata.
 */

import { metadataStorage } from '../metadata/metadata-storage.js';
import type { MethodMetadata, MiddlewareReference, RouteParamMetadata } from '../metadata/metadata-types.js';

export type HonoControllerFactory = (controllerClass: Function) => any;

export type HonoMiddleware = (c: any, next: () => Promise<void>) => Promise<Response | void> | Response | void;

export interface HonoAdapterOptions {
  /**
   * Factory function to create controller instances
   * Default: creates new instance with `new controllerClass()`
   */
  controllerFactory?: HonoControllerFactory;

  /**
   * Global prefix for all routes (e.g. '/api')
   */
  globalPrefix?: string;

  /**
   * Global middlewares to apply to all routes
   */
  globalMiddlewares?: HonoMiddleware[];

  /**
   * Named middleware registry for string-based middleware references (@Use('auth'))
   */
  namedMiddlewares?: Record<string, HonoMiddleware>;
}

export interface HonoAppLike {
  get(path: string, ...handlers: any[]): any;
  post(path: string, ...handlers: any[]): any;
  put(path: string, ...handlers: any[]): any;
  patch(path: string, ...handlers: any[]): any;
  delete(path: string, ...handlers: any[]): any;
  use(path: string, ...handlers: any[]): any;
  route?(path: string, subApp: any): any;
}

export class HonoAdapter {
  private options: HonoAdapterOptions;
  private namedMiddlewares: Map<string, HonoMiddleware>;

  constructor(
    private app: HonoAppLike,
    options: HonoAdapterOptions = {}
  ) {
    const defaultControllerFactory: HonoControllerFactory = (controllerClass) => (
      new (controllerClass as new () => any)()
    );

    this.options = {
      ...options,
      controllerFactory: options.controllerFactory ?? defaultControllerFactory,
      globalPrefix: options.globalPrefix ?? '',
      globalMiddlewares: options.globalMiddlewares ?? [],
      namedMiddlewares: options.namedMiddlewares ?? {},
    };

    this.namedMiddlewares = new Map(Object.entries(this.options.namedMiddlewares || {}));
  }

  /**
   * Register a named middleware for string-based references
   */
  registerNamedMiddleware(name: string, middleware: HonoMiddleware): void {
    this.namedMiddlewares.set(name, middleware);
  }

  /**
   * Register multiple named middlewares
   */
  registerNamedMiddlewares(middlewares: Record<string, HonoMiddleware>): void {
    for (const [name, middleware] of Object.entries(middlewares)) {
      this.namedMiddlewares.set(name, middleware);
    }
  }

  /**
   * Resolve a middleware reference
   */
  private resolveMiddleware(ref: MiddlewareReference): HonoMiddleware {
    if (typeof ref === 'function') {
      return ref as unknown as HonoMiddleware;
    }

    const middleware = this.namedMiddlewares.get(ref);
    if (!middleware) {
      throw new Error(
        `Named middleware '${ref}' not found in HonoAdapter. ` +
        `Available middlewares: [${Array.from(this.namedMiddlewares.keys()).join(', ')}]`
      );
    }
    return middleware;
  }

  /**
   * Register multiple controllers
   */
  registerControllers(controllers: Function[]): void {
    for (const controller of controllers) {
      this.registerController(controller);
    }
  }

  /**
   * Register a single controller
   */
  registerController(controller: Function): void {
    const controllerMeta = metadataStorage.findController(controller);
    if (!controllerMeta) {
      // eslint-disable-next-line no-console
      console.warn(`Controller ${controller.name} is not decorated with @Controller()`);
      return;
    }

    const methods = metadataStorage.getMethodsForController(controller);
    const controllerMiddlewares = metadataStorage.getMiddlewaresForController(controller);
    const instance = this.options.controllerFactory!(controller);

    for (const method of methods) {
      this.registerMethod(
        controllerMeta.basePath,
        method,
        instance,
        controllerMiddlewares
      );
    }
  }

  /**
   * Register a single controller method on Hono
   */
  private registerMethod(
    basePath: string,
    method: MethodMetadata,
    instance: any,
    controllerMiddlewares: MiddlewareReference[]
  ): void {
    const fullPath = this.buildPath(basePath, method.path);
    const methodMiddlewares = metadataStorage.getMiddlewaresForMethod(
      method.controllerTarget,
      method.methodName
    );

    const resolvedGlobalMiddlewares = this.options.globalMiddlewares || [];
    const resolvedControllerMiddlewares = controllerMiddlewares.map((m) => this.resolveMiddleware(m));
    const resolvedMethodMiddlewares = methodMiddlewares.map((m) => this.resolveMiddleware(m));

    const middlewares: HonoMiddleware[] = [
      ...resolvedGlobalMiddlewares,
      ...resolvedControllerMiddlewares,
      ...resolvedMethodMiddlewares,
    ];

    const routeParams = metadataStorage.getRouteParamsForMethod(
      method.controllerTarget,
      method.methodName
    );

    const rawHandler = instance[method.methodName].bind(instance);
    const handler = this.wrapHandler(rawHandler, routeParams);

    const httpMethod = method.httpMethod.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';

    if (typeof this.app[httpMethod] === 'function') {
      if (middlewares.length > 0) {
        this.app[httpMethod](fullPath, ...middlewares, handler);
      } else {
        this.app[httpMethod](fullPath, handler);
      }
    } else {
      throw new Error(`Unsupported HTTP method '${method.httpMethod}' on Hono app`);
    }
  }

  /**
   * Build the full path combining globalPrefix, basePath, and methodPath
   */
  private buildPath(basePath: string, methodPath: string): string {
    const globalPrefix = this.options.globalPrefix || '';
    let combined = '';

    if (globalPrefix) {
      combined += globalPrefix.startsWith('/') ? globalPrefix : `/${globalPrefix}`;
      if (combined.endsWith('/')) combined = combined.slice(0, -1);
    }

    if (basePath && basePath !== '/') {
      const normalizedBase = basePath.startsWith('/') ? basePath : `/${basePath}`;
      combined += normalizedBase.endsWith('/') ? normalizedBase.slice(0, -1) : normalizedBase;
    }

    if (methodPath && methodPath !== '/') {
      const normalizedMethod = methodPath.startsWith('/') ? methodPath : `/${methodPath}`;
      combined += normalizedMethod;
    }

    return combined || '/';
  }

  /**
   * Wrap a controller method for Hono execution with parameter extraction and response formatting
   */
  private wrapHandler(
    handler: Function,
    routeParams: RouteParamMetadata[]
  ): (c: any) => Promise<any> {
    return async (c: any) => {
      let args: unknown[];

      if (routeParams.length > 0) {
        const maxIdx = Math.max(...routeParams.map((p) => p.index));
        args = new Array(maxIdx + 1).fill(undefined);

        // Pre-parse body if any body decorator is present
        const hasBody = routeParams.some((p) => p.type === 'body');
        let parsedBody: unknown;
        if (hasBody) {
          try {
            parsedBody = await c.req.json();
          } catch {
            try {
              parsedBody = await c.req.parseBody();
            } catch {
              parsedBody = undefined;
            }
          }
        }

        for (const param of routeParams) {
          switch (param.type) {
            case 'param':
              args[param.index] = param.paramName ? c.req.param(param.paramName) : c.req.param();
              break;
            case 'query':
              args[param.index] = param.paramName ? c.req.query(param.paramName) : c.req.query();
              break;
            case 'body':
              args[param.index] = parsedBody;
              break;
            case 'header':
              args[param.index] = param.paramName ? c.req.header(param.paramName) : c.req.header();
              break;
            case 'req':
              args[param.index] = c.req;
              break;
            case 'res':
              args[param.index] = c.res;
              break;
            case 'context':
              args[param.index] = c;
              break;
          }
        }
      } else {
        // Fallback: pass Hono context `c`
        args = [c];
      }

      const result = await handler(...args);

      // If handler returned a standard Web Response (e.g. c.json(), c.text(), new Response())
      if (result instanceof Response || (result && typeof result === 'object' && typeof (result as any).text === 'function' && 'status' in (result as any))) {
        return result;
      }

      if (result !== undefined) {
        return c.json(result);
      }

      return;
    };
  }
}

/**
 * Helper to create a HonoAdapter
 */
export function createHonoAdapter(
  app: HonoAppLike,
  options?: HonoAdapterOptions
): HonoAdapter {
  return new HonoAdapter(app, options);
}

/**
 * Options for createHonoAppFromControllers
 */
export interface CreateHonoAppOptions extends HonoAdapterOptions {
  /**
   * Optional pre-instantiated Hono app or class constructor
   */
  app?: HonoAppLike;
}

/**
 * Create a configured Hono application from decorated controllers
 */
export function createHonoAppFromControllers(
  controllers: Function[],
  options: CreateHonoAppOptions = {}
): any {
  let app = options.app;
  if (!app) {
    try {
      // Dynamic require so hono remains an optional peer dependency
      const { Hono } = require('hono');
      app = new Hono();
    } catch {
      throw new Error(
        'Hono is required for createHonoAppFromControllers. ' +
        'Please install hono: `npm install hono`.'
      );
    }
  }

  const adapter = new HonoAdapter(app!, options);
  adapter.registerControllers(controllers);
  return app;
}
