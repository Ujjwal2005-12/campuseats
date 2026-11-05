-- =============================================================================
-- Smartly Access Flow Control Management System
-- Database Schema Definition (MySQL)
-- Role: Member 2 — database schema, MySQL integration, and data layer
-- =============================================================================

-- Create Database if not present
CREATE DATABASE IF NOT EXISTS smartly
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smartly;

-- =============================================================================
-- Table: users
-- Contract adhered from Member 1:
-- id, name, email, password_hash, role ('ADMIN', 'FACULTY', 'STUDENT'), is_active
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'FACULTY', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email),
  INDEX idx_users_role (role),
  INDEX idx_users_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Table: resources
-- Represents rooms, labs, auditoriums, and reservable facilities
-- =============================================================================
CREATE TABLE IF NOT EXISTS resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL DEFAULT 'ROOM',
  capacity INT NOT NULL DEFAULT 1,
  location VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  status ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_resources_type (type),
  INDEX idx_resources_status (status),
  INDEX idx_resources_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Table: requests
-- Represents access requests and bookings for managed resources
-- =============================================================================
CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  resource_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  purpose TEXT NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  reviewed_by INT DEFAULT NULL,
  reviewed_at DATETIME DEFAULT NULL,
  rejection_reason VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_requests_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_requests_resource FOREIGN KEY (resource_id)
    REFERENCES resources (id) ON DELETE CASCADE,
  CONSTRAINT fk_requests_reviewer FOREIGN KEY (reviewed_by)
    REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_requests_time_window CHECK (end_time > start_time),
  INDEX idx_requests_user_id (user_id),
  INDEX idx_requests_resource_id (resource_id),
  INDEX idx_requests_status (status),
  INDEX idx_requests_time_overlap (resource_id, start_time, end_time),
  INDEX idx_requests_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Compatibility Views
-- Provides seamless aliases for room and booking terminology
-- =============================================================================
CREATE OR REPLACE VIEW rooms AS
  SELECT
    id,
    name,
    type,
    capacity,
    location,
    description,
    status,
    is_active,
    created_at,
    updated_at
  FROM resources
  WHERE type = 'ROOM';

CREATE OR REPLACE VIEW bookings AS
  SELECT
    id,
    user_id,
    resource_id AS room_id,
    resource_id,
    start_time,
    end_time,
    purpose,
    status,
    reviewed_by,
    reviewed_at,
    rejection_reason,
    created_at,
    updated_at
  FROM requests;
