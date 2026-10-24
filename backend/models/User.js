const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class User {
    static async create(userData) {
        const id = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        await pool.execute(
            `INSERT INTO users (id, name, email, phone, password, role, location) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, userData.name, userData.email, userData.phone, hashedPassword, userData.role || 'user', userData.location || null]
        );
        
        return this.findById(id);
    }

    static async findOne(query) {
        const id = query.id || query._id;

        if (query.email) {
            const cleanEmail = String(query.email).trim().toLowerCase();
            const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [cleanEmail]);
            if (rows.length === 0) return null;
            
            const user = rows[0];
            user._id = user.id;
            // Mocking the matchPassword function since controllers expect a Mongoose-like instance
            user.matchPassword = async function(enteredPassword) {
                return await bcrypt.compare(enteredPassword, this.password);
            };
            return user;
        }
        
        if (id && query.role) {
            const cleanId = (typeof id === 'object' && id !== null) ? (id._id || id.id) : id;
            const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? AND role = ?', [cleanId, query.role]);
            return rows.length > 0 ? { ...rows[0], _id: rows[0].id } : null;
        }

        if (id) {
            return this.findById(id);
        }

        if (query.role) {
            const [rows] = await pool.execute('SELECT * FROM users WHERE role = ? LIMIT 1', [query.role]);
            return rows.length > 0 ? { ...rows[0], _id: rows[0].id } : null;
        }

        return null;
    }

    static async findById(id) {
        const cleanId = (typeof id === 'object' && id !== null) ? (id._id || id.id) : id;
        if (!cleanId) return null;
        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [cleanId]);
        if (rows.length === 0) return null;
        
        const user = rows[0];
        user._id = user.id;
        return user;
    }

    static async find(query = {}) {
        if (query.role) {
            const [rows] = await pool.execute('SELECT * FROM users WHERE role = ?', [query.role]);
            return rows.map(r => ({ ...r, _id: r.id }));
        }
        
        const [rows] = await pool.execute('SELECT * FROM users');
        return rows.map(r => ({ ...r, _id: r.id }));
    }
}

module.exports = User;
