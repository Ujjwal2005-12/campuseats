const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../app');
const { generateToken } = require('../utils/token');

let server;
let baseUrl;

const adminToken = generateToken({ id: 1, role: 'ADMIN' });
const studentToken = generateToken({ id: 3, role: 'STUDENT' });

describe('User Registration, Password Change & Admin Management Test Suite', () => {
  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    const pool = require('../config/db');
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  });

  // 1. User Registration Tests
  test('1. POST /api/auth/register validates required fields and password length', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Short', email: 'test@smartly.local', password: '123' })
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.message.includes('6 characters'));
  });

  test('2. POST /api/auth/register successfully registers a new student and returns JWT', async () => {
    const uniqueEmail = `newstudent_${Date.now()}@smartly.local`;
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John von Neumann',
        email: uniqueEmail,
        password: 'password123'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.message, 'User registered successfully');
    assert.ok(data.token);
    assert.equal(data.user.role, 'STUDENT');
    assert.equal(data.user.email, uniqueEmail);
    assert.equal(data.user.password_hash, undefined);
  });

  test('3. POST /api/auth/register rejects duplicate email with 409 Conflict', async () => {
    // Attempting to register with existing seed email
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Student',
        email: 'student@smartly.local',
        password: 'password123'
      })
    });

    assert.equal(res.status, 409);
    const data = await res.json();
    assert.equal(data.message, 'Email is already registered');
  });

  // 2. Change Password Tests
  test('4. PUT /api/auth/change-password rejects incorrect current password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: 'wrong_current_password',
        newPassword: 'newpassword123'
      })
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.message, 'Incorrect current password');
  });

  test('5. PUT /api/auth/change-password rejects identical new password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: 'password123',
        newPassword: 'password123'
      })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.message.includes('different'));
  });

  // 3. Admin User Management Tests
  test('6. GET /api/users rejects student with 403 Insufficient permissions', async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(res.status, 403);
  });

  test('7. GET /api/users allows Admin and returns user roster', async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.users));
    assert.ok(data.users.length >= 3);
  });

  test('8. PUT /api/users/:id prevents Admin from deactivating their own account', async () => {
    // Admin user id is 1
    const res = await fetch(`${baseUrl}/api/users/1`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_active: 0 })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.message.includes('cannot deactivate their own'));
  });

  test('9. PUT /api/users/:id promotes student to faculty', async () => {
    // User 4 is Ada Lovelace
    const res = await fetch(`${baseUrl}/api/users/4`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'FACULTY' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.role, 'FACULTY');
  });
});
