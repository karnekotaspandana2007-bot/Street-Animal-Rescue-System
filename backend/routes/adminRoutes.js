const express = require('express');
const router = express.Router();
const { 
    getDashboardStats,
    getAllReports,
    getAllUsers,
    getAllRescuers,
    verifyReport,
    rejectReport,
    assignRescuer
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected and only for admins
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/reports', getAllReports);
router.get('/users', getAllUsers);
router.get('/rescuers', getAllRescuers);

router.put('/reports/:id/verify', verifyReport);
router.put('/reports/:id/reject', rejectReport);
router.put('/reports/:id/assign', assignRescuer);

module.exports = router;
