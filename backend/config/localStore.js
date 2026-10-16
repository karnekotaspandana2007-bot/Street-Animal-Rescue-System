const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureData() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let data = { users: [], animal_reports: [], rescue_records: [] };
    if (fs.existsSync(DB_FILE)) {
        try {
            data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            if (!Array.isArray(data.users)) data.users = [];
            if (!Array.isArray(data.animal_reports)) data.animal_reports = data.reports || [];
            if (!Array.isArray(data.rescue_records)) data.rescue_records = data.rescueRecords || [];
        } catch {
            data = { users: [], animal_reports: [], rescue_records: [] };
        }
    }

    // Check and seed admin
    if (!data.users.some(u => u.email && u.email.toLowerCase() === 'admin@example.com')) {
        const adminHash = bcrypt.hashSync('adminpassword123', 10);
        data.users.push({
            id: '59ad1ac1-450c-4d68-a18d-977b1aec3665',
            name: 'System Admin',
            email: 'admin@example.com',
            phone: '0000000000',
            password: adminHash,
            role: 'admin',
            location: 'HQ',
            createdAt: new Date().toISOString()
        });
    }

    // Check and seed rescuer
    if (!data.users.some(u => u.email && u.email.toLowerCase() === 'rescuer@example.com')) {
        const rescuerHash = bcrypt.hashSync('rescuerpassword123', 10);
        data.users.push({
            id: 'e09e4fad-69e9-4c6d-ad2a-fa95f1572df2',
            name: 'Field Rescuer 1',
            email: 'rescuer@example.com',
            phone: '9876543210',
            password: rescuerHash,
            role: 'rescuer',
            location: 'Downtown / Central Hub',
            createdAt: new Date().toISOString()
        });
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function readDb() {
    ensureData();
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch {
        return { users: [], animal_reports: [], rescue_records: [] };
    }
}

function writeDb(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('LocalStore save error:', err);
    }
}

const localPool = {
    async getConnection() {
        return { release: () => {} };
    },

    async execute(sql, params = []) {
        const cleanSql = sql.trim().replace(/\s+/g, ' ');
        const upper = cleanSql.toUpperCase();
        const db = readDb();

        // 1. DDL Statements (CREATE / DROP TABLE)
        if (upper.startsWith('CREATE TABLE') || upper.startsWith('DROP TABLE')) {
            return [[]];
        }

        // 2. USERS Queries
        if (upper.startsWith('INSERT INTO USERS')) {
            const [id, name, email, phone, password, role, location] = params;
            const newUser = {
                id,
                name,
                email,
                phone,
                password,
                role: role || 'user',
                location: location || null,
                createdAt: new Date().toISOString()
            };
            db.users.push(newUser);
            writeDb(db);
            return [{ insertId: id }];
        }

        if (upper.startsWith('SELECT * FROM USERS WHERE EMAIL = ?')) {
            const email = params[0];
            const found = db.users.filter(u => u.email.toLowerCase() === String(email).toLowerCase());
            return [found];
        }

        if (upper.startsWith('SELECT ID FROM USERS WHERE EMAIL = ?')) {
            const email = params[0];
            const found = db.users.filter(u => u.email.toLowerCase() === String(email).toLowerCase()).map(u => ({ id: u.id }));
            return [found];
        }

        if (upper.includes('FROM USERS WHERE ID = ? AND ROLE = ?')) {
            const [id, role] = params;
            const found = db.users.filter(u => u.id === id && u.role === role);
            return [found];
        }

        if (upper.includes('FROM USERS WHERE ID = ?')) {
            const id = params[0];
            const found = db.users.filter(u => u.id === id);
            return [found];
        }

        if (upper.includes('FROM USERS WHERE ROLE = ? LIMIT 1')) {
            const role = params[0];
            const found = db.users.filter(u => u.role === role).slice(0, 1);
            return [found];
        }

        if (upper.includes('FROM USERS WHERE ROLE = ?')) {
            const role = params[0];
            const found = db.users.filter(u => u.role === role);
            return [found];
        }

        if (upper.startsWith('SELECT * FROM USERS')) {
            return [db.users];
        }

        if (upper.startsWith('UPDATE USERS SET')) {
            // E.g. UPDATE users SET password = ?, role = "rescuer" WHERE email = ?
            const email = params[params.length - 1];
            const user = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
            if (user) {
                if (params.length === 2) {
                    user.password = params[0];
                    user.role = 'rescuer';
                }
                writeDb(db);
            }
            return [{ affectedRows: user ? 1 : 0 }];
        }

        // 3. ANIMAL REPORTS Queries
        if (upper.startsWith('INSERT INTO ANIMAL_REPORTS')) {
            const [id, userId, animalType, condition, severity, description, image, latitude, longitude, address, status, assignedRescuer] = params;
            const newReport = {
                id,
                userId,
                animalType,
                condition,
                severity,
                description,
                image,
                latitude: Number(latitude) || 0,
                longitude: Number(longitude) || 0,
                address: address || '',
                status: status || 'Pending',
                assignedRescuer: assignedRescuer || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            db.animal_reports.push(newReport);
            writeDb(db);
            return [{ insertId: id }];
        }

        if (upper.includes('FROM ANIMAL_REPORTS R LEFT JOIN USERS U')) {
            let reports = [...db.animal_reports];
            if (upper.includes('WHERE R.USERID = ?')) {
                reports = reports.filter(r => r.userId === params[0]);
            } else if (upper.includes('WHERE R.ASSIGNEDRESCUER = ?')) {
                reports = reports.filter(r => r.assignedRescuer === params[0]);
            } else if (upper.includes('WHERE R.ID = ?')) {
                reports = reports.filter(r => r.id === params[0]);
            }
            // Join reporterName
            const joined = reports.map(r => {
                const user = db.users.find(u => u.id === r.userId);
                return {
                    ...r,
                    reporterName: user ? user.name : 'Unknown'
                };
            });
            // Sort by createdAt DESC
            joined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return [joined];
        }

        if (upper.startsWith('UPDATE ANIMAL_REPORTS SET')) {
            const id = params[params.length - 1];
            const report = db.animal_reports.find(r => r.id === id);
            if (report) {
                if (upper.includes('STATUS = ?') && upper.includes('ASSIGNEDRESCUER = ?')) {
                    report.status = params[0];
                    report.assignedRescuer = params[1];
                } else if (upper.includes('STATUS = ?')) {
                    report.status = params[0];
                } else if (upper.includes('ASSIGNEDRESCUER = ?')) {
                    report.assignedRescuer = params[0];
                }
                report.updatedAt = new Date().toISOString();
                writeDb(db);
            }
            return [{ affectedRows: report ? 1 : 0 }];
        }

        if (upper.startsWith('DELETE FROM ANIMAL_REPORTS WHERE ID = ?')) {
            const id = params[0];
            const idx = db.animal_reports.findIndex(r => r.id === id);
            if (idx !== -1) {
                db.animal_reports.splice(idx, 1);
                writeDb(db);
            }
            return [{ affectedRows: idx !== -1 ? 1 : 0 }];
        }

        // 4. RESCUE RECORDS Queries
        if (upper.startsWith('INSERT INTO RESCUE_RECORDS')) {
            const [id, reportId, rescuerId, rescueStatus, notes, completionImage] = params;
            const newRecord = {
                id,
                reportId,
                rescuerId,
                rescueStatus: rescueStatus || 'Started',
                notes: notes || '',
                completionImage: completionImage || null,
                rescueDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            db.rescue_records.push(newRecord);
            writeDb(db);
            return [{ insertId: id }];
        }

        if (upper.startsWith('SELECT * FROM RESCUE_RECORDS WHERE REPORTID = ?')) {
            const reportId = params[0];
            const found = db.rescue_records.filter(r => r.reportId === reportId);
            return [found];
        }

        if (upper.startsWith('SELECT * FROM RESCUE_RECORDS WHERE RESCUERID = ?')) {
            const rescuerId = params[0];
            const found = db.rescue_records.filter(r => r.rescuerId === rescuerId);
            return [found];
        }

        if (upper.startsWith('SELECT * FROM RESCUE_RECORDS WHERE ID = ?')) {
            const id = params[0];
            const found = db.rescue_records.filter(r => r.id === id);
            return [found];
        }

        if (upper.startsWith('SELECT * FROM RESCUE_RECORDS')) {
            return [db.rescue_records];
        }

        // Fallback default
        return [[]];
    }
};

module.exports = { localPool, ensureData };
