const Otp = require('../models/Otp');
const User = require('../models/User');
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

        // Güvenlik: Kullanıcı sistemde kayıtlı mı kontrol et
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Bu e-posta sistemde kayıtlı değil.' });
        }

        // 6 haneli rastgele OTP üret (100000 - 999999 arası)
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Spam'i önlemek için kullanıcının eski OTP kayıtlarını sil
        await Otp.deleteMany({ email: user.email });

        // Yeni kodu veritabanına kaydet (TTL index sayesinde 3 dk sonra silinecek)
        await Otp.create({
            email: user.email,
            otpCode: otpCode
        });

        // Mail içeriğini hazırla ve gönder
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

// 2. Gelen Şifreyi Doğrulama İşlemi
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otpCode } = req.body;

        if (!email || !otpCode) {
            return res.status(400).json({ success: false, message: 'E-posta ve kod gereklidir.' });
        }

        // Veritabanında eşleşen aktif kodu bul
        const validOtp = await Otp.findOne({ email: email.toLowerCase().trim(), otpCode: otpCode });

        if (!validOtp) {
            return res.status(400).json({ success: false, message: 'Hatalı veya süresi dolmuş kod!' });
        }

        // Doğrulama başarılıysa kodu hemen sil (tek kullanımlık olması için)
        await Otp.deleteOne({ _id: validOtp._id });

        res.status(200).json({ success: true, message: 'Doğrulama başarılı, kapı açılıyor.' });

    } catch (error) {
        console.error('OTP Doğrulama Hatası:', error);
        res.status(500).json({ success: false, message: 'Doğrulama sırasında hata oluştu.' });
    }
};