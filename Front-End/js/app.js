import { ApiService } from './apiService.js';
import { UIManager } from './uiManager.js';

class App {
    constructor() {
        this.api = new ApiService();
        this.ui = new UIManager();
        
        // Gizli admin girişi için sayaç değişkenleri
        this.secretClickCount = 0;
        this.secretClickTimer = null;

        this.bindEvents();
        this.setupSecretAdminLogin();
    }

    bindEvents() {
        this.ui.submitBtn.addEventListener('click', () => this.handleVerification());
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

                // Eğer 1.5 saniye içinde yeni bir tıklama gelmezse sayacı sıfırla
                this.secretClickTimer = setTimeout(() => {
                    this.secretClickCount = 0;
                }, 1500);
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
            const response = await this.api.verifyOTP(otpValue);
            
            if (response.success) {
                this.ui.showSuccess("✓ Giriş Başarılı! Kapı Açılıyor...");
            } else {
                this.ui.showError("✗ Hatalı Şifre. Lütfen tekrar deneyin.");
            }
        } catch (error) {
            this.ui.showError("Sunucu bağlantı hatası oluştu.");
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});