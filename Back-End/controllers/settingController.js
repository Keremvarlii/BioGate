const Setting = require('../models/Setting');

// Ayarları Getir (Yoksa varsayılanı oluşturur)
exports.getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({});
        }
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Ayarlar getirilemedi.' });
    }
};

// Ayarları Güncelle
exports.updateSettings = async (req, res) => {
    try {
        const { otpExpirationTimer, faceRecognitionThreshold, alertEmail, isLockdown } = req.body;
        let settings = await Setting.findOne();
        
        if (!settings) settings = new Setting({});

        if (otpExpirationTimer !== undefined) settings.otpExpirationTimer = otpExpirationTimer;
        if (faceRecognitionThreshold !== undefined) settings.faceRecognitionThreshold = faceRecognitionThreshold;
        if (alertEmail !== undefined) settings.alertEmail = alertEmail;
        if (isLockdown !== undefined) settings.isLockdown = isLockdown;

        await settings.save();
        res.status(200).json({ success: true, message: 'Ayarlar başarıyla güncellendi.', data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Ayarlar güncellenemedi.' });
    }
};