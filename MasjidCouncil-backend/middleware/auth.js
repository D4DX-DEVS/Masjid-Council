const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access token required' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

// Admin Authentication - Allows both super admin and regular admin
const authenticateAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access token required' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if it's a super admin
        if (decoded.role === 'superadmin') {
            req.user = decoded;
            return next();
        }
        
        // Check if it's a regular admin
        if (decoded.role === 'admin') {
            // Verify admin still exists and still holds the admin role
            // (a token outlives a role downgrade to areaadmin by up to 24h)
            const admin = await Admin.findById(decoded.adminId);
            if (!admin || (admin.role && admin.role !== 'admin')) {
                return res.status(401).json({
                    success: false,
                    message: 'Admin account not found'
                });
            }
            
            req.user = {
                ...decoded,
                adminData: {
                    _id: admin._id,
                    username: admin.username,
                    phoneNumber: admin.phoneNumber,
                    district: admin.district,
                    area: admin.area
                }
            };
            return next();
        }
        
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
        
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

// Super Admin Authentication - Only allows super admin
const authenticateSuperAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access token required' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Super admin privileges required.'
            });
        }
        
        req.user = decoded;
        next();
        
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

// Area Admin Authentication - only allows area admins; loads their district/area
const authenticateAreaAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'areaadmin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Area admin privileges required.'
            });
        }

        const admin = await Admin.findById(decoded.adminId);
        if (!admin || admin.role !== 'areaadmin') {
            return res.status(401).json({
                success: false,
                message: 'Area admin account not found'
            });
        }

        if (!admin.district || !admin.area) {
            return res.status(403).json({
                success: false,
                message: 'Area admin account has no district/area assigned'
            });
        }

        req.user = {
            ...decoded,
            adminData: {
                _id: admin._id,
                username: admin.username,
                phoneNumber: admin.phoneNumber,
                district: admin.district,
                area: admin.area
            }
        };
        next();

    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// District Admin Authentication - view-only role; loads their district
const authenticateDistrictAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'districtadmin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. District admin privileges required.'
            });
        }

        const admin = await Admin.findById(decoded.adminId);
        if (!admin || admin.role !== 'districtadmin') {
            return res.status(401).json({
                success: false,
                message: 'District admin account not found'
            });
        }

        if (!admin.district) {
            return res.status(403).json({
                success: false,
                message: 'District admin account has no district assigned'
            });
        }

        req.user = {
            ...decoded,
            adminData: {
                _id: admin._id,
                username: admin.username,
                phoneNumber: admin.phoneNumber,
                district: admin.district
            }
        };
        next();

    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

module.exports = {
    authenticateToken,
    authenticateAdmin,
    authenticateSuperAdmin,
    authenticateAreaAdmin,
    authenticateDistrictAdmin
};