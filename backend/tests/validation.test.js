process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const { setupTestDb, cleanTestDb, closeTestDb, generateToken } = require('./setup');

test('Input Validation & NoSQL Injection Defense', async (t) => {
  let validUser;
  let validToken;

  t.before(async () => {
    await setupTestDb();
    await cleanTestDb();

    validUser = await User.create({
      name: 'Validation Test User',
      email: 'valid_val_user@test.com',
      password: 'initialPassword123',
      age: 25,
      height: 165,
      weight: 58
    });
    validToken = generateToken(validUser._id);
  });

  t.after(async () => {
    await cleanTestDb();
    await closeTestDb();
  });

  await t.test('Register rejects empty or missing required fields with 400', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.message, 'Validation failed');
    assert.ok(Array.isArray(res.body.errors));
    const fields = res.body.errors.map(e => e.field);
    assert.ok(fields.includes('name'));
    assert.ok(fields.includes('email'));
    assert.ok(fields.includes('password'));
  });

  await t.test('Register rejects non-string values (NoSQL injection attempt) with 400', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Attacker',
        email: { $gt: '' },
        password: { $gt: '' }
      });

    assert.equal(res.status, 400);
    const fields = res.body.errors.map(e => e.field);
    assert.ok(fields.includes('email'));
    assert.ok(fields.includes('password'));
  });

  await t.test('Register rejects password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Short Pass',
        email: 'shortpass@test.com',
        password: 'short'
      });

    assert.equal(res.status, 400);
    const err = res.body.errors.find(e => e.field === 'password');
    assert.ok(err);
    assert.match(err.message, /at least 8 characters/i);
  });

  await t.test('Register rejects invalid age/height/weight numeric ranges', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Range Test',
        email: 'ranges@test.com',
        password: 'validPassword123',
        age: 5, // < 10
        height: 350, // > 250
        weight: 10 // < 20
      });

    assert.equal(res.status, 400);
    const fields = res.body.errors.map(e => e.field);
    assert.ok(fields.includes('age'));
    assert.ok(fields.includes('height'));
    assert.ok(fields.includes('weight'));
  });

  await t.test('Login rejects non-string credentials with 400', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: { $ne: null },
        password: { $ne: null }
      });

    assert.equal(res.status, 400);
    const fields = res.body.errors.map(e => e.field);
    assert.ok(fields.includes('email'));
    assert.ok(fields.includes('password'));
  });

  await t.test('Cycle rejects invalid dates and endDate before startDate', async () => {
    const res = await request(app)
      .post('/api/health/cycle')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        startDate: '2026-03-10',
        endDate: '2026-03-05' // Before start date
      });

    assert.equal(res.status, 400);
    const err = res.body.errors.find(e => e.field === 'endDate');
    assert.ok(err);
    assert.match(err.message, /greater than or equal to startDate/i);
  });

  await t.test('Cycle rejects invalid mood enum value', async () => {
    const res = await request(app)
      .post('/api/health/cycle')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        startDate: '2026-03-10',
        mood: 'super-ecstatic' // Not in enum
      });

    assert.equal(res.status, 400);
    const err = res.body.errors.find(e => e.field === 'mood');
    assert.ok(err);
  });

  await t.test('Cycle rejects non-string symptoms array elements', async () => {
    const res = await request(app)
      .post('/api/health/cycle')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        startDate: '2026-03-10',
        symptoms: [123, { object: true }]
      });

    assert.equal(res.status, 400);
    const err = res.body.errors.find(e => e.field === 'symptoms');
    assert.ok(err);
  });

  await t.test('Symptoms route rejects missing name and invalid severity range (1-10)', async () => {
    const res = await request(app)
      .post('/api/health/symptoms')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        name: '',
        severity: 15 // Must be 1-10
      });

    assert.equal(res.status, 400);
    const fields = res.body.errors.map(e => e.field);
    assert.ok(fields.includes('name'));
    assert.ok(fields.includes('severity'));
  });

  await t.test('Risk assessment rejects symptoms when not an array', async () => {
    const res = await request(app)
      .post('/api/health/risk-assessment')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        symptoms: 'just a single string'
      });

    assert.equal(res.status, 400);
    const err = res.body.errors.find(e => e.field === 'symptoms');
    assert.ok(err);
  });

  await t.test('PUT /profile requires currentPassword when changing email', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        email: 'newemail@test.com'
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /Current password is required/i);
  });

  await t.test('PUT /profile requires currentPassword when changing password', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        password: 'newValidPassword123'
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /Current password is required/i);
  });

  await t.test('PUT /profile returns 409 when target email already exists', async () => {
    // Create another user
    await User.create({
      name: 'Existing User',
      email: 'existing_other@test.com',
      password: 'password123'
    });

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        email: 'existing_other@test.com',
        currentPassword: 'initialPassword123'
      });

    assert.equal(res.status, 409);
    assert.match(res.body.message, /already in use/i);
  });

  await t.test('DELETE /api/users/me requires currentPassword and removes user and health data', async () => {
    // Attempt delete with wrong password
    const wrongRes = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        currentPassword: 'wrongPassword'
      });

    assert.equal(wrongRes.status, 401);

    // Delete with correct password
    const successRes = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        currentPassword: 'initialPassword123'
      });

    assert.equal(successRes.status, 200);
    assert.match(successRes.body.message, /deleted/i);

    // Verify user is removed from database
    const deletedUser = await User.findById(validUser._id);
    assert.equal(deletedUser, null);
  });
});
