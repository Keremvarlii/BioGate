const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Admin Giriş İşlemi
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Alanların doluluğunu kontrol et
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Lütfen e-posta ve şifrenizi girin.' 
            });
        }

        // 2. Kullanıcıyı bul
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Geçersiz e-posta veya şifre.' 
            });
        }

        // 3. Rol kontrolü (Sadece admin girebilir)
        if (user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Erişim reddedildi: Yönetici yetkiniz bulunmuyor.' 
            });
        }

        // 4. Şifre kontrolü
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Geçersiz e-posta veya şifre.' 
            });
        }

        // 5. JWT Token Üretimi (8 saat geçerli)
        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(200).json({
            success: true,
            message: 'Giriş başarılı!',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login Hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Sunucu tarafında bir hata oluştu.' 
        });
    }
};