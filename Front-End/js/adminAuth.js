document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    const loginMessage = document.getElementById('login-message');
    const loginBtn = document.getElementById('login-btn');

    loginForm.addEventListener('submit', async (e) => {
        // Formun sayfayı yenilemesini engelliyoruz
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Butonu "Bekleniyor" moduna al
        loginBtn.textContent = "Doğrulanıyor...";
        loginBtn.disabled = true;
        loginMessage.textContent = "";

        try {
            // Backend API'mize gerçek bir POST isteği atıyoruz
            const response = await fetch('http://127.0.0.1:5001/api/auth/admin-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Şifre doğruysa ve JWT Token geldiyse
                loginMessage.style.color = "#10b981"; // Yeşil
                loginMessage.textContent = "Giriş başarılı, yönlendiriliyorsunuz...";

                // Güvenlik anahtarını (token) ve kullanıcı bilgisini tarayıcıya kaydet
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.user));

                // Yarım saniye sonra asıl panele yönlendir
                setTimeout(() => {
                    window.location.href = "adminAnaSayfa.html";
                }, 500);

            } else {
                // Backend'den hata döndüyse (Yanlış şifre vb.)
                loginMessage.style.color = "#ef4444"; // Kırmızı
                loginMessage.textContent = data.message || "Hatalı e-posta veya şifre!";

                // Butonu eski haline getir
                loginBtn.textContent = "Sisteme Giriş Yap";
                loginBtn.disabled = false;
                passwordInput.value = ""; // Şifre kutusunu temizle
                passwordInput.focus();
            }
        } catch (error) {
            console.error('Bağlantı Hatası:', error);
            loginMessage.style.color = "#ef4444";
            loginMessage.textContent = "Sunucuya bağlanılamadı. Node.js sunucusunu başlattığınızdan emin olun.";

            loginBtn.textContent = "Sisteme Giriş Yap";
            loginBtn.disabled = false;
        }
    });
});