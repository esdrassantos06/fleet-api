import {
  IsString,
  IsEmail,
  MinLength,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

export class CreateUserDTO {
  @IsString()
  @MinLength(3, { message: 'The name must have at least 3 characters.' })
  name: string;

  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must have min length: 8 chars, 1 lowercase, 1 uppercase, 1 number and 1 symbol.',
    },
  )
  @MaxLength(128, { message: 'Password cant have more than 128 chars.' })
  password: string;
}
