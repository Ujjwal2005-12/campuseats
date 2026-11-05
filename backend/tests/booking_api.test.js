const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../app');
const { generateToken } = require('../utils/token');

let server;
let baseUrl;

const studentToken = generateToken({ id: 3, role: 'STUDENT' });
const adminToken = generateToken({ id: 1, role: 'ADMIN' });

describe('Rooms & Bookings API Endpoints Test Suite', () => {
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

  // Rooms Tests
  test('1. GET /api/rooms returns 200 and list of rooms', async () => {
    const res = await fetch(`${baseUrl}/api/rooms`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.rooms));
    assert.ok(data.rooms.length > 0);
  });

  test('2. GET /api/rooms/1 returns details for Seminar Room 101', async () => {
    const res = await fetch(`${baseUrl}/api/rooms/1`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.room.id, 1);
    assert.equal(data.room.name, 'Seminar Room 101');
  });

  test('3. POST /api/rooms without Admin token returns 403 for student', async () => {
    const res = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Unauthorized Room' })
    });
    assert.equal(res.status, 403);
  });

  // Bookings Tests
  test('4. GET /api/bookings without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/bookings`);
    assert.equal(res.status, 401);
  });

  test('5. GET /api/bookings with Student token returns student bookings', async () => {
    const res = await fetch(`${baseUrl}/api/bookings`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.bookings));
  });

  test('6. POST /api/bookings detects conflict and returns 409 Conflict', async () => {
    // Room 1 has an existing APPROVED reservation on 2026-10-15 from 10:00:00 to 12:00:00
    const res = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roomId: 1,
        startTime: '2026-10-15 10:30:00',
        endTime: '2026-10-15 11:30:00',
        purpose: 'Overlapping reservation attempt'
      })
    });

    assert.equal(res.status, 409);
    const data = await res.json();
    assert.ok(data.message.includes('conflict'));
  });

  test('7. POST /api/bookings creates a new booking successfully in an open time slot', async () => {
    const res = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roomId: 1,
        startTime: '2026-11-20 09:00:00',
        endTime: '2026-11-20 11:00:00',
        purpose: 'Future robotics project review session'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.message, 'Booking request submitted successfully');
    assert.ok(data.booking.id);
  });
});
