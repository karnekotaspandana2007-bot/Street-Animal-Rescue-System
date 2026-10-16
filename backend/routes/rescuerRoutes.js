const express = require('express');
const router = express.Router();
const { 
    getAssignedReports,
    getAssignedReport,
    updateReportStatus,
    completeRescue
} = require('../controllers/rescuerController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes are protected and only for rescuers
router.use(protect);
router.use(authorize('rescuer'));

router.get('/reports', getAssignedReports);
router.get('/reports/:id', getAssignedReport);
router.put('/reports/:id/status', updateReportStatus);
router.post('/reports/:id/complete', upload.single('completionImage'), completeRescue);

module.exports = router;
