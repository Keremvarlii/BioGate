const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Veritabanına bağlanıldı.');

        // Admin daha önce eklenmiş mi kontrol et
        const existingAdmin = await User.findOne({ email: 'admin@biogate.com' });
        if (existingAdmin) {
            console.log('ℹ Admin kullanıcısı zaten mevcut (admin@biogate.com).');
            process.exit();
        }

        // Şifreyi hashle
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Yeni admin kullanıcısını oluştur
        const adminUser = new User({
            fullName: 'Sistem Yöneticisi',
            email: 'admin@biogate.com',
            password: hashedPassword,
            role: 'admin',
            isActive: true
        });

        await adminUser.save();
        console.log('✓ Varsayılan Admin başarıyla oluşturuldu!');
        console.log('  E-posta : admin@biogate.com');
        console.log('  Şifre   : admin123');

        process.exit();
    } catch (error) {
        console.error('✗ Hata oluştu:', error.message);
        process.exit(1);
    }
};

seedAdmin();