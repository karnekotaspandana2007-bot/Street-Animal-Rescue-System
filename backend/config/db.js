const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

let poolConfig;

if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
    poolConfig = {
        uri: process.env.MYSQL_URL || process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
} else {
    poolConfig = {
        host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
        user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || 'Venkatrao@22',
        database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'smart_animal_rescue',
        port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
}

const pool = mysql.createPool(poolConfig);

const initDatabase = async () => {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
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

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS animal_reports (
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

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS rescue_records (
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

        // Check and seed default admin
        const [adminRows] = await pool.execute('SELECT id FROM users WHERE email = ?', ['admin@example.com']);
        if (adminRows.length === 0) {
            const adminId = crypto.randomUUID();
            const adminHash = await bcrypt.hash('adminpassword123', 10);
            await pool.execute(
                `INSERT INTO users (id, name, email, phone, password, role, location) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [adminId, 'Admin User', 'admin@example.com', '0000000000', adminHash, 'admin', 'HQ']
            );
            console.log('Default admin seeded.');
        }

        // Check and seed default rescuer
        const [rescuerRows] = await pool.execute('SELECT id FROM users WHERE email = ?', ['rescuer@example.com']);
        if (rescuerRows.length === 0) {
            const rescuerId = crypto.randomUUID();
            const rescuerHash = await bcrypt.hash('rescuerpassword123', 10);
            await pool.execute(
                `INSERT INTO users (id, name, email, phone, password, role, location) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [rescuerId, 'Field Rescuer 1', 'rescuer@example.com', '1111111111', rescuerHash, 'rescuer', 'City Center']
            );
            console.log('Default rescuer seeded.');
        }
    } catch (err) {
        console.error('Error during auto-initialization of DB tables:', err.message);
    }
};

const connectDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL Connected Successfully');
        connection.release();
        await initDatabase();
    } catch (error) {
        console.error('MySQL connection error:', error.message);
        console.warn('⚠️ Server will stay running, but please provide valid database credentials in your environment variables.');
    }
};

module.exports = { pool, connectDB };