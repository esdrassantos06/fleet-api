import { ConflictException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { argon2id, hash, verify } from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(data: CreateUserDTO) {
    const originalPassword = data.password;

    if (await this.usersService.findByEmail(data.email)) {
      throw new ConflictException('User with this email already exists.');
    }

    const hashedPassword = await this.hashPassword(originalPassword);

    const userData = {
      ...data,
      passwordHash: hashedPassword,
    };

    const createdUser = await this.usersService.create(userData);

    const { passwordHash, ...userWithoutHash } = createdUser;

    return userWithoutHash;
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) return null;
    const passCheck = await this.checkPassword(user.passwordHash, password);

    if (!passCheck) return null;

    const { passwordHash, ...UserWithoutHash } = user;

    return UserWithoutHash;
  }

  async login(user: Pick<User, 'id' | 'email'>) {
    const payload = { sub: user.id, email: user.email };
    return { access_token: await this.jwtService.signAsync(payload) };
  }

  private async hashPassword(password: string): Promise<string> {
    return await hash(password, {
      type: argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  private async checkPassword(
    hash: string,
    password: string,
  ): Promise<boolean> {
    return await verify(hash, password);
  }
}
