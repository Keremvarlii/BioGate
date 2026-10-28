const Log = require('../models/Log');

// Tüm logları getirme (En yeniden en eskiye doğru sıralı)
exports.getLogs = async (req, res) => {
    try {
        // Son 50 log kaydını tarihe göre azalan (descending) şekilde çek
        const logs = await Log.find().sort({ createdAt: -1 }).limit(50);
        
        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error('Logları çekerken hata:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası, loglar alınamadı.' });
    }
};