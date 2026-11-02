const User = require('../models/User');

// 1. Tüm Kullanıcıları Getir
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Kullanıcılar getirilemedi.' });
    }
};

// 2. Yeni Kullanıcı Ekle
exports.createUser = async (req, res) => {
    try {
        const { fullName, email, role } = req.body;

        if (!fullName || !email) {
            return res.status(400).json({ success: false, message: 'Ad Soyad ve E-Posta zorunludur.' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Bu e-posta adresi zaten kayıtlı.' });
        }

        const user = await User.create({
            fullName,
            email: email.toLowerCase().trim(),
            role: role || 'standard'
        });

        res.status(201).json({ success: true, message: 'Kullanıcı başarıyla eklendi.', data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Kullanıcı eklenirken hata oluştu.' });
    }
};

// 3. Kullanıcıyı Askıya Al / Aktif Et
exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        // Adminin kendisini yanlışlıkla kilitlemesini engelliyoruz
        if (user.role === 'admin' && req.user.id === user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Kendinizi askıya alamazsınız!' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json({ success: true, message: `Kullanıcı ${user.isActive ? 'aktif edildi' : 'askıya alındı'}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Durum güncellenemedi.' });
    }
};

// 4. Kullanıcıyı Sil
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        // Ana admin hesabının silinmesini engelliyoruz
        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Sistem yöneticisi silinemez!' });
        }

        await User.deleteOne({ _id: user._id });
        res.status(200).json({ success: true, message: 'Kullanıcı sistemden silindi.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Kullanıcı silinemedi.' });
    }
};

// Kullanıcının yüz verisini (faceDescriptor) güncelleme
exports.updateUserFace = async (req, res) => {
    try {
        const { id } = req.params;
        const { faceDescriptor } = req.body; // Python'dan gelecek yüz vektör dizisi

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { faceDescriptor },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        res.status(200).json({
            success: true,
            message: 'Yüz verisi başarıyla kaydedildi!',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası: ' + error.message });
    }
};