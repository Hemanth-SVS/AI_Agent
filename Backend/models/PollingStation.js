const mongoose = require('mongoose');

const pollingStationSchema = new mongoose.Schema({
    voterId: {
        type: String,
        required: true,
        unique: true
    },
    pollingStation: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    assembly: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    blo: {
        name: {
            type: String,
            required: true
        },
        mobile: {
            type: String,
            required: true
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PollingStation', pollingStationSchema);
