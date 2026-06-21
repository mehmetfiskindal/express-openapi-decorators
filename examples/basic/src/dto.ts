import { ApiProperty } from '@developersailor/express-openapi-decorators';

export class UserDto {
  @ApiProperty({ type: String, example: 'u1' })
  id!: string;

  @ApiProperty({ type: String, example: 'Mehmet' })
  name!: string;

  @ApiProperty({ type: String, format: 'email', example: 'mehmet@example.com' })
  email!: string;
}

export class CreateUserDto {
  @ApiProperty({ type: String, example: 'Mehmet' })
  name!: string;

  @ApiProperty({ type: String, format: 'email', example: 'mehmet@example.com' })
  email!: string;
}
