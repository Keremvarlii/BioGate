const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    otpExpirationTimer: { type: Number, default: 3 }, // Dakika
    faceRecognitionThreshold: { type: Number, default: 90 }, // Yüzde
    alertEmail: { type: String, default: 'security@sirket.com' },
    isLockdown: { type: Boolean, default: false } // Acil durum kilidi
});

module.exports = mongoose.model('Setting', settingSchema);