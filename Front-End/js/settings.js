document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const otpTimerInput = document.getElementById('otp-timer');
    const faceThresholdInput = document.getElementById('face-threshold');
    const alertEmailInput = document.getElementById('alert-email');
    const settingsForm = document.getElementById('settings-form');
    const saveMessage = document.getElementById('save-message');
    const lockdownBtn = document.getElementById('lockdown-btn');

    let currentLockdownStatus = false;

    // 1. Ayarları Veritabanından Çek
    async function loadSettings() {
        try {
            const response = await fetch('http://localhost:5001/api/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                otpTimerInput.value = data.data.otpExpirationTimer;
                faceThresholdInput.value = data.data.faceRecognitionThreshold;
                alertEmailInput.value = data.data.alertEmail;
                currentLockdownStatus = data.data.isLockdown;
                updateLockdownUI();
            }
        } catch (error) {
            console.error("Ayarlar yüklenemedi:", error);
        }
    }

    // 2. Ayarları Kaydet
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveMessage.textContent = "Kaydediliyor...";
        saveMessage.style.color = "#9ca3af";

        try {
            const response = await fetch('http://localhost:5001/api/settings', {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    otpExpirationTimer: otpTimerInput.value,
                    faceRecognitionThreshold: faceThresholdInput.value,
                    alertEmail: alertEmailInput.value
                })
            });
            
            const data = await response.json();
            if (data.success) {
                saveMessage.textContent = "✓ Ayarlar başarıyla güncellendi.";
                saveMessage.style.color = "#10b981";
                setTimeout(() => saveMessage.textContent = "", 3000);
            }
        } catch (error) {
            saveMessage.textContent = "✗ Kayıt başarısız!";
            saveMessage.style.color = "#ef4444";
        }
    });

    // 3. Lockdown (Acil Durum) Butonu İşlemi
    lockdownBtn.addEventListener('click', async () => {
        const newStatus = !currentLockdownStatus;
        const confirmMsg = newStatus 
            ? "TÜM GEÇİŞLER DURDURULACAK! Emin misiniz?" 
            : "Sistem normale döndürülecek. Emin misiniz?";

        if (!confirm(confirmMsg)) return;

        try {
            const response = await fetch('http://localhost:5001/api/settings', {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isLockdown: newStatus })
            });

            const data = await response.json();
            if (data.success) {
                currentLockdownStatus = newStatus;
                updateLockdownUI();
            }
        } catch (error) {
            alert("İşlem başarısız oldu.");
        }
    });

    // UI Güncelleyici
    function updateLockdownUI() {
        if (currentLockdownStatus) {
            lockdownBtn.textContent = "KİLİDİ AÇ (Sistemi Normale Döndür)";
            lockdownBtn.style.backgroundColor = "#10b981"; // Yeşil yap
        } else {
            lockdownBtn.textContent = "Sistemi Kilitle (Lockdown Başlat)";
            lockdownBtn.style.backgroundColor = "#ef4444"; // Kırmızı yap
        }
    }

    loadSettings();
});