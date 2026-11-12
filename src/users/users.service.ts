import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findAll() {
    return await this.userRepository.find();
  }

  findByEmailWithPassword(email: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.passwordHash')
      .getOne();
  }

  async create(data: Partial<User>) {
    const user = this.userRepository.create(data);

    return this.userRepository.save(user);
  }
}
