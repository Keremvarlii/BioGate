const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    userName: {
        type: String,
        default: 'Bilinmiyor'
    },
    eventType: {
        type: String,
        required: true // Örn: 'Yüz + OTP Doğrulama', 'Canlılık Tespiti Başarısız'
    },
    status: {
        type: String,
        enum: ['success', 'warning', 'danger'],
        required: true // adminAnaSayfa tablosundaki rozet renklerini belirler
    },
    statusText: {
        type: String,
        required: true // Örn: 'Giriş Başarılı', 'Hatalı OTP', 'Sahte Yüz (Fotoğraf)'
    },
    evidenceImage: {
        type: String, // İhlal anında çekilen fotoğrafın dosya yolu veya base64 verisi
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Log', logSchema);