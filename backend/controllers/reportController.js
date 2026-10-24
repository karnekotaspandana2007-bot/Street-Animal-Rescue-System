const AnimalReport = require('../models/AnimalReport');
const User = require('../models/User');

// @desc    Get all reports (Public)
// @route   GET /api/reports
// @access  Public
const getAllReports = async (req, res) => {
    try {
        const reports = await AnimalReport.find({});
        res.json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new animal report
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res) => {
    try {
        const { animalType, condition, severity, description, latitude, longitude, address } = req.body;

        // Check if image is uploaded
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an image' });
        }

        const imagePath = `/uploads/animal-reports/${req.file.filename}`;

        const report = await AnimalReport.create({
            userId: req.user.id,
            animalType,
            condition,
            severity,
            description,
            image: imagePath,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            address
        });

        res.status(201).json({
            success: true,
            message: 'Animal report created successfully',
            data: report
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get logged in user's reports
// @route   GET /api/reports/my
// @access  Private
const getMyReports = async (req, res) => {
    try {
        let reports = await AnimalReport.find({ userId: req.user.id });
        reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Private
const getReport = async (req, res) => {
    try {
        const report = await AnimalReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        // Make sure user owns report (unless rescuer or admin)
        const ownerId = report.userId?._id || report.userId;
        if (ownerId !== req.user.id && req.user.role === 'user') {
            return res.status(401).json({ success: false, message: 'Not authorized to view this report' });
        }

        // Mock populate assignedRescuer
        if (report.assignedRescuer) {
            const rescuer = await User.findById(report.assignedRescuer);
            if (rescuer) {
                report.assignedRescuer = {
                    _id: rescuer._id,
                    name: rescuer.name,
                    phone: rescuer.phone
                };
            }
        }

        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update report (only for users, before it gets assigned)
// @route   PUT /api/reports/:id
// @access  Private
const updateReport = async (req, res) => {
    try {
        let report = await AnimalReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        // Make sure user owns report
        const ownerId = report.userId?._id || report.userId;
        if (ownerId !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to update this report' });
        }

        // Cannot update if status is not Pending or Verified
        if (report.status !== 'Pending' && report.status !== 'Verified') {
            return res.status(400).json({ success: false, message: `Cannot update report with status: ${report.status}` });
        }

        report = await AnimalReport.findByIdAndUpdate(req.params.id, req.body);

        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
const deleteReport = async (req, res) => {
    try {
        const report = await AnimalReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        // Make sure user owns report
        const ownerId = report.userId?._id || report.userId;
        if (ownerId !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this report' });
        }

        if (report.status !== 'Pending') {
            return res.status(400).json({ success: false, message: `Cannot delete report with status: ${report.status}` });
        }

        await AnimalReport.deleteOne({ _id: req.params.id });

        res.json({ success: true, message: 'Report deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllReports,
    createReport,
    getMyReports,
    getReport,
    updateReport,
    deleteReport
};
