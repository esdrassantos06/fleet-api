import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = { register: vi.fn(), login: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();
    controller = moduleRef.get(AuthController);
  });

  it('registers through the auth service', async () => {
    const body = {
      name: 'Ana',
      email: 'ana@example.com',
      password: 'Secret123',
    };
    authService.register.mockResolvedValue({ id: 'u1', email: body.email });

    await expect(controller.register(body)).resolves.toEqual({
      id: 'u1',
      email: body.email,
    });
    expect(authService.register).toHaveBeenCalledWith(body);
  });

  it('logs in the user that the local strategy attached to the request', () => {
    const user = { id: 'u1', email: 'ana@example.com' };
    authService.login.mockReturnValue({ access_token: 'token' });

    const result = controller.login({ user } as never);

    expect(authService.login).toHaveBeenCalledWith(user);
    expect(result).toEqual({ access_token: 'token' });
  });

  it('returns the user that the JWT strategy attached to the request', () => {
    const user = { userId: 'u1', email: 'ana@example.com' };

    expect(controller.getProfile({ user } as never)).toEqual(user);
  });
});
