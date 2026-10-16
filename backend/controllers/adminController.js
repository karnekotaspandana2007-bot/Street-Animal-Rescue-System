const User = require('../models/User');
const AnimalReport = require('../models/AnimalReport');
const RescueRecord = require('../models/RescueRecord');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = (await User.find({ role: 'user' })).length;
        const totalRescuers = (await User.find({ role: 'rescuer' })).length;
        
        const allReports = await AnimalReport.find();
        const totalReports = allReports.length;
        
        const pendingReports = allReports.filter(r => r.status === 'Pending').length;
        const activeRescues = allReports.filter(r => r.status === 'Assigned' || r.status === 'Rescue In Progress').length;
        const completedRescues = allReports.filter(r => r.status === 'Completed').length;

        res.json({
            success: true,
            data: {
                totalUsers,
                totalRescuers,
                totalReports,
                pendingReports,
                activeRescues,
                completedRescues
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private/Admin
const getAllReports = async (req, res) => {
    try {
        let reports = await AnimalReport.find();
        
        // Populate userId and assignedRescuer
        for (let report of reports) {
            if (report.userId) {
                const user = await User.findById(report.userId);
                if (user) {
                    report.userId = { _id: user._id, name: user.name, email: user.email, phone: user.phone };
                }
            }
            if (report.assignedRescuer) {
                const rescuer = await User.findById(report.assignedRescuer);
                if (rescuer) {
                    report.assignedRescuer = { _id: rescuer._id, name: rescuer.name, phone: rescuer.phone };
                }
            }
        }
        
        reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
        res.json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' });
        users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all rescuers
// @route   GET /api/admin/rescuers
// @access  Private/Admin
const getAllRescuers = async (req, res) => {
    try {
        const rescuers = await User.find({ role: 'rescuer' });
        rescuers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ success: true, data: rescuers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify a report
// @route   PUT /api/admin/reports/:id/verify
// @access  Private/Admin
const verifyReport = async (req, res) => {
    try {
        const report = await AnimalReport.findById(req.params.id);
        
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        if (report.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'Only Pending reports can be verified' });
        }

        const updatedReport = await AnimalReport.findByIdAndUpdate(req.params.id, { status: 'Verified' });

        res.json({ success: true, message: 'Report verified successfully', data: updatedReport });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reject a report
// @route   PUT /api/admin/reports/:id/reject
// @access  Private/Admin
const rejectReport = async (req, res) => {
    try {
        const report = await AnimalReport.findById(req.params.id);
        
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        if (report.status !== 'Pending' && report.status !== 'Verified') {
            return res.status(400).json({ success: false, message: 'Only Pending or Verified reports can be rejected' });
        }

        const updatedReport = await AnimalReport.findByIdAndUpdate(req.params.id, { status: 'Rejected' });

        res.json({ success: true, message: 'Report rejected successfully', data: updatedReport });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Assign a rescuer to a report
// @route   PUT /api/admin/reports/:id/assign
// @access  Private/Admin
const assignRescuer = async (req, res) => {
    try {
        const { rescuerId } = req.body;
        
        if (!rescuerId) {
            return res.status(400).json({ success: false, message: 'Please provide a rescuer ID' });
        }

        const rescuer = await User.findOne({ _id: rescuerId });
        if (!rescuer || rescuer.role !== 'rescuer') {
            return res.status(404).json({ success: false, message: 'Rescuer not found' });
        }

        const report = await AnimalReport.findById(req.params.id);
        
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        if (report.status === 'Completed' || report.status === 'Rejected' || report.status === 'Rescued') {
            return res.status(400).json({ success: false, message: 'Cannot assign rescuer to a completed/rejected/rescued report' });
        }

        const updatedReport = await AnimalReport.findByIdAndUpdate(req.params.id, {
            assignedRescuer: rescuerId,
            status: 'Assigned'
        });

        res.json({ success: true, message: 'Rescuer assigned successfully', data: updatedReport });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDashboardStats,
    getAllReports,
    getAllUsers,
    getAllRescuers,
    verifyReport,
    rejectReport,
    assignRescuer
};
