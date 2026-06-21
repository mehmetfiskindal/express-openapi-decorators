import { ApiProperty } from '@developersailor/express-openapi-decorators';

export class Cat {
  @ApiProperty({ type: String, example: 'cat' })
  kind: 'cat' = 'cat';

  @ApiProperty({ type: String, example: 'Whiskers' })
  name!: string;

  @ApiProperty({ type: Number, example: 9 })
  lives!: number;
}

export class Dog {
  @ApiProperty({ type: String, example: 'dog' })
  kind: 'dog' = 'dog';

  @ApiProperty({ type: String, example: 'Rex' })
  name!: string;

  @ApiProperty({ type: Number, example: 12 })
  barkLoudness!: number;
}
