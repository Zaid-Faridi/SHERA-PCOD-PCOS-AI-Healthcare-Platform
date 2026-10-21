const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const serverPath = path.resolve(__dirname, '../server.js');

test('Startup Security Validation', async (t) => {
  await t.test('Missing JWT_SECRET exits with code 1 and error message', () => {
    const env = { ...process.env, JWT_SECRET: '', MONGODB_URI: 'mongodb://127.0.0.1:27017/pcos-pcod-app-test' };
    const res = spawnSync(process.execPath, ['-e', `require('${serverPath}')`], {
      env,
      encoding: 'utf8'
    });

    assert.equal(res.status, 1, 'Should exit with code 1');
    assert.match(
      res.stderr,
      /JWT_SECRET is required/,
      'Stderr should indicate JWT_SECRET is required'
    );
  });

  await t.test('JWT_SECRET shorter than 32 characters exits with code 1 and error message', () => {
    const env = { ...process.env, JWT_SECRET: 'short_secret_under_32_chars', MONGODB_URI: 'mongodb://127.0.0.1:27017/pcos-pcod-app-test' };
    const res = spawnSync(process.execPath, ['-e', `require('${serverPath}')`], {
      env,
      encoding: 'utf8'
    });

    assert.equal(res.status, 1, 'Should exit with code 1');
    assert.match(
      res.stderr,
      /JWT_SECRET must be at least 32 characters long/,
      'Stderr should indicate JWT_SECRET minimum length requirement'
    );
  });

  await t.test('Missing MONGODB_URI exits with code 1 and error message', () => {
    const env = { ...process.env, JWT_SECRET: 'valid_jwt_secret_with_at_least_32_characters_long', MONGODB_URI: '' };
    const res = spawnSync(process.execPath, ['-e', `require('${serverPath}')`], {
      env,
      encoding: 'utf8'
    });

    assert.equal(res.status, 1, 'Should exit with code 1');
    assert.match(
      res.stderr,
      /MONGODB_URI is required/,
      'Stderr should indicate MONGODB_URI is required'
    );
  });
});
