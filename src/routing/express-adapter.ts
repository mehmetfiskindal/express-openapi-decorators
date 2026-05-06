/**
 * Express adapter for automatic route registration
 * Automatically registers Express routes based on decorator metadata
 */

import type { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { metadataStorage } from '../metadata/metadata-storage.js';
import type { MethodMetadata, MiddlewareFunction } from '../metadata/metadata-types.js';

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
  controllerFactory?: ControllerFactory;
  
  /**
   * Global prefix for all routes
   * Example: '/api/v1' will prefix all routes
   */
  globalPrefix?: string;
  
  /**
   * Global middlewares to apply to all routes
   */
  globalMiddlewares?: MiddlewareFunction[];
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

  constructor(
    private app: { use: (path: string, router: Router) => void } | Router,
    options: ExpressAdapterOptions = {}
  ) {
    this.options = {
      controllerFactory: (controllerClass) => new (controllerClass as new () => any)(),
      globalPrefix: '',
      globalMiddlewares: [],
      ...options,
    };
    
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
    
    // Create controller instance
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
    controllerMiddlewares: MiddlewareFunction[]
  ): void {
    const fullPath = this.buildPath(basePath, method.path);
    const methodMiddlewares = metadataStorage.getMiddlewaresForMethod(
      method.controllerTarget,
      method.methodName
    );
    
    // Combine all middlewares: global -> controller -> method
    const middlewares: MiddlewareFunction[] = [
      ...(this.options.globalMiddlewares || []),
      ...controllerMiddlewares,
      ...methodMiddlewares,
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
