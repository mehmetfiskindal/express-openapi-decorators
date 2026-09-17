import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Headers,
  metadataStorage,
  ExpressAdapter,
} from '../../src/index';

describe('ExpressAdapter parameter decorators & return values', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  it('injects @Param, @Query, @Headers and auto-sends returned JSON', async () => {
    @Controller('/users')
    class UserController {
      @Get('/:id')
      async getUser(
        @Param('id') id: string,
        @Query('detail') detail?: string,
        @Headers('x-client') client?: string
      ) {
        return { id, detail: detail ?? 'basic', client: client ?? 'unknown' };
      }
    }

    const app = express();
    app.use(express.json());
    const adapter = new ExpressAdapter(app);
    adapter.registerController(UserController);

    const res = await request(app)
      .get('/users/42?detail=full')
      .set('x-client', 'test-suite');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: '42',
      detail: 'full',
      client: 'test-suite',
    });
  });

  it('injects @Body and handles POST return value', async () => {
    @Controller('/posts')
    class PostController {
      @Post('/')
      createPost(@Body() body: any) {
        return { id: 'new-post-1', title: body.title };
      }
    }

    const app = express();
    app.use(express.json());
    const adapter = new ExpressAdapter(app);
    adapter.registerController(PostController);

    const res = await request(app)
      .post('/posts')
      .send({ title: 'Zero Dependency Journey' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 'new-post-1',
      title: 'Zero Dependency Journey',
    });
  });
});
