-- =========================================================
-- CampusEats Database Schema
-- One table per noun from brief.md — no tables added beyond
-- what the brief states: Student/Vendor/Administrator, Menu,
-- Food Item, Cart, Order, Order Item, Payment, Pickup Slot,
-- Notification.
--
-- Student, Vendor, and Administrator share one Users table
-- (a role column distinguishes them) since the brief treats
-- them as three roles of the same actor, not three data types.
--
-- Tables are grouped below by the service that owns them.
-- Cross-service references (marked "-- ext ref") are plain
-- columns, NOT enforced foreign keys, since each service owns
-- its own database.
-- =========================================================

-- ---------------------------------------------------------
-- USER SERVICE
-- ---------------------------------------------------------
CREATE TABLE Users (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(100)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    role            VARCHAR(20)   NOT NULL DEFAULT 'student',  -- student, vendor, admin
    canteen_name    VARCHAR(150),   -- only set when role = 'vendor'
    location        VARCHAR(200),   -- only set when role = 'vendor'
    status          VARCHAR(20)     -- only set when role = 'vendor' (OPEN, CLOSED)
);

-- ---------------------------------------------------------
-- CATALOGUE SERVICE
-- ---------------------------------------------------------
CREATE TABLE Menu (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id       INT NOT NULL,        -- ext ref: User Service Users.id (role = vendor)
    name            VARCHAR(100)  NOT NULL
);

CREATE TABLE FoodItem (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    menu_id         INT NOT NULL,
    name            VARCHAR(150)  NOT NULL,
    price           DECIMAL(8,2)  NOT NULL,
    category        VARCHAR(50),
    available       BOOLEAN       NOT NULL DEFAULT TRUE,
    FOREIGN KEY (menu_id) REFERENCES Menu(id)
);

-- ---------------------------------------------------------
-- ORDER SERVICE
-- ---------------------------------------------------------
CREATE TABLE Cart (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    student_id      INT NOT NULL,        -- ext ref: User Service Users.id (role = student)
    item_id         INT NOT NULL,        -- ext ref: Catalogue Service FoodItem.id
    quantity        INT NOT NULL DEFAULT 1
);

CREATE TABLE PickupSlot (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id       INT NOT NULL,        -- ext ref: User Service Users.id (role = vendor)
    slot_time       DATETIME      NOT NULL,
    capacity        INT NOT NULL,
    booked_count    INT NOT NULL DEFAULT 0
);

CREATE TABLE `Order` (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    student_id      INT NOT NULL,        -- ext ref: User Service Users.id
    vendor_id       INT NOT NULL,        -- ext ref: User Service Users.id
    pickup_slot_id  INT NOT NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'PLACED',  -- PLACED, ACCEPTED, REJECTED, PREPARING, READY, COMPLETED, CANCELLED
    total_amount    DECIMAL(8,2)  NOT NULL,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pickup_slot_id) REFERENCES PickupSlot(id)
);

CREATE TABLE OrderItem (
    id                  INT PRIMARY KEY AUTO_INCREMENT,
    order_id            INT NOT NULL,
    item_id             INT NOT NULL,        -- ext ref: Catalogue Service FoodItem.id
    item_name_snapshot  VARCHAR(150)  NOT NULL,
    price_snapshot      DECIMAL(8,2)  NOT NULL,
    quantity            INT NOT NULL DEFAULT 1,
    FOREIGN KEY (order_id) REFERENCES `Order`(id)
);

-- ---------------------------------------------------------
-- PAYMENT SERVICE
-- ---------------------------------------------------------
CREATE TABLE Payment (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    order_id        INT NOT NULL,        -- ext ref: Order Service Order.id
    amount          DECIMAL(8,2)  NOT NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING',  -- PENDING, SUCCESS, FAILED, REFUNDED
    method          VARCHAR(30),
    transaction_ref VARCHAR(100)
);

-- ---------------------------------------------------------
-- NOTIFICATION SERVICE
-- ---------------------------------------------------------
CREATE TABLE Notification (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT NOT NULL,        -- ext ref: User Service Users.id
    message         VARCHAR(255)  NOT NULL,
    type            VARCHAR(30),
    status          VARCHAR(20)   NOT NULL DEFAULT 'SENT'
);
