const express = require('express');
const router = express.Router();
const { 
    getAllReports,
    createReport, 
    getMyReports, 
    getReport, 
    updateReport, 
    deleteReport 
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getAllReports);
router.post('/', protect, upload.single('image'), createReport);
router.get('/my', protect, getMyReports);
router.get('/:id', protect, getReport);
router.put('/:id', protect, updateReport);
router.delete('/:id', protect, deleteReport);

module.exports = router;
