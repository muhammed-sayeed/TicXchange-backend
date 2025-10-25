// auth.test.js (ESM-friendly)

import { jest } from '@jest/globals';
import request from 'supertest';

// Mock all modules BEFORE importing app
await jest.unstable_mockModule('../models/auth_user.js', () => ({
  default: {
    findOne: jest.fn(),
    prototype: { save: jest.fn() }
  }
}));

await jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash: jest.fn()
  }
}));

await jest.unstable_mockModule('../config/redisClient.js', () => ({
  default: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn()
  }
}));

await jest.unstable_mockModule('../utils/otp.js', () => ({
  sentOtp: jest.fn()
}));

await jest.unstable_mockModule('../utils/jwt.js', () => ({
  generateAccessToken: jest.fn(() => 'fake_access_token'),
  generateRefreshToken: jest.fn(() => 'fake_refresh_token'),
  verifyRefreshToken: jest.fn(() => ({ userId: 'fake_user_id' }))
}));

// Now import after mocks
const { default: app } = await import('../app.js');
const { default: auth_user } = await import('../models/auth_user.js');
const bcrypt = (await import('bcrypt')).default;
const redisClient = (await import('../config/redisClient.js')).default;
const sendOtp = (await import('../utils/otp.js')).default;
const { generateAccessToken, generateRefreshToken } = await import('../utils/jwt.js');

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/signup', () => {
    it('should return 400 if both email and mobile missing', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ firstname: 'John', lastname: 'Deo', password: '123456' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Email or mobile is required');
    });

    it('should return 400 if email already registered', async () => {
      auth_user.findOne.mockResolvedValue({ email: 'john@example.com' });

      const res = await request(app)
        .post('/auth/signup')
        .send({
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
          password: '123456'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Email already registered');
    });

    it('should store data in Redis and send OTP if new email', async () => {
      auth_user.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed_pw');
      redisClient.set.mockResolvedValue('OK');
      sendOtp.mockResolvedValue(true);

      const res = await request(app)
        .post('/auth/signup')
        .send({
          firstname: 'John',
          lastname: 'Doe',
          email: 'new@example.com',
          role: 'user',
          password: '123456'
        });

      expect(res.statusCode).toBe(200); // adjust if your API sends different success status
      expect(redisClient.set).toHaveBeenCalled();
      expect(sendOtp).toHaveBeenCalled();
    });

    it('should return 500 on unexpected error', async () => {
      auth_user.findOne.mockRejectedValue(new Error('DB fail'));

      const res = await request(app)
        .post('/auth/signup')
        .send({
          firstname: 'John',
          lastname: 'Doe',
          email: 'error@example.com',
          password: '123456'
        });

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty(
        'message',
        'Something went wrong, please try again later.'
      );
    });
  });

  // ==== verify user ====
  describe('POST /auth/verify', () => {
    it('should return 401 if OTP is invalid or expired', async () => {
      redisClient.get.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/auth/verify')
        .send({ email: 'john@example.com', otp: '111111' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid or expired OTP.');
    });

    it('should return 403 if no pending registration', async () => {
      redisClient.get
        .mockResolvedValueOnce('111111') // OTP match
        .mockResolvedValueOnce(null); // No pending data

      const res = await request(app)
        .post('/auth/verify')
        .send({ email: 'john@example.com', otp: '111111' });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty(
        'message',
        'No pending registration found.'
      );
    });

    it('should save user and return tokens on success', async () => {
      redisClient.get
        .mockResolvedValueOnce('111111')
        .mockResolvedValueOnce(
          JSON.stringify({
            firstname: 'John',
            lastname: 'Doe',
            role: 'user',
            hashedPassword: 'hashed_pw'
          })
        );

      const mockSave = jest.fn().mockResolvedValue(true);
      auth_user.prototype.save = mockSave;

      redisClient.del.mockResolvedValue('OK');

      const res = await request(app)
        .post('/auth/verify')
        .send({ email: 'john@example.com', otp: '111111' });

      expect(res.statusCode).toBe(200);
      expect(mockSave).toHaveBeenCalled();
      expect(redisClient.del).toHaveBeenCalledWith(
        'otp:email:john@example.com'
      );
      expect(redisClient.del).toHaveBeenCalledWith(
        'pending:email:john@example.com'
      );
      expect(res.body.data).toHaveProperty('token', 'fake_access_token');
      expect(res.body.data).toHaveProperty('refreshToken', 'fake_refresh_token');
      expect(generateAccessToken).toHaveBeenCalled();
      expect(generateRefreshToken).toHaveBeenCalled();
    });

    it('should return 500 if server error', async () => {
      redisClient.get.mockRejectedValue(new Error('Redis error'));

      const res = await request(app)
        .post('/auth/verify')
        .send({ email: 'john@example.com', otp: '111111' });

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });
});
