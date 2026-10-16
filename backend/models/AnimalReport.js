const { pool } = require('../config/db');
const crypto = require('crypto');

class AnimalReport {
    static async create(data) {
        const id = crypto.randomUUID();
        
        await pool.execute(
            `INSERT INTO animal_reports (id, userId, animalType, \`condition\`, severity, description, image, latitude, longitude, address, status, assignedRescuer) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, 
                data.userId, 
                data.animalType, 
                data.condition, 
                data.severity, 
                data.description, 
                data.image, 
                data.latitude || 0, 
                data.longitude || 0, 
                data.address || '',
                data.status || 'Pending',
                data.assignedRescuer || null
            ]
        );
        
        return this.findById(id);
    }

    static async find(query = {}) {
        let sql = 'SELECT r.*, u.name as reporterName FROM animal_reports r LEFT JOIN users u ON r.userId = u.id';
        let params = [];

        if (query.userId) {
            sql += ' WHERE r.userId = ?';
            params.push(query.userId);
        } else if (query.assignedRescuer) {
            sql += ' WHERE r.assignedRescuer = ?';
            params.push(query.assignedRescuer);
        }
        
        sql += ' ORDER BY r.createdAt DESC';

        const [rows] = await pool.execute(sql, params);
        return rows.map(r => this._mapRowToModel(r));
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT r.*, u.name as reporterName FROM animal_reports r LEFT JOIN users u ON r.userId = u.id WHERE r.id = ?', [id]);
        if (rows.length === 0) return null;
        
        return this._mapRowToModel(rows[0]);
    }

    static async findByIdAndUpdate(id, updates) {
        const setFields = [];
        const params = [];
        
        if (updates.status !== undefined) {
            setFields.push('status = ?');
            params.push(updates.status);
        }
        if (updates.assignedRescuer !== undefined) {
            setFields.push('assignedRescuer = ?');
            params.push(updates.assignedRescuer);
        }

        if (setFields.length > 0) {
            params.push(id);
            await pool.execute(`UPDATE animal_reports SET ${setFields.join(', ')} WHERE id = ?`, params);
        }

        return this.findById(id);
    }

    static async deleteOne(query) {
        // query is an object like { _id: id } due to mongoose controller style
        const id = query._id || query;
        await pool.execute('DELETE FROM animal_reports WHERE id = ?', [id]);
    }

    // Helper to map DB row to JS object structure frontend expects
    static _mapRowToModel(row) {
        return {
            _id: row.id,
            userId: {
                _id: row.userId,
                name: row.reporterName || 'Unknown'
            },
            animalType: row.animalType,
            condition: row.condition,
            severity: row.severity,
            description: row.description,
            image: row.image,
            location: {
                type: 'Point',
                coordinates: [Number(row.longitude), Number(row.latitude)],
                address: row.address
            },
            address: row.address,
            latitude: row.latitude,
            longitude: row.longitude,
            status: row.status,
            assignedRescuer: row.assignedRescuer,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
        };
    }
}

module.exports = AnimalReport;
