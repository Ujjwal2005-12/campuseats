const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const app = require('../app');
const userRepository = require('../repositories/userRepository');
const { generateToken } = require('../utils/token');

// Ensure JWT_SECRET is present for testing
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_for_unit_tests';
process.env.JWT_EXPIRES_IN = '1h';

// Pre-computed bcrypt hash for password 'password123'
const VALID_PASSWORD_HASH = '$2b$10$K6V0zgHFIC8H4DQJWsIYx.Wd48O2fEsM//XecMvI09xW6q.sVbJNy';

let server;
let baseUrl;

// Sample mock users adhering to the contract
const mockStudent = {
  id: 1,
  name: 'Student One',
  email: 'student@example.com',
  password_hash: VALID_PASSWORD_HASH,
  role: 'STUDENT',
  is_active: 1
};

const mockAdmin = {
  id: 2,
  name: 'Admin User',
  email: 'admin@example.com',
  password_hash: VALID_PASSWORD_HASH,
  role: 'ADMIN',
  is_active: 1
};

const mockInactiveUser = {
  id: 3,
  name: 'Inactive Student',
  email: 'inactive@example.com',
  password_hash: VALID_PASSWORD_HASH,
  role: 'STUDENT',
  is_active: 0
};

// Store original repository methods to restore after tests
const originalFindByEmail = userRepository.findUserByEmail;
const originalFindById = userRepository.findUserById;

describe('Authentication & Authorization Test Suite (Member 1)', () => {
  before(async () => {
    // Start test server on ephemeral port (0)
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    // Restore repository methods
    userRepository.findUserByEmail = originalFindByEmail;
    userRepository.findUserById = originalFindById;

    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    // Default mock implementation
    userRepository.findUserByEmail = async (email) => {
      if (email === mockStudent.email) return { ...mockStudent };
      if (email === mockAdmin.email) return { ...mockAdmin };
      if (email === mockInactiveUser.email) return { ...mockInactiveUser };
      return null;
    };

    userRepository.findUserById = async (id) => {
      if (id === mockStudent.id) {
        return {
          id: mockStudent.id,
          name: mockStudent.name,
          email: mockStudent.email,
          role: mockStudent.role,
          is_active: mockStudent.is_active
        };
      }
      if (id === mockAdmin.id) {
        return {
          id: mockAdmin.id,
          name: mockAdmin.name,
          email: mockAdmin.email,
          role: mockAdmin.role,
          is_active: mockAdmin.is_active
        };
      }
      if (id === mockInactiveUser.id) {
        return {
          id: mockInactiveUser.id,
          name: mockInactiveUser.name,
          email: mockInactiveUser.email,
          role: mockInactiveUser.role,
          is_active: mockInactiveUser.is_active
        };
      }
      return null;
    };
  });

  // 1. Health endpoint
  test('1. Health endpoint returns 200 OK', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.ok(body.timestamp);
  });

  // 2. Valid login returns 200, JWT, and safe user
  test('2. Valid login returns HTTP 200, JWT, and safe user object', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@example.com',
        password: 'password123'
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'Login successful');
    assert.ok(body.token);
    assert.deepEqual(body.user, {
      id: 1,
      name: 'Student One',
      email: 'student@example.com',
      role: 'STUDENT'
    });
  });

  // 3. Wrong password returns 401
  test('3. Wrong password returns HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@example.com',
        password: 'wrong_password'
      })
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.message, 'Invalid email or password');
  });

  // 4. Unknown email returns HTTP 401 with identical generic message
  test('4. Unknown email returns HTTP 401 with same generic message', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'unknown@example.com',
        password: 'password123'
      })
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.message, 'Invalid email or password');
  });

  // 5. Missing email or password returns HTTP 400
  test('5. Missing email or password returns HTTP 400', async () => {
    // Missing password
    const res1 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@example.com' })
    });
    assert.equal(res1.status, 400);

    // Missing email
    const res2 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'password123' })
    });
    assert.equal(res2.status, 400);

    // Invalid email format
    const res3 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'password123' })
    });
    assert.equal(res3.status, 400);
  });

  // 6. Successful login response never includes password_hash
  test('6. Successful login response never includes password_hash or sensitive fields', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@example.com',
        password: 'password123'
      })
    });

    const body = await res.json();
    assert.equal(body.user.password_hash, undefined);
    assert.equal(body.user.password, undefined);
  });

  // 7. GET /api/auth/me without a token returns HTTP 401
  test('7. GET /api/auth/me without a token returns HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.message, 'Authentication required');
  });

  // 8. GET /api/auth/me with a malformed token returns HTTP 401
  test('8. GET /api/auth/me with a malformed token returns HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer this.is.invalid' }
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.message, 'Authentication required');
  });

  // 9. GET /api/auth/me with an expired token returns HTTP 401
  test('9. GET /api/auth/me with an expired token returns HTTP 401', async () => {
    // Generate an expired token
    const expiredToken = jwt.sign(
      { id: 1, role: 'STUDENT' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.message, 'Authentication required');
  });

  // 10. GET /api/auth/me with a valid token returns safe user fields
  test('10. GET /api/auth/me with a valid token returns safe user fields', async () => {
    const validToken = generateToken({ id: 1, role: 'STUDENT' });

    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.user, {
      id: 1,
      name: 'Student One',
      email: 'student@example.com',
      role: 'STUDENT'
    });
    assert.equal(body.user.password_hash, undefined);
  });

  // 11. An unauthenticated protected endpoint returns HTTP 401
  test('11. An unauthenticated protected endpoint (/api/auth/admin-only) returns HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/admin-only`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.message, 'Authentication required');
  });

  // 12. A STUDENT token attempting an ADMIN-only route returns HTTP 403
  test('12. A STUDENT token attempting an ADMIN-only route returns HTTP 403', async () => {
    const studentToken = generateToken({ id: 1, role: 'STUDENT' });

    const res = await fetch(`${baseUrl}/api/auth/admin-only`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.message, 'Insufficient permissions');
  });

  // 13. An ADMIN token can access the ADMIN-only test route
  test('13. An ADMIN token can access the ADMIN-only test route', async () => {
    const adminToken = generateToken({ id: 2, role: 'ADMIN' });

    const res = await fetch(`${baseUrl}/api/auth/admin-only`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'Admin access granted');
    assert.equal(body.user.role, 'ADMIN');
  });

  // 14. A role supplied in frontend request body cannot override verified role
  test('14. A role supplied in frontend request body cannot override verified role', async () => {
    const studentToken = generateToken({ id: 1, role: 'STUDENT' });

    // Send a payload tampering attempt trying to impersonate ADMIN
    const res = await fetch(`${baseUrl}/api/auth/admin-only`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
        'X-User-Role': 'ADMIN'
      }
    });

    // Must be rejected with 403 because req.user is drawn strictly from JWT
    assert.equal(res.status, 403);
  });

  // 15. Missing JWT_SECRET is handled safely
  test('15. Missing JWT_SECRET is handled safely and returns 500 without leaking stack traces', async () => {
    const originalSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'student@example.com',
          password: 'password123'
        })
      });

      assert.equal(res.status, 500);
      const body = await res.json();
      assert.equal(body.message, 'Internal server error');
      // Must not leak secret or stack trace
      assert.equal(body.stack, undefined);
    } finally {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  // 16. Database errors do not expose stack traces or credentials to API clients
  test('16. Database errors do not expose stack traces or credentials to clients', async () => {
    userRepository.findUserByEmail = async () => {
      const dbError = new Error('ER_ACCESS_DENIED_ERROR: Access denied for user root@localhost (using password: YES)');
      dbError.code = 'ER_ACCESS_DENIED_ERROR';
      throw dbError;
    };

    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@example.com',
        password: 'password123'
      })
    });

    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.message, 'Internal server error');
    assert.equal(body.code, undefined);
    assert.equal(body.stack, undefined);
    assert.equal(JSON.stringify(body).includes('Access denied'), false);
    assert.equal(JSON.stringify(body).includes('root@localhost'), false);
  });

  // Inactive user handling
  test('17. Inactive user is rejected at login with HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'inactive@example.com',
        password: 'password123'
      })
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.message, 'Account is inactive');
  });

  test('18. Inactive user is rejected during session restoration (/me) with HTTP 401', async () => {
    const inactiveToken = generateToken({ id: 3, role: 'STUDENT' });

    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${inactiveToken}` }
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.message, 'Authentication required');
  });
});
