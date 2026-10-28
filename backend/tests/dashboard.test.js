const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../app');
const { generateToken } = require('../utils/token');

let server;
let baseUrl;

const studentToken = generateToken({ id: 3, role: 'STUDENT' });

describe('Dashboard Analytics Test Suite', () => {
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

  test('1. GET /api/dashboard/stats rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/stats`);
    assert.equal(res.status, 401);
  });

  test('2. GET /api/dashboard/stats returns aggregated metrics across campus entities', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.stats);

    // Verify summary structure
    const { summary, users, facilities, bookings, recentActivity } = data.stats;
    assert.ok(typeof summary.totalUsers === 'number');
    assert.ok(typeof summary.totalFacilities === 'number');
    assert.ok(typeof summary.totalBookings === 'number');

    // Verify user counts
    assert.ok(typeof users.students === 'number');
    assert.ok(typeof users.faculty === 'number');
    assert.ok(typeof users.admins === 'number');

    // Verify facility counts
    assert.ok(typeof facilities.rooms === 'number');
    assert.ok(typeof facilities.available === 'number');

    // Verify booking counts
    assert.ok(typeof bookings.total === 'number');
    assert.ok(typeof bookings.pending === 'number');

    // Verify recent activity feed
    assert.ok(Array.isArray(recentActivity));
  });
});
