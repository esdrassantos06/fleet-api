import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';

describe('Auth flow (e2e)', () => {
  let app: INestApplication<App>;
  const user = {
    name: 'E2E User',
    email: `e2e-${Date.now()}@example.com`,
    password: 'Secret123',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers, logs in and reads the profile with the token', async () => {
    const registered = await request(app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(201);
    expect(registered.body).toMatchObject({
      name: user.name,
      email: user.email,
    });
    expect(registered.body).not.toHaveProperty('passwordHash');
    expect(registered.body).not.toHaveProperty('password');

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);
    const { access_token } = login.body as { access_token: string };
    expect(access_token).toEqual(expect.any(String));

    const profile = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);
    expect(profile.body).toMatchObject({ email: user.email });
  });

  it('rejects a second sign-up with the same email', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(409);
  });

  it('rejects a wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'Wrong1234' })
      .expect(401);
  });

  it('rejects the profile route without a token', async () => {
    await request(app.getHttpServer()).get('/auth/profile').expect(401);
  });
});
