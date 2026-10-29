const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // DİKKAT: Aşağıdaki adresi, telefonunda bildirimini görebileceğin GERÇEK bir e-posta ile değiştir!
        const gercekMail = "ilkimyigitalp00@gmail.com"; 
        
        // 1. Veritabanındaki admin kullanıcısının mailini gerçek mailinle güncelliyoruz
        await User.findOneAndUpdate({ role: 'admin' }, { email: gercekMail.toLowerCase() });
        console.log(`✓ Admin maili veritabanında güncellendi: ${gercekMail}`);

        // 2. Kendi API'mize sanki arayüzden istek gelmiş gibi mail atma emri veriyoruz
        console.log('⏳ Mail gönderiliyor, lütfen bekleyin...');
        const response = await fetch('http://localhost:5001/api/otp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: gercekMail })
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('✅ BAŞARILI! Telefonuna veya mail kutuna bakabilirsin.');
            console.log('API Yanıtı:', data.message);
        } else {
            console.log('❌ BAŞARISIZ:', data.message);
        }
        
        process.exit();
    } catch (error) {
        console.error('✗ Kritik Hata:', error);
        process.exit(1);
    }
}

runTest();