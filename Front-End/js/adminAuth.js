document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    const loginMessage = document.getElementById('login-message');
    const loginBtn = document.getElementById('login-btn');

    loginForm.addEventListener('submit', (e) => {
        // Formun sayfayı yenilemesini engelliyoruz
        e.preventDefault();

        const email = emailInput.value;
        const password = passwordInput.value;

        // Butonu "Bekleniyor" moduna al
        loginBtn.textContent = "Doğrulanıyor...";
        loginBtn.disabled = true;
        loginMessage.textContent = "";

        // Backend API isteğini simüle ediyoruz (1 saniye bekleme)
        setTimeout(() => {
            // TEST İÇİN GEÇERLİ BİLGİLER
            const validEmail = "admin@biokilit.com";
            const validPassword = "admin";

            if (email === validEmail && password === validPassword) {
                // Şifre doğruysa
                loginMessage.style.color = "#10b981"; // Yeşil
                loginMessage.textContent = "Giriş başarılı, yönlendiriliyorsunuz...";
                
                // Yarım saniye sonra asıl panele yönlendir
                setTimeout(() => {
                    window.location.href = "adminAnaSayfa.html";
                }, 500);

            } else {
                // Şifre yanlışsa
                loginMessage.style.color = "#ef4444"; // Kırmızı
                loginMessage.textContent = "Hatalı e-posta veya şifre!";
                
                // Butonu eski haline getir
                loginBtn.textContent = "Sisteme Giriş Yap";
                loginBtn.disabled = false;
                passwordInput.value = ""; // Şifre kutusunu temizle
                passwordInput.focus();
            }
        }, 1000);
    });
});