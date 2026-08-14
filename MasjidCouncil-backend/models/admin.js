const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // Area admins are issued username + password only (no mobile on record),
    // so this is sparse-unique rather than required. Regular admins still get one.
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    district: {
        type: String,
        trim: true
    },
    area: {
        type: String,
        trim: true
    },
    // 'areaadmin' sees only own-area submissions and can add a verification comment
    // 'districtadmin' is view-only: own-district submissions, decided (approved/rejected) only
    role: {
        type: String,
        enum: ['admin', 'areaadmin', 'districtadmin'],
        default: 'admin'
    }
}, {
    timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema); 