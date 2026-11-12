import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateUserDTO } from './create-user.dto';

const passwordErrors = async (password: string) => {
  const dto = plainToInstance(CreateUserDTO, {
    name: 'Ana',
    email: 'ana@example.com',
    password,
  });
  const errors = await validate(dto);
  return errors.find((e) => e.property === 'password')?.constraints ?? {};
};

describe('CreateUserDTO password', () => {
  it('accepts 8+ characters with lowercase, uppercase, a number and a symbol', async () => {
    await expect(passwordErrors('Secret123!')).resolves.toEqual({});
  });

  it('tells the user a symbol is required when it is missing', async () => {
    const constraints = await passwordErrors('Secret123');

    expect(Object.values(constraints).join(' ')).toMatch(/symbol/i);
  });
});
