const { pool } = require('./config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function seedUsers() {
    try {
        console.log('Seeding dummy rescuers and checking accounts...');

        const defaultRescuers = [
            {
                name: 'Field Rescuer 1',
                email: 'rescuer@gmail.com',
                phone: '9876543210',
                password: 'rescuerpassword123',
                location: 'Downtown / Central Hub'
            },
            {
                name: 'Rescuer Sarah',
                email: 'sarah.rescuer@gmail.com',
                phone: '9876543211',
                password: 'rescuerpassword123',
                location: 'North Zone Shelter'
            },
            {
                name: 'Rescuer David (Veterinary Aid)',
                email: 'david.rescuer@gmail.com',
                phone: '9876543212',
                password: 'rescuerpassword123',
                location: 'South District Clinic'
            }
        ];

        for (const r of defaultRescuers) {
            const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [r.email]);
            const hash = await bcrypt.hash(r.password, 10);
            if (existing.length === 0) {
                const id = crypto.randomUUID();
                await pool.execute(
                    `INSERT INTO users (id, name, email, phone, password, role, location) VALUES (?, ?, ?, ?, ?, 'rescuer', ?)`,
                    [id, r.name, r.email, r.phone, hash, r.location]
                );
                console.log(`Created Rescuer: ${r.email} / ${r.password}`);
            } else {
                // Update password to ensure it matches
                await pool.execute('UPDATE users SET password = ?, role = "rescuer" WHERE email = ?', [hash, r.email]);
                console.log(`Updated Rescuer password: ${r.email}`);
            }
        }

        console.log('Dummy rescuers created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding rescuers:', error);
        process.exit(1);
    }
}

seedUsers();
