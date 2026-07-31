const mongoose = require("mongoose");

const mosqueAffiliationSchema = new mongoose.Schema({
    affiliationNumber: {
        type: String,
        unique: true,
        default: null,
    },
    name: {
        type: String,
        required: true,
    },
    mosqueType: {
        type: String,
        required: true,
    },
    mahallaType: {
        type: String,
        required: true,
    },
    establishedYear: {
        type: Number,
        required: true,
    },
    //address
    address: [{
        address: {
            type: String,
            required: true,
        },
        district: {
            type: String,
            required: true,
        },
        pincode: {
            type: Number,
            required: true,
        },
        phone: {
            type: Number,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        website: {
            type: String
        }
    }],
    //jamathArea
    jamathArea: [{
        area: {
            type: String,
            required: true,
        },
        district: {
            type: String,
            required: true,
        }
    }],

    facilities: [String],

    hasCemetery: {
        type: Boolean,
    },
    //mosqueCapacity
    mosqueCapacity: {
        type: String,
        required: true,
    },
    mosqueArea: {
        type: String,
        required: true,
    },

    fridayMaleAttendance: {
        type: String,
        required: true,
    },

    fridayFemaleAttendance: {
        type: String,
        required: true,
    },

    //Finance
    finance: [{
        assets: {
            type: String,
            required: true,
        },
        incomeSource: {
            type: String,
            required: true,
        },
        monthlyExpense: {
            type: String,
            required: true,
        },
    }],

    //Audit
    audit: [{
        hasAudit: {
            type: Boolean,
            required: true,
        },
        recordsKept: [String],
    }],

    //Accounts
    accounts: [{
        lastYearIncome: {
            type: String,
            required: true,
        },
        lastYearExpense: {
            type: String,
            required: true,
        },
    }],

    commmunityServices: [String],
    otherCommunityServices: [String],

    //committees
    committees: [{
        committeeType: {
            type: String,
            required: true,
        },
        president: [{
            name: {
                type: String,
                required: true,
            },
            phone: {
                type: String,
                required: true,
            },
            email: {
                type: String,
                required: true,
            },
        }],
        secretary: [{
            name: {
                type: String,
                required: true,
            },
            phone: {
                type: String,
                required: true,
            },
            email: {
                type: String,
                required: true,
            },
        }],
        workers: [{
            age: {
                type: String,
                required: true,
            },
            salary: {
                type: String,
                required: true,
            },
            qualification: {
                type: String,
                required: true,
            },
            remarks: {
                type: String,
            },
            working: {
                type: String,
            },
            otherStateWorkers: {
                type: Boolean,
                required: true,
            },
            LegalOtherStateWorkers: {
                type: Boolean,
                required: true,
            },
        }]
    }],
});

// Add status + timestamps
mosqueAffiliationSchema.add({
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
mosqueAffiliationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model("mosqueAffiliation", mosqueAffiliationSchema);