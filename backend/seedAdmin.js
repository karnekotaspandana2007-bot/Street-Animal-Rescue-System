const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        console.log('Connecting to MySQL for seeding...');

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (existingAdmin) {
            console.log(`Admin user with email ${adminEmail} already exists.`);
            process.exit(0);
        }

        // Create admin user
        await User.create({
            name: 'System Admin',
            email: adminEmail,
            phone: '0000000000',
            password: adminPassword,
            role: 'admin',
            location: 'System'
        });

        console.log('Admin user created successfully.');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        
        process.exit(0);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();
