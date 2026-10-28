const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Rota Tanımları
const authRoutes = require('./routes/authRoutes');
const logRoutes = require('./routes/logRoutes');
const otpRoutes = require('./routes/otpRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Rotaları
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/otp', otpRoutes);

// Test Endpoint
app.get('/', (req, res) => {
    res.json({ message: "BioGate API Sunucusu Aktif!" });
});

// Veritabanı Bağlantısı ve Sunucu Başlatma
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✓ MongoDB Atlas Bağlantısı Başarılı!');
        app.listen(PORT, () => {
            console.log(`✓ BioGate API Sunucusu http://localhost:${PORT} üzerinde çalışıyor.`);
        });
    })
    .catch((err) => {
        console.error('✗ MongoDB Bağlantı Hatası:', err.message);
    });