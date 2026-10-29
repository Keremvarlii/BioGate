const Otp = require('../models/Otp');
const User = require('../models/User');
const Log = require('../models/Log');
const Setting = require('../models/Setting');
const nodemailer = require('nodemailer');

// E-posta gönderici ayarları (Nodemailer)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 1. Şifre Üretme ve Gönderme İşlemi
exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Lütfen e-posta adresi girin.' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Bu e-posta sistemde kayıtlı değil.' });
        }

        // Acil durum kontrolü: Sistem kilitliyse şifre bile gönderme
        const settings = await Setting.findOne();
        if (settings && settings.isLockdown) {
            return res.status(403).json({ success: false, message: 'ACİL DURUM: Sistem kilitli. Doğrulama kodları askıya alındı.' });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        await Otp.deleteMany({ email: user.email });

        await Otp.create({
            email: user.email,
            otpCode: otpCode
        });

        const mailOptions = {
            from: `"BioGate Güvenlik Sistemi" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'BioGate - Geçiş Doğrulama Kodunuz',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #111827;">BioGate Geçiş Doğrulaması</h2>
                    <p>Sisteme giriş yapmak için tek kullanımlık şifreniz oluşturulmuştur.</p>
                    <div style="background-color: #f3f4f6; padding: 15px; font-size: 28px; font-weight: bold; letter-spacing: 8px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        ${otpCode}
                    </div>
                    <p style="color: #ef4444; font-size: 14px;">Bu kod <strong>3 dakika</strong> boyunca geçerlidir. Lütfen güvenlik personeliniz dahil kimseyle paylaşmayın.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'OTP e-posta adresinize gönderildi.' });

    } catch (error) {
        console.error('OTP Gönderme Hatası:', error);
        res.status(500).json({ success: false, message: 'Kod gönderilirken bir hata oluştu.' });
    }
};

// 2. Gelen Şifreyi Doğrulama ve Loglama İşlemi
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otpCode } = req.body;

        if (!email || !otpCode) {
            return res.status(400).json({ success: false, message: 'E-posta ve kod gereklidir.' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        const settings = await Setting.findOne();

        // YENİ: Lockdown (Acil Durum) Kontrolü
        if (settings && settings.isLockdown) {
            if (user) {
                // Kilitliyken girmeye çalışanı kırmızı logla yakala
                await Log.create({
                    userId: user._id,
                    userName: user.fullName,
                    eventType: 'Lockdown İhlali Denemesi',
                    status: 'danger',
                    statusText: 'Sistem Kilitli'
                });
            }
            return res.status(403).json({ success: false, message: 'ACİL DURUM: Sistem kilitli, tüm geçişler durduruldu!' });
        }
        
        const validOtp = await Otp.findOne({ email: email.toLowerCase().trim(), otpCode: otpCode });

        if (!validOtp) {
            if (user) {
                await Log.create({
                    userId: user._id,
                    userName: user.fullName,
                    eventType: 'Hatalı Şifre Denemesi',
                    status: 'warning',
                    statusText: 'Hatalı OTP'
                });
            }
            return res.status(400).json({ success: false, message: 'Hatalı veya süresi dolmuş kod!' });
        }

        await Otp.deleteOne({ _id: validOtp._id });

        await Log.create({
            userId: user._id,
            userName: user.fullName,
            eventType: 'Yüz + OTP Doğrulama',
            status: 'success',
            statusText: 'Giriş Başarılı'
        });

        res.status(200).json({ success: true, message: 'Doğrulama başarılı, kapı açılıyor.' });

    } catch (error) {
        console.error('OTP Doğrulama Hatası:', error);
        res.status(500).json({ success: false, message: 'Doğrulama sırasında hata oluştu.' });
    }
};