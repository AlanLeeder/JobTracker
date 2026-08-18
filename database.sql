-- Create the database used by JobTracker
CREATE DATABASE IF NOT EXISTS JobTracker;

-- Select the database before creating its tables
USE JobTracker;


-- Users Table

-- Stores registered JobTracker users.
CREATE TABLE IF NOT EXISTS UsersTable (
    userID INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (userID),
    UNIQUE KEY email_UNIQUE (email)
);


-- Applications Table

-- Stores job applications belonging to registered users.
CREATE TABLE IF NOT EXISTS ApplicationsTable (
    id INT NOT NULL AUTO_INCREMENT,
    userID INT NOT NULL,
    company VARCHAR(100) NOT NULL,
    role_title VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Applied',
    date_applied DATE DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    -- Create an index for the userID foreign key.
    KEY user_id_idx (userID),

    -- Connect each application to the user who created it.
    -- If the user is deleted, their applications are also deleted.
    CONSTRAINT userID
        FOREIGN KEY (userID)
        REFERENCES UsersTable (userID)
        ON DELETE CASCADE
);