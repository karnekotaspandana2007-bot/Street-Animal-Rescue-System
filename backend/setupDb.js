const { pool } = require('./config/db');

async function setupDatabase() {
    try {
        console.log('Creating tables...');

        await pool.execute('DROP TABLE IF EXISTS rescue_records');
        await pool.execute('DROP TABLE IF EXISTS animal_reports');
        await pool.execute('DROP TABLE IF EXISTS users');

        // Create users table
        await pool.execute(`
            CREATE TABLE users (
                id CHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                phone VARCHAR(20) NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'rescuer', 'admin') DEFAULT 'user',
                location VARCHAR(255),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('users table ready.');

        // Create animal_reports table
        await pool.execute(`
            CREATE TABLE animal_reports (
                id CHAR(36) PRIMARY KEY,
                userId CHAR(36) NOT NULL,
                animalType VARCHAR(50) NOT NULL,
                \`condition\` VARCHAR(50) NOT NULL,
                severity VARCHAR(50) NOT NULL,
                description TEXT NOT NULL,
                image VARCHAR(255) NOT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                address VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'Pending',
                assignedRescuer CHAR(36),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (assignedRescuer) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('animal_reports table ready.');

        // Create rescue_records table
        await pool.execute(`
            CREATE TABLE rescue_records (
                id CHAR(36) PRIMARY KEY,
                reportId CHAR(36) NOT NULL,
                rescuerId CHAR(36) NOT NULL,
                rescueStatus VARCHAR(50) NOT NULL,
                notes TEXT,
                completionImage VARCHAR(255),
                rescueDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (reportId) REFERENCES animal_reports(id) ON DELETE CASCADE,
                FOREIGN KEY (rescuerId) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('rescue_records table ready.');

        console.log('Database setup completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error setting up database:', error);
        process.exit(1);
    }
}

setupDatabase();
