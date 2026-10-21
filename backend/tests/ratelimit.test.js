process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const { setupTestDb, closeTestDb } = require('./setup');

test('Rate Limiting Security', async (t) => {
  t.before(async () => {
    await setupTestDb();
  });

  t.after(async () => {
    await closeTestDb();
  });

  await t.test('Enforces strict rate limit of 10 requests on /api/users/login', async () => {
    // Send 10 login requests from this test client IP
    for (let i = 1; i <= 10; i++) {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: `ratelimit_${i}@test.com`,
          password: 'wrongpassword'
        });

      // The first 10 requests reach authentication (401 invalid credentials)
      assert.equal(
        res.status,
        401,
        `Request #${i} should return 401, but got ${res.status}: ${JSON.stringify(res.body)}`
      );
    }

    // The 11th request must be blocked by express-rate-limit with HTTP 429
    const blockedRes = await request(app)
      .post('/api/users/login')
      .send({
        email: 'ratelimit_11@test.com',
        password: 'wrongpassword'
      });

    assert.equal(blockedRes.status, 429, '11th request should be rate-limited with HTTP 429');
    assert.match(
      blockedRes.body.message,
      /Too many attempts/i,
      'Message should indicate rate limit exceeded'
    );
  });
});
