import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const queryBuilder = {
    where: vi.fn(),
    addSelect: vi.fn(),
    getOne: vi.fn(),
  };
  const repository = {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    createQueryBuilder: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.addSelect.mockReturnValue(queryBuilder);
    repository.createQueryBuilder.mockReturnValue(queryBuilder);

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  it('finds a user by email', async () => {
    repository.findOne.mockResolvedValue({ id: 'u1' });

    await expect(service.findByEmail('ana@example.com')).resolves.toEqual({
      id: 'u1',
    });
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { email: 'ana@example.com' },
    });
  });

  it('lists every user', async () => {
    repository.find.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);

    await expect(service.findAll()).resolves.toHaveLength(2);
  });

  it('selects the password hash only when asked for it', async () => {
    queryBuilder.getOne.mockResolvedValue({ id: 'u1', passwordHash: 'hash' });

    const user = await service.findByEmailWithPassword('ana@example.com');

    expect(queryBuilder.where).toHaveBeenCalledWith('user.email = :email', {
      email: 'ana@example.com',
    });
    expect(queryBuilder.addSelect).toHaveBeenCalledWith('user.passwordHash');
    expect(user).toEqual({ id: 'u1', passwordHash: 'hash' });
  });

  it('creates and saves a user', async () => {
    const data = { name: 'Ana', email: 'ana@example.com', passwordHash: 'h' };
    repository.create.mockReturnValue(data);
    repository.save.mockResolvedValue({ id: 'u1', ...data });

    await expect(service.create(data)).resolves.toMatchObject({ id: 'u1' });
    expect(repository.create).toHaveBeenCalledWith(data);
    expect(repository.save).toHaveBeenCalledWith(data);
  });
});
