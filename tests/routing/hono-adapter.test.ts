import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Headers,
  Context,
  Use,
  metadataStorage,
  HonoAdapter,
  createHonoAdapter,
  createHonoAppFromControllers,
} from '../../src/index';

describe('HonoAdapter', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  it('registers basic GET route on Hono app', async () => {
    @Controller('/users')
    class UserController {
      @Get('/')
      list() {
        return { users: ['Alice', 'Bob'] };
      }
    }

    const app = new Hono();
    const adapter = new HonoAdapter(app);
    adapter.registerController(UserController);

    const res = await app.request('/users');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ users: ['Alice', 'Bob'] });
  });

  it('handles parameterized routes with @Param decorator', async () => {
    @Controller('/users')
    class UserController {
      @Get('/:id')
      getUser(@Param('id') id: string) {
        return { id, name: 'Alice' };
      }
    }

    const app = new Hono();
    const adapter = createHonoAdapter(app);
    adapter.registerController(UserController);

    const res = await app.request('/users/123');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ id: '123', name: 'Alice' });
  });

  it('handles query parameters with @Query decorator', async () => {
    @Controller('/search')
    class SearchController {
      @Get('/')
      search(@Query('q') query: string, @Query('limit') limit?: string) {
        return { query, limit: limit ?? '10' };
      }
    }

    const app = new Hono();
    const adapter = new HonoAdapter(app);
    adapter.registerControllers([SearchController]);

    const res = await app.request('/search?q=typescript&limit=25');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ query: 'typescript', limit: '25' });
  });

  it('handles POST body with @Body decorator', async () => {
    @Controller('/items')
    class ItemController {
      @Post('/')
      createItem(@Body() body: any) {
        return { created: true, ...body };
      }
    }

    const app = new Hono();
    const adapter = new HonoAdapter(app);
    adapter.registerController(ItemController);

    const res = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Gadget', price: 99 }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ created: true, name: 'Gadget', price: 99 });
  });

  it('handles headers with @Headers decorator', async () => {
    @Controller('/auth')
    class AuthController {
      @Get('/me')
      getMe(@Headers('authorization') authHeader: string) {
        return { token: authHeader };
      }
    }

    const app = new Hono();
    const adapter = new HonoAdapter(app);
    adapter.registerController(AuthController);

    const res = await app.request('/auth/me', {
      headers: { Authorization: 'Bearer secret123' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ token: 'Bearer secret123' });
  });

  it('injects Hono context via @Context decorator', async () => {
    @Controller('/ctx')
    class ContextController {
      @Get('/')
      testCtx(@Context() c: any) {
        return c.text('Hello from context');
      }
    }

    const app = new Hono();
    const adapter = new HonoAdapter(app);
    adapter.registerController(ContextController);

    const res = await app.request('/ctx');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe('Hello from context');
  });

  it('passes Hono context as default when no parameter decorators are used', async () => {
    @Controller('/native')
    class NativeController {
      @Get('/')
      getNative(c: any) {
        return c.json({ path: c.req.path });
      }
    }

    const app = new Hono();
    const adapter = new HonoAdapter(app);
    adapter.registerController(NativeController);

    const res = await app.request('/native');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ path: '/native' });
  });

  it('supports global prefix', async () => {
    @Controller('/test')
    class TestController {
      @Get('/hello')
      hello() {
        return { message: 'hi' };
      }
    }

    const app = new Hono();
    const adapter = new HonoAdapter(app, { globalPrefix: '/api/v1' });
    adapter.registerController(TestController);

    const res = await app.request('/api/v1/test/hello');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ message: 'hi' });
  });

  it('executes global, controller, and method middlewares in order', async () => {
    const sequence: string[] = [];

    const globalMid = async (c: any, next: any) => {
      sequence.push('global');
      await next();
    };

    const ctrlMid = async (c: any, next: any) => {
      sequence.push('ctrl');
      await next();
    };

    const methodMid = async (c: any, next: any) => {
      sequence.push('method');
      await next();
    };

    @Use(ctrlMid)
    @Controller('/mid')
    class MidController {
      @Use(methodMid)
      @Get('/')
      test() {
        sequence.push('handler');
        return { ok: true };
      }
    }

    const app = new Hono();
    const adapter = new HonoAdapter(app, {
      globalMiddlewares: [globalMid],
    });
    adapter.registerController(MidController);

    const res = await app.request('/mid');
    expect(res.status).toBe(200);
    expect(sequence).toEqual(['global', 'ctrl', 'method', 'handler']);
  });

  it('resolves named middlewares in HonoAdapter', async () => {
    let authPassed = false;
    const authMid = async (c: any, next: any) => {
      authPassed = true;
      await next();
    };

    @Controller('/protected')
    class ProtectedController {
      @Use('auth')
      @Get('/')
      index() {
        return { secure: true };
      }
    }

    const app = new Hono();
    const adapter = new HonoAdapter(app, {
      namedMiddlewares: {
        auth: authMid,
      },
    });
    adapter.registerController(ProtectedController);

    const res = await app.request('/protected');
    expect(res.status).toBe(200);
    expect(authPassed).toBe(true);
  });

  it('createHonoAppFromControllers returns fully configured app', async () => {
    @Controller('/orders')
    class OrderController {
      @Get('/')
      getOrders() {
        return [{ id: 1 }, { id: 2 }];
      }
    }

    const app = createHonoAppFromControllers([OrderController], {
      globalPrefix: '/v2',
    });

    const res = await app.request('/v2/orders');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([{ id: 1 }, { id: 2 }]);
  });
});
