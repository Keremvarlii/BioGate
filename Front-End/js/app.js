import { ApiService } from './apiService.js';
import { UIManager } from './uiManager.js';

class App {
    constructor() {
        this.api = new ApiService();
        this.ui = new UIManager();

        // Gizli admin girişi için sayaç değişkenleri
        this.secretClickCount = 0;
        this.secretClickTimer = null;

        // Yüz tanıma sonucu gelen aktif kullanıcı e-postası
        this.currentRecognizedEmail = "keremvarli1@gmail.com";

        // Tarayıcı kamera ve zaman aşımı değişkenleri
        this.toggleCameraBtn = document.getElementById('toggleCameraBtn');
        this.cameraContainer = document.getElementById('cameraContainer');
        this.cameraVideo = document.getElementById('cameraVideo');
        this.cameraCanvas = document.getElementById('cameraCanvas');
        this.cameraStatus = document.getElementById('cameraStatus');

        this.mediaStream = null;
        this.scanTimer = null;
        this.timeoutTimer = null;
        this.isRequestInFlight = false;
        this.otpSentForSession = false;

        // 5 saniye içinde tanımlanmazsa kapanıp kırmızı mesaj yazar
        this.scanTimeoutMs = 5000;

        this.bindEvents();
        this.setupCameraEvents();
        this.setupSecretAdminLogin();
        this.setupSocketListener();
    }

    bindEvents() {
        this.ui.submitBtn.addEventListener('click', () => this.handleVerification());
    }

    setCameraMessage(message, type = 'neutral') {
        if (this.cameraStatus) {
            this.cameraStatus.textContent = message || '';
            this.cameraStatus.className = 'status-message';
            if (type === 'success') {
                this.cameraStatus.classList.add('success');
                this.cameraStatus.style.color = '#059669';
            } else if (type === 'error') {
                this.cameraStatus.classList.add('error');
                this.cameraStatus.style.color = '#dc2626';
            } else {
                this.cameraStatus.style.color = '#374151';
            }
        }

        // Ana durum kutusunda da net görünsün
        if (type === 'success') {
            this.ui.showSuccess(message);
        } else if (type === 'error') {
            this.ui.showError(message);
        } else if (this.ui.statusMessage) {
            this.ui.statusMessage.textContent = message || '';
            this.ui.statusMessage.className = 'status-message';
        }
    }

    setupCameraEvents() {
        if (!this.toggleCameraBtn || !this.cameraVideo || !this.cameraCanvas) return;

        this.toggleCameraBtn.addEventListener('click', () => {
            if (this.mediaStream) {
                this.stopCamera("Kamera kapatıldı.", 'neutral');
            } else {
                this.startCamera();
            }
        });

        window.addEventListener('beforeunload', () => this.stopCamera("", 'neutral'));
    }

    async startCamera() {
        // Önceki denemeden kalan kırmızı/yeşil mesajı temizle
        this.setCameraMessage('Kamera açıldı, yüz taranıyor...', 'neutral');
        this.otpSentForSession = false;

        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240 },
                audio: false
            });

            this.cameraVideo.srcObject = this.mediaStream;
            if (this.cameraContainer) this.cameraContainer.style.display = 'block';
            if (this.toggleCameraBtn) this.toggleCameraBtn.textContent = 'Kamerayı Kapat';

            this.scanTimer = setInterval(() => this.captureAndMatch(), 1500);

            this.timeoutTimer = setTimeout(() => {
                this.stopCamera("Yüzünüz tanımlanamadı", 'error');
            }, this.scanTimeoutMs);
        } catch (error) {
            console.error('Kamera açma hatası:', error);
            this.setCameraMessage('Kamera izni verilmedi veya cihaz bulunamadı.', 'error');
        }
    }

    stopCamera(message = "", statusType = 'neutral') {
        if (this.scanTimer) {
            clearInterval(this.scanTimer);
            this.scanTimer = null;
        }
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
            this.timeoutTimer = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => track.stop());
            this.mediaStream = null;
        }
        if (this.cameraVideo) {
            this.cameraVideo.srcObject = null;
        }
        if (this.cameraContainer) {
            this.cameraContainer.style.display = 'none';
        }
        if (this.toggleCameraBtn) {
            this.toggleCameraBtn.textContent = 'Kamerayı Aç ve Yüz Tanı';
        }
        if (message) {
            this.setCameraMessage(message, statusType);
        }
    }

    async sendOtpToEmail(email) {
        if (!email || this.otpSentForSession) return;
        this.otpSentForSession = true;

        try {
            const response = await fetch('http://localhost:5001/api/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const result = await response.json();

            if (result.success) {
                this.setCameraMessage("Tanımlama başarılı, mail adresinize kod gönderildi", 'success');
            } else {
                this.otpSentForSession = false;
                this.setCameraMessage(result.message || "Kod gönderilemedi.", 'error');
            }
        } catch (error) {
            console.error('OTP gönderme hatası:', error);
            this.otpSentForSession = false;
            this.setCameraMessage("Kod gönderilirken bağlantı hatası oluştu.", 'error');
        }
    }

    async captureAndMatch() {
        if (!this.mediaStream || this.isRequestInFlight) return;
        this.isRequestInFlight = true;

        try {
            const ctx = this.cameraCanvas.getContext('2d');
            ctx.drawImage(this.cameraVideo, 0, 0, this.cameraCanvas.width, this.cameraCanvas.height);
            const dataUrl = this.cameraCanvas.toDataURL('image/jpeg', 0.75);

            const response = await fetch('http://localhost:5001/api/camera/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: dataUrl })
            });

            const data = await response.json();

            if (data.matched && data.email) {
                await this.handleFaceMatched(data);
            } else if (this.mediaStream) {
                this.setCameraMessage(
                    data.reason === 'no_face'
                        ? 'Yüz aranıyor, kameraya bakın...'
                        : 'Yüz tanımlanıyor, bekleniyor...',
                    'neutral'
                );
            }
        } catch (error) {
            if (this.mediaStream) {
                this.setCameraMessage('Eşleştirme servisine bağlanılamadı.', 'error');
            }
        } finally {
            this.isRequestInFlight = false;
        }
    }

    async handleFaceMatched(data) {
        if (!data || !data.email) return;

        this.currentRecognizedEmail = data.email;
        this.stopCamera("Tanımlama başarılı, mail adresinize kod gönderildi", 'success');
        this.ui.resetInputs();
        // resetInputs sonrası başarı mesajını tekrar net bas
        this.setCameraMessage("Tanımlama başarılı, mail adresinize kod gönderildi", 'success');

        await this.sendOtpToEmail(data.email);
    }

    setupSocketListener() {
        if (typeof window.io !== 'undefined') {
            const socket = window.socket || window.io('http://localhost:5001');
            window.socket = socket;

            socket.on('face_recognized_alert', (data) => {
                if (data && data.email) {
                    this.handleFaceMatched(data);
                }
            });
        }
    }

    // 5 Tıklama Mantığını Kuran Fonksiyon
    setupSecretAdminLogin() {
        const logoTrigger = document.getElementById('secret-admin-trigger');

        if (logoTrigger) {
            logoTrigger.addEventListener('click', () => {
                this.secretClickCount++;

                // Önceki zamanlayıcıyı temizle
                clearTimeout(this.secretClickTimer);

                // 5 kez tıklandıysa sayfaya yönlendir
                if (this.secretClickCount >= 5) {
                    window.location.href = 'adminGiris.html';
                }

                // Eğer 1 saniye içinde yeni bir tıklama gelmezse sayacı sıfırla
                this.secretClickTimer = setTimeout(() => {
                    this.secretClickCount = 0;
                }, 1000);
            });
        }
    }

    async handleVerification() {
        const otpValue = this.ui.getOTPValue();

        if (otpValue.length !== 6) {
            this.ui.showError("Lütfen 6 haneli şifreyi eksiksiz giriniz.");
            return;
        }

        this.ui.showLoading();

        try {
            const response = await this.api.verifyOTP(this.currentRecognizedEmail, otpValue);

            if (response.success) {
                this.ui.showSuccess("✓ " + response.message);
            } else {
                this.ui.showError("✗ " + response.message);
            }
        } catch (error) {
            this.ui.showError("Sunucu bağlantı hatası oluştu.");
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});