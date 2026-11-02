const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. İstek başlığından (Header) token'ı al (Bearer <token> formatında gelir)
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Erişim reddedildi: Token bulunamadı.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 2. Token'ın gerçekliğini ve süresini kontrol et
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Çözülen kullanıcı bilgilerini isteğin (req) içine yerleştir
        req.user = decoded;
        
        // 4. Yetki kontrolü: Sadece admin mi?
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Erişim reddedildi: Yetkisiz rol.' });
        }

        // Geçiş izni ver, asıl controller'a devam et
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Geçersiz veya süresi dolmuş token.' });
    }
};