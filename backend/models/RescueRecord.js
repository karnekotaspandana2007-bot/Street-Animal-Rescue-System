const { pool } = require('../config/db');
const crypto = require('crypto');

class RescueRecord {
    static async create(data) {
        const id = crypto.randomUUID();
        
        await pool.execute(
            `INSERT INTO rescue_records (id, reportId, rescuerId, rescueStatus, notes, completionImage) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                id, 
                data.reportId, 
                data.rescuerId, 
                data.rescueStatus || 'Started', 
                data.notes || '', 
                data.completionImage || null
            ]
        );
        
        return this.findById(id);
    }

    static async find(query = {}) {
        let sql = 'SELECT * FROM rescue_records';
        let params = [];

        if (query.reportId) {
            sql += ' WHERE reportId = ?';
            params.push(query.reportId);
        } else if (query.rescuerId) {
            sql += ' WHERE rescuerId = ?';
            params.push(query.rescuerId);
        }

        const [rows] = await pool.execute(sql, params);
        return rows.map(r => ({ ...r, _id: r.id }));
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM rescue_records WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        
        const record = rows[0];
        record._id = record.id;
        return record;
    }

    static async findOne(query) {
        if (query.reportId) {
            const [rows] = await pool.execute('SELECT * FROM rescue_records WHERE reportId = ?', [query.reportId]);
            if (rows.length === 0) return null;
            
            const record = rows[0];
            record._id = record.id;
            return record;
        }
        return null;
    }
}

module.exports = RescueRecord;
