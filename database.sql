-- =======================================================
-- Smart Street Animal Rescue System - Database Schema
-- Database: smart_animal_rescue
-- Tool: MySQL Workbench / MySQL Server
-- =======================================================

-- 1. Create the Database if not exists
CREATE DATABASE IF NOT EXISTS `smart_animal_rescue` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `smart_animal_rescue`;

-- 2. Drop existing tables if re-initializing (in reverse foreign key order)
-- DROP TABLE IF EXISTS `rescue_records`;
-- DROP TABLE IF EXISTS `animal_reports`;
-- DROP TABLE IF EXISTS `users`;

-- =======================================================
-- Table 1: users
-- =======================================================
CREATE TABLE IF NOT EXISTS `users` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `phone` VARCHAR(20) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('user', 'rescuer', 'admin') DEFAULT 'user',
    `location` VARCHAR(255) NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================
-- Table 2: animal_reports
-- =======================================================
CREATE TABLE IF NOT EXISTS `animal_reports` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `userId` CHAR(36) NOT NULL,
    `animalType` VARCHAR(50) NOT NULL,
    `condition` VARCHAR(50) NOT NULL,
    `severity` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `image` VARCHAR(255) NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'Pending',
    `assignedRescuer` CHAR(36) NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`assignedRescuer`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================
-- Table 3: rescue_records
-- =======================================================
CREATE TABLE IF NOT EXISTS `rescue_records` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `reportId` CHAR(36) NOT NULL,
    `rescuerId` CHAR(36) NOT NULL,
    `rescueStatus` VARCHAR(50) NOT NULL,
    `notes` TEXT NULL,
    `completionImage` VARCHAR(255) NULL,
    `rescueDate` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`reportId`) REFERENCES `animal_reports`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`rescuerId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================
-- 3. Insert Default Users (Passwords hashed with bcrypt)
-- =======================================================

-- Admin Account (Password: adminpassword123)
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `location`)
VALUES (
    '59ad1ac1-450c-4d68-a18d-977b1aec3665', 
    'System Admin', 
    'admin@gmail.com', 
    '0000000000', 
    '$2a$10$d5pVIpZiQzqXlVWb6QiKbezxVDgV0Lna96UkMGUjq5kgrMauGagMy', 
    'admin', 
    'HQ'
) ON DUPLICATE KEY UPDATE `password` = VALUES(`password`), `role` = VALUES(`role`), `name` = VALUES(`name`);

-- Rescuer 1 (Password: rescuerpassword123)
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `location`)
VALUES (
    'e09e4fad-69e9-4c6d-ad2a-fa95f1572df2', 
    'Field Rescuer 1', 
    'rescuer@gmail.com', 
    '9876543210', 
    '$2a$10$VP4LxCO3a5H13gnXSYL9CONzYQe5nnTSAdsJwRbs83c0f9TuNDwmy', 
    'rescuer', 
    'Downtown / Central Hub'
) ON DUPLICATE KEY UPDATE `password` = VALUES(`password`), `role` = VALUES(`role`), `name` = VALUES(`name`);

-- Rescuer 2 (Password: rescuerpassword123)
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `location`)
VALUES (
    'f3889deb-b7c6-4849-8ea0-1248acc3a9ef', 
    'Rescuer Sarah', 
    'sarah.rescuer@gmail.com', 
    '9876543211', 
    '$2a$10$VP4LxCO3a5H13gnXSYL9CONzYQe5nnTSAdsJwRbs83c0f9TuNDwmy', 
    'rescuer', 
    'North Zone Shelter'
) ON DUPLICATE KEY UPDATE `password` = VALUES(`password`), `role` = VALUES(`role`), `name` = VALUES(`name`);

-- Rescuer 3 (Password: rescuerpassword123)
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `location`)
VALUES (
    '9d47bb3a-cb5c-4845-a587-ceb5638b6cc4', 
    'Rescuer David (Veterinary Aid)', 
    'david.rescuer@gmail.com', 
    '9876543212', 
    '$2a$10$VP4LxCO3a5H13gnXSYL9CONzYQe5nnTSAdsJwRbs83c0f9TuNDwmy', 
    'rescuer', 
    'South District Clinic'
) ON DUPLICATE KEY UPDATE `password` = VALUES(`password`), `role` = VALUES(`role`), `name` = VALUES(`name`);

-- =======================================================
-- 4. Verification Queries
-- =======================================================
SELECT * FROM `users`;
SELECT * FROM `animal_reports`;
SELECT * FROM `rescue_records`;
