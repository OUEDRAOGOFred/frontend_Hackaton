-- Création de la base de données
CREATE DATABASE IF NOT EXISTS learning_platform;
USE learning_platform;

-- Table des rôles
CREATE TABLE IF NOT EXISTS Roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    roleId INT,
    isActive BOOLEAN DEFAULT true,
    gdprConsent BOOLEAN DEFAULT false,
    lastLogin TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (roleId) REFERENCES Roles(id)
);

-- Table des projets
CREATE TABLE IF NOT EXISTS Projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pending', 'active', 'completed') DEFAULT 'pending',
    userId INT,
    deadline TIMESTAMP NULL,
    isArchived BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Table des jetons
CREATE TABLE IF NOT EXISTS Tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT,
    type ENUM('quiz', 'forum', 'peer_review', 'help') NOT NULL,
    value INT DEFAULT 0,
    expiresAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS Notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT,
    message TEXT NOT NULL,
    type ENUM('email', 'sms', 'push', 'calendar') NOT NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    scheduledFor TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id)
);