const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    otpCode: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 180 // TTL Index: 180 saniye (3 dakika) sonra MongoDB bu kaydı otomatik siler
    }
});

module.exports = mongoose.model('Otp', otpSchema);