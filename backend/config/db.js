const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

let poolConfig;
const rawUri = process.env.MYSQL_URL || process.env.DATABASE_URL;
let validUri = null;

if (rawUri && !rawUri.includes('host:port') && !rawUri.includes('your_') && !rawUri.includes('user:password')) {
    try {
        new URL(rawUri);
        validUri = rawUri;
    } catch (e) {
        console.warn('⚠️ Invalid MYSQL_URL provided, falling back to host/user config.');
    }
}

if (validUri) {
    poolConfig = {
        uri: validUri,
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
        port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
}

const { localPool, ensureData } = require('./localStore');

let useLocal = false;
let mysqlPool;
try {
    mysqlPool = mysql.createPool(poolConfig);
} catch (err) {
    useLocal = true;
}

const pool = {
    async execute(sql, params) {
        if (useLocal) {
            return localPool.execute(sql, params);
        }
        try {
            return await mysqlPool.execute(sql, params);
        } catch (err) {
            console.warn('⚠️ MySQL query failed, switching to embedded database store:', err.message);
            useLocal = true;
            return localPool.execute(sql, params);
        }
    },
    async getConnection() {
        if (useLocal) return localPool.getConnection();
        try {
            return await mysqlPool.getConnection();
        } catch (err) {
            useLocal = true;
            return localPool.getConnection();
        }
    }
};

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
        const [adminRows] = await pool.execute('SELECT id FROM users WHERE email = ?', ['admin@gmail.com']);
        const adminHash = await bcrypt.hash('adminpassword123', 10);
        if (adminRows.length === 0) {
            const adminId = '59ad1ac1-450c-4d68-a18d-977b1aec3665';
            await pool.execute(
                `INSERT INTO users (id, name, email, phone, password, role, location) VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role), name = VALUES(name)`,
                [adminId, 'System Admin', 'admin@gmail.com', '0000000000', adminHash, 'admin', 'HQ']
            );
            console.log('Default admin seeded.');
        } else {
            await pool.execute('UPDATE users SET password = ?, role = "admin", name = "System Admin" WHERE email = ?', [adminHash, 'admin@gmail.com']);
        }

        // Check and seed default rescuer
        const [rescuerRows] = await pool.execute('SELECT id FROM users WHERE email = ?', ['rescuer@gmail.com']);
        const rescuerHash = await bcrypt.hash('rescuerpassword123', 10);
        if (rescuerRows.length === 0) {
            const rescuerId = 'e09e4fad-69e9-4c6d-ad2a-fa95f1572df2';
            await pool.execute(
                `INSERT INTO users (id, name, email, phone, password, role, location) VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role), name = VALUES(name)`,
                [rescuerId, 'Field Rescuer 1', 'rescuer@gmail.com', '9876543210', rescuerHash, 'rescuer', 'Downtown / Central Hub']
            );
            console.log('Default rescuer seeded.');
        } else {
            await pool.execute('UPDATE users SET password = ?, role = "rescuer", name = "Field Rescuer 1" WHERE email = ?', [rescuerHash, 'rescuer@gmail.com']);
        }

        // Rescuer Sarah
        const [sarahRows] = await pool.execute('SELECT id FROM users WHERE email = ?', ['sarah.rescuer@gmail.com']);
        if (sarahRows.length === 0) {
            await pool.execute(
                `INSERT INTO users (id, name, email, phone, password, role, location) VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role), name = VALUES(name)`,
                ['f3889deb-b7c6-4849-8ea0-1248acc3a9ef', 'Rescuer Sarah', 'sarah.rescuer@gmail.com', '9876543211', rescuerHash, 'rescuer', 'North Zone Shelter']
            );
        }

        // Rescuer David
        const [davidRows] = await pool.execute('SELECT id FROM users WHERE email = ?', ['david.rescuer@gmail.com']);
        if (davidRows.length === 0) {
            await pool.execute(
                `INSERT INTO users (id, name, email, phone, password, role, location) VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role), name = VALUES(name)`,
                ['9d47bb3a-cb5c-4845-a587-ceb5638b6cc4', 'Rescuer David (Veterinary Aid)', 'david.rescuer@gmail.com', '9876543212', rescuerHash, 'rescuer', 'South District Clinic']
            );
        }
    } catch (err) {
        console.error('Error during auto-initialization of DB tables:', err.message);
    }
};

const connectDB = async () => {
    try {
        const connection = await mysqlPool.getConnection();
        console.log('MySQL Connected Successfully');
        connection.release();
        await initDatabase();
    } catch (error) {
        console.warn('⚠️ MySQL not reachable (' + error.message + '). Automatically activating embedded database fallback for cloud deployment.');
        useLocal = true;
        ensureData();
        console.log('Embedded Database Store Activated Successfully (Users and Reports ready).');
    }
};

module.exports = { pool, connectDB };