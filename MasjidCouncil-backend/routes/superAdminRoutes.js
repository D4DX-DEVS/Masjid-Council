const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin');
const mosqueFund = require('../models/mosqueFund');
const welfarefund = require('../models/welfarefund');
const mosqueAffiliation = require('../models/mosqueAffiliation');
const { authenticateSuperAdmin, authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Super Admin Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Check super admin credentials from environment variables
        const superAdminUsername = process.env.SUPER_ADMIN_USERNAME;
        const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

        if (!superAdminUsername || !superAdminPassword) {
            return res.status(500).json({
                success: false,
                message: 'Super admin credentials not configured'
            });
        }

        // Verify credentials
        if (username !== superAdminUsername || password !== superAdminPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                username: username, 
                role: 'superadmin',
                type: 'superadmin'
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            message: 'Super admin login successful',
            token: token,
            user: {
                username: username,
                role: 'superadmin'
            }
        });

    } catch (error) {
        console.error('Super admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Admin Login (regular admin, by phone number)
router.post('/admin/login', async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        if (!phoneNumber || !password) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and password are required'
            });
        }

        const admin = await Admin.findOne({ phoneNumber });
        if (!admin || !(await admin.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const role = admin.role || 'admin';
        const token = jwt.sign(
            { adminId: admin._id, role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            message: 'Admin login successful',
            token,
            user: {
                _id: admin._id,
                username: admin.username,
                phoneNumber: admin.phoneNumber,
                district: admin.district,
                area: admin.area,
                role
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Create Admin (Protected Route)
router.post('/admin', authenticateSuperAdmin, async (req, res) => {
    try {

        const { username, phoneNumber, password, district, area, role } = req.body;

        // Validate input
        if (!username || !phoneNumber || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, phone number, and password are required'
            });
        }

        if (role && !['admin', 'areaadmin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "role must be 'admin' or 'areaadmin'"
            });
        }

        if (role === 'areaadmin' && (!district || !area)) {
            return res.status(400).json({
                success: false,
                message: 'district and area are required for area admins'
            });
        }

        // Check if admin already exists with username or phone number
        const existingAdmin = await Admin.findOne({
            $or: [{ username }, { phoneNumber }]
        });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin with this username or phone number already exists'
            });
        }

        // Create new admin
        const newAdmin = new Admin({
            username,
            phoneNumber,
            password,
            district,
            area,
            role: role || 'admin'
        });

        await newAdmin.save();

        // Remove password from response
        const adminResponse = {
            _id: newAdmin._id,
            username: newAdmin.username,
            phoneNumber: newAdmin.phoneNumber,
            district: newAdmin.district,
            area: newAdmin.area,
            role: newAdmin.role,
            createdAt: newAdmin.createdAt,
            updatedAt: newAdmin.updatedAt
        };

        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: adminResponse
        });

    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get All Admins (Protected Route)
router.get('/admin', authenticateSuperAdmin, async (req, res) => {
    try {

        const admins = await Admin.find({}, '-password').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Admins retrieved successfully',
            data: admins
        });

    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get Single Admin (Protected Route)
router.get('/admin/:id', authenticateSuperAdmin, async (req, res) => {
    try {

        const admin = await Admin.findById(req.params.id, '-password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Admin retrieved successfully',
            data: admin
        });

    } catch (error) {
        console.error('Get admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});



// Update Admin (Protected Route)
router.put('/admin/:id', authenticateSuperAdmin, async (req, res) => {
    try {
        const { username, phoneNumber, password, district, area, role } = req.body;

        if (role && !['admin', 'areaadmin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "role must be 'admin' or 'areaadmin'"
            });
        }

        const admin = await Admin.findById(req.params.id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        if (username || phoneNumber) {
            const duplicate = await Admin.findOne({
                _id: { $ne: admin._id },
                $or: [
                    ...(username ? [{ username }] : []),
                    ...(phoneNumber ? [{ phoneNumber }] : [])
                ]
            });
            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: 'Another admin with this username or phone number already exists'
                });
            }
        }

        if (username) admin.username = username;
        if (phoneNumber) admin.phoneNumber = phoneNumber;
        if (district) admin.district = district;
        if (area) admin.area = area;
        if (role) admin.role = role;
        if (password) admin.password = password; // re-hashed by the pre-save hook

        if (admin.role === 'areaadmin' && (!admin.district || !admin.area)) {
            return res.status(400).json({
                success: false,
                message: 'district and area are required for area admins'
            });
        }

        await admin.save();

        res.status(200).json({
            success: true,
            message: 'Admin updated successfully',
            data: {
                _id: admin._id,
                username: admin.username,
                phoneNumber: admin.phoneNumber,
                district: admin.district,
                area: admin.area,
                role: admin.role,
                createdAt: admin.createdAt,
                updatedAt: admin.updatedAt
            }
        });

    } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Delete Admin (Protected Route)
router.delete('/admin/:id', authenticateSuperAdmin, async (req, res) => {
    try {

        const admin = await Admin.findByIdAndDelete(req.params.id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Admin deleted successfully'
        });

    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});


// Change application status (Protected Route)
// ponytail: one handler for all three forms, they only differ by model
const STATUS_MODELS = {
    'mosque-fund': mosqueFund,
    'welfare-fund': welfarefund,
    'affiliation': mosqueAffiliation
};
const ALLOWED_STATUSES = ['pending', 'approved', 'rejected'];

router.put('/:form/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const Model = STATUS_MODELS[req.params.form];
        if (!Model) {
            return res.status(404).json({
                success: false,
                message: `Unknown form type '${req.params.form}'`
            });
        }

        const { status, rejectionReason } = req.body;

        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `status must be one of: ${ALLOWED_STATUSES.join(', ')}`
            });
        }

        if (status === 'rejected' && !(rejectionReason || '').trim()) {
            return res.status(400).json({
                success: false,
                message: 'rejectionReason is required when rejecting'
            });
        }

        const updated = await Model.findByIdAndUpdate(
            req.params.id,
            {
                status,
                rejectionReason: status === 'rejected' ? rejectionReason.trim() : null,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Status changed to ${status}`,
            data: updated
        });

    } catch (error) {
        console.error('Status change error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});


module.exports = router;
