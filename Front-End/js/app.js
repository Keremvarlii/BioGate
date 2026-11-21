import { ApiService } from './apiService.js';
import { UIManager } from './uiManager.js';

class App {
    constructor() {
        this.api = new ApiService();
        this.ui = new UIManager();
        
        // Gizli admin girişi için sayaç değişkenleri
        this.secretClickCount = 0;
        this.secretClickTimer = null;

        // Yüz tanıma sistemi gelene kadar varsayılan test e-postası
        this.currentRecognizedEmail = "keremvarli1@gmail.com";

        this.bindEvents();
        this.setupSecretAdminLogin();
        this.setupSocketListener();
    }

    bindEvents() {
        this.ui.submitBtn.addEventListener('click', () => this.handleVerification());
    }

    setupSocketListener() {
        if (typeof window.io !== 'undefined') {
            const socket = window.socket || window.io('http://localhost:5001');
            window.socket = socket;

            socket.on('face_recognized_alert', (data) => {
                if (data && data.email) {
                    this.currentRecognizedEmail = data.email;
                    this.ui.showSuccess(`Yüz doğrulandı (${data.email}). Lütfen 6 haneli OTP kodunu girin.`);
                    this.ui.resetInputs();
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