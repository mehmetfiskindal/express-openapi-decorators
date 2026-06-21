import { ApiProperty } from '@developersailor/express-openapi-decorators';

export class OrderDto {
  @ApiProperty({ type: String, example: 'ord_1' })
  id!: string;

  @ApiProperty({ type: String, example: 'pending' })
  status!: 'pending' | 'shipped' | 'cancelled';

  @ApiProperty({ type: Number, example: 1999 })
  amountCents!: number;
}
