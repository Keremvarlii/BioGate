const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Ad Soyad alanı zorunludur.'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'E-posta alanı zorunludur.'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        // Sadece admin girişi yapacak yöneticiler için gereklidir
        default: null
    },
    role: {
        type: String,
        enum: ['standard', 'admin'],
        default: 'standard'
    },
    faceDescriptor: {
        type: [Number], // 128 boyutlu yüz embedding vektörü
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);