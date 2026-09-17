import { ApiProperty, ApiPropertyOptional } from 'openapi-decorators';

export class UserDto {
  @ApiProperty({
    type: String,
    description: 'Unique user identifier',
    example: 'usr_123',
  })
  id!: string;

  @ApiProperty({
    type: String,
    description: 'User full name',
    example: 'Jane Doe',
  })
  name!: string;

  @ApiProperty({
    type: String,
    description: 'Email address',
    example: 'jane@example.com',
  })
  email!: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Optional department',
    example: 'Engineering',
  })
  department?: string;
}

export class CreateUserDto {
  @ApiProperty({
    type: String,
    description: 'User full name',
    example: 'Jane Doe',
  })
  name!: string;

  @ApiProperty({
    type: String,
    description: 'Email address',
    example: 'jane@example.com',
  })
  email!: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Optional department',
    example: 'Engineering',
  })
  department?: string;
}
