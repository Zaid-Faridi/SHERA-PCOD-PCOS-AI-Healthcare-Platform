process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const HealthData = require('../models/HealthData');
const { setupTestDb, cleanTestDb, closeTestDb, generateToken } = require('./setup');

test('Data Isolation and Tenant Boundaries', async (t) => {
  let userA;
  let userB;
  let tokenA;
  let tokenB;

  t.before(async () => {
    await setupTestDb();
    await cleanTestDb();

    // Create User A
    userA = await User.create({
      name: 'User Alpha',
      email: 'usera@test.com',
      password: 'password123',
      age: 26,
      height: 165,
      weight: 60
    });
    tokenA = generateToken(userA._id);

    // Create User B
    userB = await User.create({
      name: 'User Beta',
      email: 'userb@test.com',
      password: 'password123',
      age: 30,
      height: 170,
      weight: 65
    });
    tokenB = generateToken(userB._id);

    // User A populates cycle, symptoms, and lifestyle records
    await request(app)
      .post('/api/health/cycle')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        startDate: '2026-03-01',
        endDate: '2026-03-06',
        symptoms: ['AlphaCramps', 'AlphaHeadache'],
        mood: 'poor'
      });

    await request(app)
      .post('/api/health/symptoms')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'AlphaPelvicPain',
        severity: 8
      });

    await request(app)
      .put('/api/health/lifestyle')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        exercise: true,
        diet: 'keto',
        stress: 9,
        sleep: 5
      });
  });

  t.after(async () => {
    await cleanTestDb();
    await closeTestDb();
  });

  await t.test("User B cannot view User A's health data via GET /api/health/data", async () => {
    const res = await request(app)
      .get('/api/health/data')
      .set('Authorization', `Bearer ${tokenB}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.user.toString(), userB._id.toString());

    // User B's arrays must not contain any of User A's data
    const bCycleData = res.body.cycleData || [];
    assert.equal(bCycleData.length, 0, "User B should have 0 cycle records");

    const bSymptoms = res.body.symptoms || [];
    const hasAlphaSymptom = bSymptoms.some(s => s.name && s.name.startsWith('Alpha'));
    assert.equal(hasAlphaSymptom, false, "User B must not see User A's symptoms");
  });

  await t.test("User B export contains only User B's identity and data", async () => {
    const res = await request(app)
      .get('/api/health/export')
      .set('Authorization', `Bearer ${tokenB}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, 'userb@test.com');
    assert.notEqual(res.body.user.email, 'usera@test.com');
    assert.equal(res.body.user._id.toString(), userB._id.toString());

    if (res.body.healthData && res.body.healthData.cycleData) {
      assert.equal(res.body.healthData.cycleData.length, 0);
    }
  });

  await t.test("Concurrent getOrCreate creates exactly one HealthData record per user", async () => {
    const [doc1, doc2, doc3] = await Promise.all([
      HealthData.getOrCreate(userB._id),
      HealthData.getOrCreate(userB._id),
      HealthData.getOrCreate(userB._id)
    ]);

    assert.equal(doc1._id.toString(), doc2._id.toString());
    assert.equal(doc2._id.toString(), doc3._id.toString());

    const totalCount = await HealthData.countDocuments({ user: userB._id });
    assert.equal(totalCount, 1, 'Should have exactly 1 HealthData document for user B');
  });
});
