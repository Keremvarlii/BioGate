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
app.use(express.json());

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

// Test Endpoint
app.get('/', (req, res) => {
    res.send('BioGate API Sunucusu Çalışıyor...');
});

// Socket.io Bağlantı Dinleyicisi
io.on('connection', (socket) => {
    console.log('⚡ Yeni bir cihaz bağlandı:', socket.id);

    socket.on('disconnect', () => {
        console.log('❌ Cihaz ayrıldı:', socket.id);
    });
});

// Sunucuyu app.listen yerine server.listen ile başlatıyoruz
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});