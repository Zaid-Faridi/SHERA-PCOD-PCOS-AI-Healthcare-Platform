process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const { setupTestDb, closeTestDb } = require('./setup');

test('Authentication Security - Health Routes Protection', async (t) => {
  t.before(async () => {
    await setupTestDb();
  });

  t.after(async () => {
    await closeTestDb();
  });

  const routes = [
    { method: 'get', path: '/api/health/data' },
    { method: 'post', path: '/api/health/cycle', body: { startDate: '2026-03-01' } },
    { method: 'put', path: '/api/health/lifestyle', body: { exercise: true } },
    { method: 'post', path: '/api/health/symptoms', body: { name: 'Acne', severity: 5 } },
    { method: 'post', path: '/api/health/risk-assessment', body: { symptoms: ['Acne'] } },
    { method: 'post', path: '/api/health/save-diagnostic', body: { score: 40 } },
    { method: 'get', path: '/api/health/export' }
  ];

  for (const r of routes) {
    await t.test(`Rejects unauthenticated request to ${r.method.toUpperCase()} ${r.path} with 401`, async () => {
      const req = request(app)[r.method](r.path);
      if (r.body) {
        req.send(r.body);
      }
      const res = await req;
      assert.equal(res.status, 401, `Expected 401 on unauthenticated ${r.path}`);
      assert.match(res.body.message, /Not authorized/i);
    });

    await t.test(`Rejects malformed token on ${r.method.toUpperCase()} ${r.path} with 401`, async () => {
      const req = request(app)[r.method](r.path).set('Authorization', 'Bearer invalid.token.payload');
      if (r.body) {
        req.send(r.body);
      }
      const res = await req;
      assert.equal(res.status, 401, `Expected 401 on malformed token for ${r.path}`);
      assert.match(res.body.message, /Not authorized/i);
    });

    await t.test(`Rejects invalid header scheme on ${r.method.toUpperCase()} ${r.path} with 401`, async () => {
      const req = request(app)[r.method](r.path).set('Authorization', 'Basic 123456');
      if (r.body) {
        req.send(r.body);
      }
      const res = await req;
      assert.equal(res.status, 401, `Expected 401 on non-Bearer scheme for ${r.path}`);
      assert.match(res.body.message, /Not authorized/i);
    });
  }
});
