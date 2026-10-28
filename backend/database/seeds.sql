-- =============================================================================
-- Smartly Access Flow Control Management System
-- Development-Only Seed Data
-- =============================================================================

USE smartly;

-- =============================================================================
-- Seed Users
-- Passwords for all seeded users: password123
-- Pre-computed bcrypt hash: $2b$10$K6V0zgHFIC8H4DQJWsIYx.Wd48O2fEsM//XecMvI09xW6q.sVbJNy
-- =============================================================================
INSERT INTO users (id, name, email, password_hash, role, is_active)
VALUES
  (1, 'System Administrator', 'admin@smartly.local', '$2b$10$K6V0zgHFIC8H4DQJWsIYx.Wd48O2fEsM//XecMvI09xW6q.sVbJNy', 'ADMIN', 1),
  (2, 'Prof. Alan Turing', 'faculty@smartly.local', '$2b$10$K6V0zgHFIC8H4DQJWsIYx.Wd48O2fEsM//XecMvI09xW6q.sVbJNy', 'FACULTY', 1),
  (3, 'Grace Hopper', 'student@smartly.local', '$2b$10$K6V0zgHFIC8H4DQJWsIYx.Wd48O2fEsM//XecMvI09xW6q.sVbJNy', 'STUDENT', 1),
  (4, 'Ada Lovelace', 'student2@smartly.local', '$2b$10$K6V0zgHFIC8H4DQJWsIYx.Wd48O2fEsM//XecMvI09xW6q.sVbJNy', 'STUDENT', 1),
  (5, 'Deactivated Account', 'inactive@smartly.local', '$2b$10$K6V0zgHFIC8H4DQJWsIYx.Wd48O2fEsM//XecMvI09xW6q.sVbJNy', 'STUDENT', 0)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  role = VALUES(role),
  is_active = VALUES(is_active);

-- =============================================================================
-- Seed Resources
-- =============================================================================
INSERT INTO resources (id, name, type, capacity, location, description, status, is_active)
VALUES
  (1, 'Seminar Room 101', 'ROOM', 40, 'Building A, Floor 1', 'Equipped with smart board and sound system', 'AVAILABLE', 1),
  (2, 'Conference Hall Alpha', 'ROOM', 80, 'Building A, Floor 2', 'Large conference room for guest lectures', 'AVAILABLE', 1),
  (3, 'Computer Systems Lab', 'LAB', 60, 'Building B, Floor 3', 'Dual-monitor workstations with GPU access', 'AVAILABLE', 1),
  (4, 'Robotics & IoT Lab', 'LAB', 30, 'Building B, Floor 1', 'Hardware testing benches and 3D printers', 'AVAILABLE', 1),
  (5, 'Grand University Auditorium', 'HALL', 450, 'Central Block, Ground Floor', 'Main campus auditorium for large events', 'AVAILABLE', 1),
  (6, 'High-Definition Laser Projector', 'EQUIPMENT', 1, 'AV Storage Unit 4', 'Portable 4K laser projector unit', 'AVAILABLE', 1),
  (7, 'Physics Research Lab 2', 'LAB', 25, 'Science Block, Basement', 'Under scheduled routine sensor calibration', 'MAINTENANCE', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  type = VALUES(type),
  capacity = VALUES(capacity),
  location = VALUES(location),
  status = VALUES(status),
  is_active = VALUES(is_active);

-- =============================================================================
-- Seed Requests (Bookings / Access requests)
-- =============================================================================
INSERT INTO requests (id, user_id, resource_id, start_time, end_time, purpose, status, reviewed_by, reviewed_at, rejection_reason)
VALUES
  (1, 3, 1, '2026-10-15 10:00:00', '2026-10-15 12:00:00', 'Algorithm study group seminar session', 'APPROVED', 1, '2026-10-13 09:30:00', NULL),
  (2, 4, 3, '2026-10-16 14:00:00', '2026-10-16 17:00:00', 'Distributed systems project performance benchmark run', 'PENDING', NULL, NULL, NULL),
  (3, 3, 5, '2026-10-18 09:00:00', '2026-10-18 18:00:00', 'Hackathon opening ceremony rehearsals', 'REJECTED', 1, '2026-10-14 11:00:00', 'Auditorium reserved for faculty council meeting during this window')
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  reviewed_by = VALUES(reviewed_by),
  reviewed_at = VALUES(reviewed_at),
  rejection_reason = VALUES(rejection_reason);
