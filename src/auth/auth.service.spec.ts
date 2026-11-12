import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { hash, verify } from 'argon2';
import { UsersService } from 'src/users/users.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

const input = { name: 'Ana', email: 'ana@example.com', password: 'Secret123' };

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    findByEmail: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    create: vi.fn(),
  };
  const jwtService = { signAsync: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('rejects an email that is already taken', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'u1' });

      await expect(service.register(input)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('stores an Argon2 hash of the password', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation((data) =>
        Promise.resolve({ id: 'u1', ...data }),
      );

      await service.register(input);

      const [{ passwordHash }] = usersService.create.mock.calls[0] as [
        { passwordHash: string },
      ];
      expect(passwordHash).not.toBe(input.password);
      expect(passwordHash).toMatch(/^\$argon2id\$/);
      await expect(verify(passwordHash, input.password)).resolves.toBe(true);
    });

    it('never returns the password hash', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation((data) =>
        Promise.resolve({ id: 'u1', ...data }),
      );

      const user = await service.register(input);

      expect(user).not.toHaveProperty('passwordHash');
      expect(user).toMatchObject({ id: 'u1', email: input.email });
    });
  });

  describe('validateUser', () => {
    it('returns null when the email is unknown', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.validateUser(input.email, input.password),
      ).resolves.toBeNull();
    });

    it('returns null when the password is wrong', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'u1',
        email: input.email,
        passwordHash: await hash(input.password),
      });

      await expect(
        service.validateUser(input.email, 'Wrong1234'),
      ).resolves.toBeNull();
    });

    it('returns the user without the hash when the password matches', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'u1',
        email: input.email,
        passwordHash: await hash(input.password),
      });

      const user = await service.validateUser(input.email, input.password);

      expect(user).toEqual({ id: 'u1', email: input.email });
    });
  });

  describe('login', () => {
    it('signs a token with the user id and email', async () => {
      jwtService.signAsync.mockResolvedValue('signed-token');

      const result = await service.login({ id: 'u1', email: input.email });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: input.email,
      });
      expect(result).toEqual({ access_token: 'signed-token' });
    });
  });
});
