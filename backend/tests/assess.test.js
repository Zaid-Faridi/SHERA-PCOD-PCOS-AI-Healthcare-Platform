process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const HealthData = require('../models/HealthData');
const { setupTestDb, cleanTestDb, closeTestDb, generateToken } = require('./setup');

test('POST /api/assess - AI Assessment Proxy & Server-Side Persistence', async (t) => {
  let authUser;
  let authToken;
  const originalFetch = global.fetch;

  t.before(async () => {
    await setupTestDb('pcos-test-assess');
    await cleanTestDb();

    authUser = await User.create({
      name: 'Assessment User',
      email: 'assess_user@test.com',
      password: 'password123'
    });
    authToken = generateToken(authUser._id);
  });

  t.after(async () => {
    global.fetch = originalFetch;
    await cleanTestDb();
    await closeTestDb();
  });

  await t.test('Success (Anonymous): returns Flask response + input_completeness + model_version and does NOT save to MongoDB', async () => {
    let forwardedBody;
    global.fetch = async (url, options) => {
      forwardedBody = options.body;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          diagnosis: 'Moderate risk',
          severity: 'Moderate',
          confidence: 56.5,
          risk_score: 56.5,
          tabular_risk: 56.5,
          image_risk: null,
          image_provided: false,
          limited_input: false,
          message: 'Analysis complete.'
        })
      };
    };

    const countBefore = await HealthData.countDocuments();

    const res = await request(app)
      .post('/api/assess')
      .send({
        age: 26,
        cycle: 30,
        ratio: 1.2
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.diagnosis, 'Moderate risk');
    assert.equal(res.body.severity, 'Moderate');
    assert.equal(res.body.risk_score, 56.5);
    assert.ok('input_completeness' in res.body);
    assert.equal(typeof res.body.input_completeness, 'number');
    assert.ok('model_version' in res.body);

    const countAfter = await HealthData.countDocuments();
    assert.equal(countAfter, countBefore, 'Anonymous assessment must NOT persist to HealthData');
  });

  await t.test('Success (Authenticated): saves diagnosticHistory and riskAssessment to MongoDB using server-derived data', async () => {
    global.fetch = async (url, options) => {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          diagnosis: 'Higher risk - consult a doctor',
          severity: 'High',
          confidence: 82.4,
          risk_score: 82.4,
          tabular_risk: 85.0,
          image_risk: 78.5,
          image_provided: true,
          message: 'Analysis complete. Risk Level: High.'
        })
      };
    };

    const res = await request(app)
      .post('/api/assess')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        age: 28,
        cycle: 40
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.risk_score, 82.4);

    // Verify document in MongoDB
    const healthDoc = await HealthData.findOne({ user: authUser._id });
    assert.ok(healthDoc, 'HealthData document must exist for authenticated user');
    assert.equal(healthDoc.riskAssessment.score, 82);
    assert.equal(healthDoc.riskAssessment.level, 'high');
    assert.equal(healthDoc.diagnosticHistory.length, 1);
    assert.equal(healthDoc.diagnosticHistory[0].score, 82);
    assert.equal(healthDoc.diagnosticHistory[0].level, 'high');
    assert.equal(healthDoc.diagnosticHistory[0].diagnosis, 'Higher risk - consult a doctor');
    assert.equal(healthDoc.diagnosticHistory[0].severity, 'High');
    assert.equal(healthDoc.diagnosticHistory[0].tabular_score, 85);
    assert.equal(healthDoc.diagnosticHistory[0].image_score, 79);
  });

  await t.test('Server-side BMI computation: computes BMI when height and weight are valid', async () => {
    let capturedBody;
    global.fetch = async (url, options) => {
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          diagnosis: 'Low risk - monitor',
          severity: 'Low',
          risk_score: 25.0,
          tabular_risk: 25.0,
          image_provided: false
        })
      };
    };

    const res = await request(app)
      .post('/api/assess')
      .send({
        height: 160, // 1.6m
        weight: 64,  // 64 / (1.6 * 1.6) = 25.0
        age: 24
      });

    assert.equal(res.status, 200);
    assert.ok(capturedBody);
    assert.equal(capturedBody.bmi, 25.0, 'BMI must be computed as 25.0');
  });

  await t.test('Invalid Image: maps Flask 400 invalid_image to 400 with same message', async () => {
    global.fetch = async (url, options) => {
      return {
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: 'invalid_image',
          message: 'Uploaded image is not an ovarian ultrasound scan.',
          suggestion: 'Please upload a valid grayscale ultrasound.'
        })
      };
    };

    const res = await request(app)
      .post('/api/assess')
      .attach('file', Buffer.from('fake image data'), 'test.jpg');

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'invalid_image');
    assert.match(res.body.message, /not an ovarian ultrasound/i);
  });

  await t.test('Flask Down / Connection Refused: returns 503 "Assessment service unavailable"', async () => {
    global.fetch = async () => {
      const err = new Error('connect ECONNREFUSED 127.0.0.1:5000');
      err.code = 'ECONNREFUSED';
      throw err;
    };

    const res = await request(app)
      .post('/api/assess')
      .send({ age: 25 });

    assert.equal(res.status, 503);
    assert.equal(res.body.message, 'Assessment service unavailable');
  });
});
