const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Socket.io ve HTTP sunucusu için gerekli modüller
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5001;

// Express sunucusunu HTTP sunucusuyla sarmalıyoruz
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Tüm kaynaklardan gelen bağlantılara izin ver
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Veritabanı Bağlantısı (MongoDB Atlas)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB bağlantısı başarılı!'))
    .catch((err) => console.error('MongoDB bağlantı hatası:', err));

// Rota Tanımları
const authRoutes = require('./routes/authRoutes');
const logRoutes = require('./routes/logRoutes');
const otpRoutes = require('./routes/otpRoutes');
const settingRoutes = require('./routes/settingRoutes');
const userRoutes = require('./routes/userRoutes');

// API Rotaları
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/users', userRoutes);

// Tarayıcı kamerasından gelen kareyi Python eşleştirme servisine (5002) ileten köprü rota
app.post('/api/camera/match', async (req, res) => {
    try {
        const response = await fetch('http://127.0.0.1:5002/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: req.body?.image })
        });
        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (err) {
        return res.status(503).json({
            matched: false,
            error: 'Python yüz tanıma servisine ulaşılamadı.'
        });
    }
});

// Test Endpoint
app.get('/', (req, res) => {
    res.send('BioGate API Sunucusu Çalışıyor...');
});

// Socket.io Bağlantı Dinleyicisi
io.on('connection', (socket) => {
    console.log('⚡ Yeni bir cihaz bağlandı:', socket.id);

    // 1. Python tarafı bir yüz tanıdığında burası çalışacak
    socket.on('python_face_detected', (data) => {
        console.log('📷 Python\'dan yüz tanıma sinyali geldi:', data);
        
        // Gelen veriyi (örneğin kimin geldiğini) sisteme bağlı tüm arayüzlere (kiosk / anaSayfa) yayınla (broadcast)
        io.emit('face_recognized_alert', data);
    });

    socket.on('disconnect', () => {
        console.log('❌ Cihaz ayrıldı:', socket.id);
    });
});

// Sunucuyu app.listen yerine server.listen ile başlatıyoruz
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});