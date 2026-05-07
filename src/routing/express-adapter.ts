/**
 * Express adapter for automatic route registration
 * Automatically registers Express routes based on decorator metadata
 */

import type { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { metadataStorage } from '../metadata/metadata-storage.js';
import type { MethodMetadata, MiddlewareFunction, MiddlewareReference } from '../metadata/metadata-types.js';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * Controller instance factory
 */
export type ControllerFactory = (controllerClass: Function) => any;

/**
 * Options for ExpressAdapter
 */
export interface ExpressAdapterOptions {
  /** 
   * Factory function to create controller instances
   * Default: creates new instance with `new controllerClass()`
   */
  controllerFactory?: ControllerFactory | undefined;
  
  /**
   * Global prefix for all routes
   * Example: '/api/v1' will prefix all routes
   */
  globalPrefix?: string;
  
  /**
   * Global middlewares to apply to all routes
   */
  globalMiddlewares?: MiddlewareFunction[];
  
  /**
   * Named middleware registry for string-based middleware references
   * Used to resolve @Middleware('name') decorators
   * @example
   * ```typescript
   * {
   *   auth: authMiddleware,
   *   'roles:admin': requireRoles(['admin'])
   * }
   * ```
   */
  namedMiddlewares?: Record<string, MiddlewareFunction>;
}

/**
 * Express adapter for automatic route registration
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * import { ExpressAdapter } from 'express-openapi-decorators';
 * import { UserController } from './controllers/user.controller';
 * 
 * const app = express();
 * const adapter = new ExpressAdapter(app);
 * 
 * // Register controllers
 * adapter.registerControllers([UserController, OrderController]);
 * 
 * // Or register one by one
 * adapter.registerController(UserController);
 * ```
 */
export class ExpressAdapter {
  private router: Router;
  private options: ExpressAdapterOptions;
  private namedMiddlewares: Map<string, MiddlewareFunction>;

  constructor(
    private app: { use: (path: string, router: Router) => void } | Router,
    options: ExpressAdapterOptions = {}
  ) {
    this.options = {
      controllerFactory: (controllerClass) => new (controllerClass as new () => any)(),
      globalPrefix: '',
      globalMiddlewares: [],
      namedMiddlewares: {},
      ...options,
    };
    
    // Initialize named middlewares registry
    this.namedMiddlewares = new Map(Object.entries(this.options.namedMiddlewares || {}));
    
    // Create a router if app is an Express app
    this.router = this.createRouter();
    
    // Apply global prefix if provided
    if (this.options.globalPrefix) {
      app.use(this.options.globalPrefix, this.router);
    } else {
      // For Express apps, we need to mount differently
      if ('use' in app && typeof app.use === 'function') {
        // It's an Express app, router will be mounted automatically
      }
    }
  }
  
  /**
   * Register a named middleware for string-based references
   * @param name - Middleware name/identifier
   * @param middleware - Middleware function
   */
  registerNamedMiddleware(name: string, middleware: MiddlewareFunction): void {
    this.namedMiddlewares.set(name, middleware);
  }
  
  /**
   * Register multiple named middlewares
   * @param middlewares - Object with name -> middleware pairs
   */
  registerNamedMiddlewares(middlewares: Record<string, MiddlewareFunction>): void {
    for (const [name, middleware] of Object.entries(middlewares)) {
      this.namedMiddlewares.set(name, middleware);
    }
  }
  
  /**
   * Resolve a middleware reference to actual middleware function
   * @param ref - Middleware reference (function or string)
   * @returns Resolved middleware function
   * @throws Error if string reference not found in registry
   */
  private resolveMiddleware(ref: MiddlewareReference): MiddlewareFunction {
    if (typeof ref === 'function') {
      return ref;
    }
    
    const middleware = this.namedMiddlewares.get(ref);
    if (!middleware) {
      throw new Error(
        `Named middleware '${ref}' not found. ` +
        `Make sure to register it via namedMiddlewares option or registerNamedMiddleware(). ` +
        `Available middlewares: [${Array.from(this.namedMiddlewares.keys()).join(', ')}]`
      );
    }
    return middleware;
  }

  /**
   * Create an Express router
   */
  private createRouter(): Router {
    try {
      const express = require('express');
      return express.Router();
    } catch {
      throw new Error('Express is required for ExpressAdapter. Please install express.');
    }
  }

  /**
   * Register multiple controllers
   */
  registerControllers(controllers: Function[]): void {
    for (const controller of controllers) {
      this.registerController(controller);
    }
    
    // Mount the router to the app if not already mounted
    if (this.options.globalPrefix === '' && 'use' in this.app) {
      (this.app as any).use('/', this.router);
    }
  }

  /**
   * Register a single controller
   */
  registerController(controller: Function): void {
    const controllerMeta = metadataStorage.findController(controller);
    if (!controllerMeta) {
      console.warn(`Controller ${controller.name} is not decorated with @Controller()`);
      return;
    }

    const methods = metadataStorage.getMethodsForController(controller);
    const controllerMiddlewares = metadataStorage.getMiddlewaresForController(controller);

    // Create controller instance using factory
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
   * Register a single method
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

    // Resolve all middleware references to functions
    const resolvedGlobalMiddlewares = (this.options.globalMiddlewares || []);
    const resolvedControllerMiddlewares = controllerMiddlewares.map(m => this.resolveMiddleware(m));
    const resolvedMethodMiddlewares = methodMiddlewares.map(m => this.resolveMiddleware(m));
    
    // Combine all middlewares: global -> controller -> method
    const middlewares: MiddlewareFunction[] = [
      ...resolvedGlobalMiddlewares,
      ...resolvedControllerMiddlewares,
      ...resolvedMethodMiddlewares,
    ];

    // Get the handler function from the controller instance
    const handler = instance[method.methodName].bind(instance);

    // Register the route
    const httpMethod = method.httpMethod as HttpMethod;
    
    if (middlewares.length > 0) {
      this.router[httpMethod](fullPath, ...middlewares.map(m => this.wrapMiddleware(m)), handler);
    } else {
      this.router[httpMethod](fullPath, handler);
    }
  }

  /**
   * Build the full path from base path and method path
   */
  private buildPath(basePath: string, methodPath: string): string {
    // Normalize base path
    let fullPath = basePath;
    
    // Ensure no double slashes
    if (methodPath === '/') {
      return fullPath || '/';
    }
    
    if (!methodPath.startsWith('/')) {
      methodPath = '/' + methodPath;
    }
    
    fullPath = basePath + methodPath;
    
    return fullPath;
  }

  /**
   * Wrap a middleware function to handle async errors
   */
  private wrapMiddleware(middleware: MiddlewareFunction): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = middleware(req, res, next);
        if (result && typeof result.then === 'function') {
          result.catch(next);
        }
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Get the Express router
   */
  getRouter(): Router {
    return this.router;
  }
}

/**
 * Create and configure an Express adapter
 * Helper function for quick setup
 * 
 * @example
 * ```typescript
 * const app = express();
 * const adapter = createExpressAdapter(app, {
 *   globalPrefix: '/api',
 *   globalMiddlewares: [cors(), helmet()]
 * });
 * 
 * adapter.registerControllers([UserController, OrderController]);
 * ```
 */
export function createExpressAdapter(
  app: { use: (path: string, router: Router) => void } | Router,
  options?: ExpressAdapterOptions
): ExpressAdapter {
  return new ExpressAdapter(app, options);
}

/**
 * Options for createRouterFromControllers
 */
export interface CreateRouterOptions {
  /**
   * Global prefix for all routes (e.g., '/api/v1')
   */
  prefix?: string;

  /**
   * Global middlewares to apply to all routes
   */
  middlewares?: MiddlewareFunction[];

  /**
   * Controller instance factory
   */
  controllerFactory?: ControllerFactory | undefined;

  /**
   * Named middleware registry for string-based middleware references
   * @example
   * ```typescript
   * {
   *   auth: authMiddleware,
   *   'roles:admin': requireRoles(['admin'])
   * }
   * ```
   */
  namedMiddlewares?: Record<string, MiddlewareFunction>;
}

/**
 * Create an Express router from decorated controllers
 * Simplified API for quick setup
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * import { createRouterFromControllers } from '@developersailor/express-openapi-decorators';
 * import { authMiddleware, requireRoles } from '@developersailor/express-auth';
 * 
 * const app = express();
 * 
 * const router = createRouterFromControllers(
 *   [ProfileController],
 *   {
 *     prefix: '/api',
 *     namedMiddlewares: {
 *       auth: authMiddleware(jwtService),
 *       'roles:admin': requireRoles('admin')
 *     }
 *   }
 * );
 * 
 * app.use(router);
 * ```
 */
export function createRouterFromControllers(
  controllers: Function[],
  options: CreateRouterOptions = {}
): Router {
  const express = require('express');
  const app = express();

  const adapter = new ExpressAdapter(app, {
    globalPrefix: options.prefix || '',
    globalMiddlewares: options.middlewares || [],
    controllerFactory: options.controllerFactory,
    namedMiddlewares: options.namedMiddlewares || {},
  });

  adapter.registerControllers(controllers);

  return adapter.getRouter();
}
