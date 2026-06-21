import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtension,
  ApiCallback,
  ApiExcludeEndpoint,
  Controller,
  Get,
  Post,
  Param,
} from '@developersailor/express-openapi-decorators';
import type { Request, Response } from 'express';
import { OrderDto } from './dto.js';

@ApiBearerAuth()
@ApiTags('Orders')
@Controller('/orders')
// Example of an OpenAPI extension at the controller level
@ApiExtension('x-internal-team', 'fulfilment')
export class OrderController {
  @Get('/:id')
  @ApiOperation({ summary: 'Get an order by id', operationId: 'getOrder' })
  @ApiResponse({ status: 200, description: 'The order', type: OrderDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  get(@Param('id') id: string, res: Response): void {
    res.json({ id });
  }

  @Post('/')
  @ApiOperation({ summary: 'Place an order', operationId: 'placeOrder' })
  @ApiResponse({ status: 201, description: 'Order created', type: OrderDto })
  // Example of a webhook callback declared via @ApiCallback
  @ApiCallback('onShipped', {
    '{$request.body#/shippingWebhookUrl}': {
      post: {
        responses: { '200': { description: 'Webhook received' } },
      },
    },
  })
  place(_req: Request, res: Response): void {
    res.status(201).json({ id: 'new' });
  }

  // Example of an endpoint that's hidden from the OpenAPI document
  @Get('/_internal/metrics')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Internal metrics' })
  metrics(_req: Request, res: Response): void {
    res.json({ ok: true });
  }
}
