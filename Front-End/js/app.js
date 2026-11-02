import { ApiService } from './apiService.js';
import { UIManager } from './uiManager.js';

class App {
    constructor() {
        this.api = new ApiService();
        this.ui = new UIManager();
        
        // Gizli admin girişi için sayaç değişkenleri
        this.secretClickCount = 0;
        this.secretClickTimer = null;

        // GEÇİCİ: Yüz tanıma sistemi gelene kadar test mailimizi "tanınan kişi" olarak sabitliyoruz
        this.currentRecognizedEmail = "keremvarli1@gmail.com"; 

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
            // Sadece OTP kodunu değil, "kimin" kodu olduğunu da (email) gönderiyoruz
            const response = await this.api.verifyOTP(this.currentRecognizedEmail, otpValue);
            
            if (response.success) {
                // Backend'den gelen başarılı mesajını ekrana bas (örn: "Doğrulama başarılı, kapı açılıyor.")
                this.ui.showSuccess("✓ " + response.message);
            } else {
                // Backend'den gelen hata mesajını ekrana bas (örn: "Hatalı veya süresi dolmuş kod!")
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