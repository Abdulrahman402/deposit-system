import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, pbkdf2Sync } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, SignupDto } from './auth.dto';
import { CustomException } from '../common/filter/custom-exception.filter';
import { omit } from 'ramda';
import { ConfigService } from '@nestjs/config';
import { PostgresService } from 'src/postgres/postgres.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly postgresService: PostgresService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async signup(dto: SignupDto) {
    try {
      const { username, password, name } = dto;
      const isUserExistsQuery = await this.postgresService.query(
        `SELECT username FROM users WHERE username = $1;`,
        [username],
      );

      if (isUserExistsQuery.length > 0)
        throw new CustomException('User already exists');

      const insertionQuery = `INSERT INTO users (username, password, name) VALUES ($1, $2, $3) RETURNING id, username, name;`;

      const hashedPassword = this.hashPassword(password);

      const user = await this.postgresService.query(insertionQuery, [
        username,
        hashedPassword,
        name,
      ]);

      return {
        access_token: await this.signToken({ id: user[0].id }),
        user: user[0],
      };
    } catch (e) {
      console.error(e);
      if (e instanceof CustomException) throw e;

      throw new CustomException('Failed to add user into database');
    }
  }

  async login(dto: LoginDto) {
    try {
      const { username, password } = dto;

      const user = await this.isUserExists(username);

      if (!this.validatePassword(user.password, password))
        throw new CustomException('Invalid email or password');

      this.cacheManager.set(username, user);

      return {
        access_token: await this.signToken({
          id: user.id,
        }),
        user: omit(['password', 'created_at'], user),
      };
    } catch (e) {
      console.error(e);
      if (e instanceof CustomException) throw e;

      throw new CustomException('Failed to login');
    }
  }

  hashPassword(password: string): string {
    const salt = randomBytes(128).toString('base64');
    const iterations = 10000;
    const keylen = 64;
    const digest = 'sha512';
    const hash = pbkdf2Sync(password, salt, iterations, keylen, digest);
    return `${salt}:${iterations}:${hash.toString('hex')}`;
  }

  validatePassword(storedPassword: string, enteredPassword: string): boolean {
    const [salt, iterations, storedHash] = storedPassword.split(':');

    if (!salt || !iterations || !storedHash) {
      throw new CustomException('Invalid stored password format');
    }

    const enteredHash = pbkdf2Sync(
      enteredPassword,
      salt,
      parseInt(iterations, 10),
      64,
      'sha512',
    ).toString('hex');

    return enteredHash === storedHash;
  }

  signToken(payload: any): Promise<string> {
    const secret = this.config.get('JWT_SECRET');

    return this.jwt.signAsync(payload, { secret });
  }

  async getCachedUser(username: string): Promise<any> {
    try {
      return await this.cacheManager.get(username);
    } catch (error) {
      console.error('Cache error:', error);
      return null;
    }
  }

  async isUserExists(username) {
    try {
      let user = await this.getCachedUser(username);
      if (!user) {
        user = await this.postgresService.query(
          `SELECT * FROM users WHERE username = $1;`,
          [username],
        );
        user = user[0];
      }

      if (!user) throw new CustomException('Invalid username or password');

      return user;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
