const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../config/db');
const resourceRepository = require('../repositories/resourceRepository');
const requestRepository = require('../repositories/requestRepository');
const roomRepository = require('../repositories/roomRepository');
const bookingRepository = require('../repositories/bookingRepository');

describe('Database Repositories & Data Layer Test Suite (Member 2)', () => {
  let originalPoolQuery;
  let queries = [];
  let mockQueryResult = [[]];

  const getQuery = (pattern) => queries.find(q => typeof pattern === 'string' ? q.query.includes(pattern) : pattern.test(q.query));
  const getLastQuery = () => queries[queries.length - 1];

  before(() => {
    originalPoolQuery = pool.query;
  });

  after(() => {
    pool.query = originalPoolQuery;
  });

  beforeEach(() => {
    queries = [];
    mockQueryResult = [[]];

    // Mock pool.query to record all invocations in order
    pool.query = async (query, params) => {
      queries.push({ query, params });
      return mockQueryResult;
    };
  });

  // ===========================================================================
  // resourceRepository Tests
  // ===========================================================================
  describe('resourceRepository', () => {
    test('1. findAll() defaults to active resources and executes parameterized query', async () => {
      const mockResources = [
        { id: 1, name: 'Room 101', type: 'ROOM', capacity: 30, is_active: 1 },
        { id: 2, name: 'Computer Lab 1', type: 'LAB', capacity: 40, is_active: 1 }
      ];
      mockQueryResult = [mockResources];

      const results = await resourceRepository.findAll();
      const last = getLastQuery();

      assert.deepEqual(results, mockResources);
      assert.ok(last.query.includes('SELECT id, name, type, capacity'));
      assert.ok(last.query.includes('is_active = ?'));
      assert.deepEqual(last.params, [1]);
    });

    test('2. findAll() correctly applies type, status, and search filters with parameterization', async () => {
      mockQueryResult = [[]];

      await resourceRepository.findAll({
        type: 'LAB',
        status: 'AVAILABLE',
        search: 'Computer',
        limit: 10,
        offset: 5
      });
      const last = getLastQuery();

      assert.ok(last.query.includes('AND type = ?'));
      assert.ok(last.query.includes('AND status = ?'));
      assert.ok(last.query.includes('AND (name LIKE ? OR location LIKE ? OR description LIKE ?)'));
      assert.ok(last.query.includes('LIMIT ?'));
      assert.ok(last.query.includes('OFFSET ?'));
      assert.deepEqual(last.params, [1, 'LAB', 'AVAILABLE', '%Computer%', '%Computer%', '%Computer%', 10, 5]);
    });

    test('3. findById() queries resource by primary key and returns object or null', async () => {
      const mockResource = { id: 10, name: 'Physics Hall', type: 'HALL', capacity: 150 };
      mockQueryResult = [[mockResource]];

      const found = await resourceRepository.findById(10);
      let last = getLastQuery();
      assert.deepEqual(found, mockResource);
      assert.ok(last.query.includes('WHERE id = ?'));
      assert.deepEqual(last.params, [10]);

      // Non-existent ID returns null
      mockQueryResult = [[]];
      const notFound = await resourceRepository.findById(999);
      last = getLastQuery();
      assert.equal(notFound, null);
      assert.deepEqual(last.params, [999]);
    });

    test('4. create() validates name and inserts resource with default values', async () => {
      pool.query = async (query, params) => {
        queries.push({ query, params });
        if (query.includes('INSERT INTO resources')) {
          return [{ insertId: 42 }];
        }
        if (query.includes('WHERE id = ?')) {
          return [[{ id: 42, name: 'Chemistry Lab', type: 'LAB', capacity: 25, status: 'AVAILABLE', is_active: 1 }]];
        }
        return [[]];
      };

      const created = await resourceRepository.create({
        name: 'Chemistry Lab',
        type: 'LAB',
        capacity: 25
      });

      assert.equal(created.id, 42);
      assert.equal(created.name, 'Chemistry Lab');

      const insertCall = getQuery('INSERT INTO resources');
      assert.ok(insertCall);
      assert.deepEqual(insertCall.params, ['Chemistry Lab', 'LAB', 25, null, null, 'AVAILABLE', 1]);

      // Test validation rejects empty or missing name
      await assert.rejects(async () => {
        await resourceRepository.create({ name: '   ' });
      }, /Resource name is required/);
    });

    test('5. update() modifies allowed fields safely and ignores invalid fields', async () => {
      pool.query = async (query, params) => {
        queries.push({ query, params });
        if (query.includes('UPDATE resources')) {
          return [{ affectedRows: 1 }];
        }
        if (query.includes('WHERE id = ?')) {
          return [[{ id: 5, name: 'Renovated Room 101', capacity: 50 }]];
        }
        return [[]];
      };

      const updated = await resourceRepository.update(5, {
        name: 'Renovated Room 101',
        capacity: 50,
        unauthorizedField: 'DROP TABLE users;' // must be ignored
      });

      assert.equal(updated.name, 'Renovated Room 101');
      const updateCall = getQuery('UPDATE resources');
      assert.ok(updateCall);
      assert.ok(updateCall.query.includes('UPDATE resources SET name = ?, capacity = ? WHERE id = ?'));
      assert.ok(!updateCall.query.includes('unauthorizedField'));
      assert.deepEqual(updateCall.params, ['Renovated Room 101', 50, 5]);
    });

    test('6. softDelete() sets is_active = 0', async () => {
      mockQueryResult = [{ affectedRows: 1 }];

      const result = await resourceRepository.softDelete(7);
      const last = getLastQuery();
      assert.equal(result, true);
      assert.ok(last.query.includes('UPDATE resources SET is_active = 0 WHERE id = ?'));
      assert.deepEqual(last.params, [7]);
    });

    test('7. delete() removes resource from table', async () => {
      mockQueryResult = [{ affectedRows: 1 }];

      const result = await resourceRepository.delete(8);
      const last = getLastQuery();
      assert.equal(result, true);
      assert.ok(last.query.includes('DELETE FROM resources WHERE id = ?'));
      assert.deepEqual(last.params, [8]);
    });

    test('8. findAvailableResources() filters out conflicting approved reservations', async () => {
      mockQueryResult = [[
        { id: 1, name: 'Available Room', type: 'ROOM', capacity: 40 }
      ]];

      const startTime = '2026-10-15 10:00:00';
      const endTime = '2026-10-15 12:00:00';

      const available = await resourceRepository.findAvailableResources({
        startTime,
        endTime,
        type: 'ROOM',
        minCapacity: 20
      });
      const last = getLastQuery();

      assert.equal(available.length, 1);
      assert.ok(last.query.includes("status = 'AVAILABLE'"));
      assert.ok(last.query.includes("req.status = 'APPROVED'"));
      assert.ok(last.query.includes('req.start_time < ?'));
      assert.ok(last.query.includes('req.end_time > ?'));
      assert.deepEqual(last.params, [endTime, startTime, 'ROOM', 20]);
    });
  });

  // ===========================================================================
  // requestRepository Tests
  // ===========================================================================
  describe('requestRepository', () => {
    test('9. create() enforces end_time > start_time validation and sets PENDING status', async () => {
      pool.query = async (query, params) => {
        queries.push({ query, params });
        if (query.includes('INSERT INTO requests')) {
          return [{ insertId: 99 }];
        }
        if (query.includes('FROM requests req')) {
          return [[{
            id: 99,
            user_id: 2,
            resource_id: 1,
            start_time: '2026-10-15 10:00:00',
            end_time: '2026-10-15 12:00:00',
            purpose: 'AI Study Group',
            status: 'PENDING'
          }]];
        }
        return [[]];
      };

      const request = await requestRepository.create({
        user_id: 2,
        resource_id: 1,
        start_time: '2026-10-15 10:00:00',
        end_time: '2026-10-15 12:00:00',
        purpose: 'AI Study Group'
      });

      assert.equal(request.id, 99);
      assert.equal(request.status, 'PENDING');

      const insertCall = getQuery('INSERT INTO requests');
      assert.ok(insertCall);
      assert.deepEqual(insertCall.params, [2, 1, '2026-10-15 10:00:00', '2026-10-15 12:00:00', 'AI Study Group']);

      // Inverted interval must throw error
      await assert.rejects(async () => {
        await requestRepository.create({
          user_id: 2,
          resource_id: 1,
          start_time: '2026-10-15 12:00:00',
          end_time: '2026-10-15 10:00:00',
          purpose: 'Invalid Timing'
        });
      }, /end_time must be strictly after start_time/);

      // Equal interval must throw error
      await assert.rejects(async () => {
        await requestRepository.create({
          user_id: 2,
          resource_id: 1,
          start_time: '2026-10-15 10:00:00',
          end_time: '2026-10-15 10:00:00',
          purpose: 'Zero Duration'
        });
      }, /end_time must be strictly after start_time/);
    });

    test('10. findById() joins requester and resource metadata', async () => {
      const detailedRequest = {
        id: 1,
        user_id: 3,
        user_name: 'Grace Hopper',
        user_email: 'student@smartly.local',
        resource_id: 1,
        resource_name: 'Seminar Room 101',
        resource_type: 'ROOM',
        status: 'PENDING'
      };
      mockQueryResult = [[detailedRequest]];

      const result = await requestRepository.findById(1);
      const last = getLastQuery();

      assert.deepEqual(result, detailedRequest);
      assert.ok(last.query.includes('INNER JOIN users u ON req.user_id = u.id'));
      assert.ok(last.query.includes('INNER JOIN resources r ON req.resource_id = r.id'));
      assert.deepEqual(last.params, [1]);
    });

    test('11. findByUserId() filters requests by requester id and orders chronologically', async () => {
      mockQueryResult = [[{ id: 1, user_id: 3, purpose: 'Lab reservation' }]];

      const results = await requestRepository.findByUserId(3, { status: 'PENDING', limit: 10 });
      const last = getLastQuery();

      assert.equal(results.length, 1);
      assert.ok(last.query.includes('WHERE req.user_id = ?'));
      assert.ok(last.query.includes('AND req.status = ?'));
      assert.ok(last.query.includes('ORDER BY req.start_time DESC'));
      assert.deepEqual(last.params, [3, 'PENDING', 10]);
    });

    test('12. hasConflict() returns true when overlapping APPROVED request exists', async () => {
      mockQueryResult = [[
        { id: 10, resource_id: 1, start_time: '2026-10-15 10:00:00', end_time: '2026-10-15 12:00:00', status: 'APPROVED' }
      ]];

      const conflict = await requestRepository.hasConflict(1, '2026-10-15 11:00:00', '2026-10-15 13:00:00');
      const last = getLastQuery();

      assert.equal(conflict, true);
      assert.ok(last.query.includes("status = 'APPROVED'"));
      assert.ok(last.query.includes('start_time < ?'));
      assert.ok(last.query.includes('end_time > ?'));
      assert.deepEqual(last.params, [1, '2026-10-15 13:00:00', '2026-10-15 11:00:00']);
    });

    test('13. hasConflict() returns false when no overlapping requests exist', async () => {
      mockQueryResult = [[]];

      const conflict = await requestRepository.hasConflict(1, '2026-10-15 14:00:00', '2026-10-15 16:00:00');

      assert.equal(conflict, false);
    });

    test('14. hasConflict() supports excludeRequestId for update/rescheduling operations', async () => {
      mockQueryResult = [[]];

      await requestRepository.hasConflict(1, '2026-10-15 10:00:00', '2026-10-15 12:00:00', 55);
      const last = getLastQuery();

      assert.ok(last.query.includes('AND id != ?'));
      assert.deepEqual(last.params, [1, '2026-10-15 12:00:00', '2026-10-15 10:00:00', 55]);
    });

    test('15. updateStatus() sets status, reviewer ID, reviewed_at timestamp, and rejection reason', async () => {
      pool.query = async (query, params) => {
        queries.push({ query, params });
        if (query.includes('UPDATE requests')) {
          return [{ affectedRows: 1 }];
        }
        if (query.includes('FROM requests req')) {
          return [[{ id: 2, status: 'REJECTED', reviewed_by: 1, rejection_reason: 'Maintenance scheduled' }]];
        }
        return [[]];
      };

      const result = await requestRepository.updateStatus(2, {
        status: 'REJECTED',
        reviewed_by: 1,
        rejection_reason: 'Maintenance scheduled'
      });

      assert.equal(result.status, 'REJECTED');
      const updateCall = getQuery('UPDATE requests');
      assert.ok(updateCall);
      assert.ok(updateCall.query.includes('reviewed_at = NOW()'));
      assert.deepEqual(updateCall.params, ['REJECTED', 1, 'Maintenance scheduled', 2]);

      // Invalid status throws descriptive error
      await assert.rejects(async () => {
        await requestRepository.updateStatus(2, { status: 'INVALID_STATUS' });
      }, /Invalid request status/);
    });

    test('16. cancel() marks request as CANCELLED', async () => {
      pool.query = async (query, params) => {
        queries.push({ query, params });
        if (query.includes('UPDATE requests')) {
          return [{ affectedRows: 1 }];
        }
        if (query.includes('FROM requests req')) {
          return [[{ id: 3, status: 'CANCELLED' }]];
        }
        return [[]];
      };

      const cancelled = await requestRepository.cancel(3, 4);

      assert.equal(cancelled.status, 'CANCELLED');
      const cancelCall = getQuery('UPDATE requests');
      assert.ok(cancelCall);
      assert.ok(cancelCall.query.includes("status = 'CANCELLED'"));
      assert.ok(cancelCall.query.includes('AND user_id = ?'));
      assert.deepEqual(cancelCall.params, [3, 4]);
    });
  });

  // ===========================================================================
  // roomRepository & bookingRepository Adapters Tests
  // ===========================================================================
  describe('roomRepository & bookingRepository Adapters', () => {
    test('17. roomRepository delegates to resourceRepository with type="ROOM"', async () => {
      mockQueryResult = [[
        { id: 1, name: 'Seminar Room 101', type: 'ROOM' },
        { id: 2, name: 'Conference Hall Alpha', type: 'ROOM' }
      ]];

      const rooms = await roomRepository.findAll();
      const last = getLastQuery();

      assert.equal(rooms.length, 2);
      assert.ok(last.query.includes('AND type = ?'));
      assert.deepEqual(last.params, [1, 'ROOM']);
    });

    test('18. bookingRepository maps parameters cleanly to requestRepository', async () => {
      pool.query = async (query, params) => {
        queries.push({ query, params });
        if (query.includes('INSERT INTO requests')) {
          return [{ insertId: 77 }];
        }
        if (query.includes('FROM requests req')) {
          return [[{
            id: 77,
            user_id: 3,
            resource_id: 1,
            purpose: 'Study Group',
            status: 'PENDING'
          }]];
        }
        return [[]];
      };

      const booking = await bookingRepository.create({
        userId: 3,
        roomId: 1,
        startTime: '2026-10-15 14:00:00',
        endTime: '2026-10-15 16:00:00',
        purpose: 'Study Group'
      });

      assert.equal(booking.id, 77);
      assert.equal(booking.resource_id, 1);

      const insertCall = getQuery('INSERT INTO requests');
      assert.ok(insertCall);
      assert.deepEqual(insertCall.params, [3, 1, '2026-10-15 14:00:00', '2026-10-15 16:00:00', 'Study Group']);
    });
  });

  // ===========================================================================
  // SQL Injection & Security Verification
  // ===========================================================================
  describe('Security & Parameterized Query Verification', () => {
    test('19. Raw SQL injection in search parameters is safely parameterized', async () => {
      mockQueryResult = [[]];
      const maliciousPayload = "' OR '1'='1' -- ";

      await resourceRepository.findAll({ search: maliciousPayload });
      const last = getLastQuery();

      // Ensure the query uses placeholders (?) and the payload is bound in parameters
      assert.ok(!last.query.includes(maliciousPayload), 'Query text must not concatenate user input directly');
      assert.ok(last.params.includes(`%${maliciousPayload}%`), 'Payload must be passed strictly in parameter array');
    });
  });
});
