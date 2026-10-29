// 1. AŞAMA: Sayfa yüklenmeden (UI görünmeden) hemen token kontrolü yap (Flicker engelleme)
const token = localStorage.getItem('adminToken');

if (!token) {
    // Token yoksa içeriği göstermeden anında kapı dışarı et
    window.location.replace('adminGiris.html');
}

// 2. AŞAMA: Sayfa yüklendikten sonra çıkış yapma (Logout) işlemlerini merkeze bağla
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtns = document.querySelectorAll('.logout-btn');
    
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Tarayıcıdaki anahtarları yok et
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            
            // Güvenli bir şekilde ana sayfaya yönlendir
            window.location.replace('anaSayfa.html');
        });
    });
});