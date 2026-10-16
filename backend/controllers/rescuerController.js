const AnimalReport = require('../models/AnimalReport');
const RescueRecord = require('../models/RescueRecord');
const User = require('../models/User');

// @desc    Get assigned reports for rescuer
// @route   GET /api/rescuer/reports
// @access  Private/Rescuer
const getAssignedReports = async (req, res) => {
    try {
        let reports = await AnimalReport.find({ assignedRescuer: req.user.id });
        
        // Populate userId
        for (let report of reports) {
            const user = await User.findById(report.userId);
            if (user) {
                report.userId = { _id: user._id, name: user.name, phone: user.phone };
            }
        }
        
        // Sort by createdAt descending
        reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
        res.json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single assigned report
// @route   GET /api/rescuer/reports/:id
// @access  Private/Rescuer
const getAssignedReport = async (req, res) => {
    try {
        const report = await AnimalReport.findById(req.params.id);

        if (!report || report.assignedRescuer !== req.user.id) {
            return res.status(404).json({ success: false, message: 'Report not found or not assigned to you' });
        }

        // Populate userId
        const user = await User.findById(report.userId);
        if (user) {
            report.userId = { _id: user._id, name: user.name, phone: user.phone };
        }

        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update report status
// @route   PUT /api/rescuer/reports/:id/status
// @access  Private/Rescuer
const updateReportStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        const report = await AnimalReport.findById(req.params.id);

        if (!report || report.assignedRescuer !== req.user.id) {
            return res.status(404).json({ success: false, message: 'Report not found or not assigned to you' });
        }

        const validStatuses = ['Rescue In Progress', 'Rescued'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status update' });
        }

        const updatedReport = await AnimalReport.findByIdAndUpdate(report._id, { status });

        res.json({ success: true, data: updatedReport });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Complete rescue
// @route   POST /api/rescuer/reports/:id/complete
// @access  Private/Rescuer
const completeRescue = async (req, res) => {
    try {
        const { notes } = req.body;
        
        const report = await AnimalReport.findById(req.params.id);

        if (!report || report.assignedRescuer !== req.user.id) {
            return res.status(404).json({ success: false, message: 'Report not found or not assigned to you' });
        }

        if (report.status === 'Completed') {
            return res.status(400).json({ success: false, message: 'Rescue is already completed' });
        }

        let completionImage = '';
        if (req.file) {
            completionImage = `/uploads/animal-reports/${req.file.filename}`;
        }

        // Create rescue record
        const record = await RescueRecord.create({
            reportId: report._id,
            rescuerId: req.user.id,
            rescueStatus: 'Completed',
            notes: notes || '',
            completionImage
        });

        // Update report status
        await AnimalReport.findByIdAndUpdate(report._id, { status: 'Completed' });

        res.json({ success: true, message: 'Rescue completed successfully', data: record });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAssignedReports,
    getAssignedReport,
    updateReportStatus,
    completeRescue
};
