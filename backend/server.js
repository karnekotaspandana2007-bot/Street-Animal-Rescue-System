const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to database
connectDB.connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images staticly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes (will be imported and used here)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/rescuer', require('./routes/rescuerRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: "Smart Street Animal Rescue API is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
