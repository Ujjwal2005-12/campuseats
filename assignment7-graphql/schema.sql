-- =========================================================
-- CampusEats GraphQL Service Database Schema & Seed Data
-- CS543 Web Services · Assignment 7
-- =========================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS campuseats_graphql;
USE campuseats_graphql;

-- Create dishes table
CREATE TABLE IF NOT EXISTS dishes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(8, 2) NOT NULL,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert 4 initial seed records safely
-- Idempotent insert: updates values if keys already exist
INSERT INTO dishes (id, name, price, available) VALUES
(1, 'Paneer Roll', 90.00, TRUE),
(2, 'Veg Sandwich', 60.00, TRUE),
(3, 'Masala Dosa', 80.00, TRUE),
(4, 'Cold Coffee', 50.00, FALSE)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    price = VALUES(price),
    available = VALUES(available);
