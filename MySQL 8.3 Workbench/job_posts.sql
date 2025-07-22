CREATE DATABASE IF NOT EXISTS job_tracker 
DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE job_tracker;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  avatar TEXT,
  otp VARCHAR(6),
  otp_expiry DATETIME,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB COMMENT 'User accounts table';

-- Job posts table
CREATE TABLE IF NOT EXISTS job_posts (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  userId VARCHAR(36) NOT NULL,
  username VARCHAR(255) NOT NULL,
  userAvatar TEXT,
  jobLink TEXT NOT NULL,
  datePosted DATE NOT NULL,
  company VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  skills JSON,
  location VARCHAR(255) NOT NULL,
  lastDate DATE NOT NULL,
  experience VARCHAR(50) NOT NULL,
  workMode ENUM('remote', 'hybrid', 'onsite') NOT NULL,
  status ENUM('active', 'inactive', 'filled') DEFAULT 'active',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (userId),
  INDEX idx_company (company),
  INDEX idx_status (status),
  INDEX idx_date_posted (datePosted)
) ENGINE=InnoDB COMMENT 'Job postings table';

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  bio TEXT,
  dob DATE,
  gender VARCHAR(20),
  address TEXT,
  facebook VARCHAR(255),
  instagram VARCHAR(255),
  linkedin VARCHAR(255),
  telegram VARCHAR(255),
  snapchat VARCHAR(255),
  github VARCHAR(255),
  portfolio VARCHAR(255),
  background_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY (user_id)
) ENGINE=InnoDB COMMENT 'Extended user profile data';


-- Add this to your job_posts.sql file
CREATE TABLE IF NOT EXISTS user_activity (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP NULL,
  duration_seconds INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_time (start_time)
) ENGINE=InnoDB COMMENT 'User activity tracking table';

ALTER TABLE user_activity 
MODIFY COLUMN start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY COLUMN end_time TIMESTAMP NULL,
MODIFY COLUMN duration_seconds INT NOT NULL DEFAULT 0,
ADD INDEX idx_date (start_time);
