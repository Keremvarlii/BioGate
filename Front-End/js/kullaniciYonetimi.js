document.addEventListener('DOMContentLoaded', () => {
    // Sayfa açıldığında kullanıcıları tablodan çek
    kullanicilariGetir();

    // ID eklediğimiz formu yakala
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', yeniKullaniciEkle);
    }
});

// --- 1. KULLANICILARI LİSTELEME (GET) ---
async function kullanicilariGetir() {
    const tbody = document.querySelector('tbody');
    const token = localStorage.getItem('adminToken'); // adminAuth'taki doğru anahtar adı

    if (!token) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Kullanıcılar yükleniyor...</td></tr>';

    try {
        const response = await fetch('http://localhost:5001/api/users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            tabloyuDoldur(data.data);
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444;">${data.message}</td></tr>`;
        }
    } catch (error) {
        console.error("Bağlantı hatası:", error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #ef4444;">Sunucuya ulaşılamadı. Node.js açık mı?</td></tr>';
    }
}

// Tabloyu tasarıma uygun şekilde ekrana çizme
function tabloyuDoldur(kullanicilar) {
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = '';

    if (kullanicilar.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #9ca3af;">Henüz kayıtlı personel yok.</td></tr>';
        return;
    }

    kullanicilar.forEach((user, index) => {
        // Tasarıma uygun rozetler (Badge)
        const roleText = user.role === 'admin' ? 'Sistem Yöneticisi' : 'Standart Geçiş';
        const statusBadge = user.isActive 
            ? '<span class="badge badge-success">Aktif</span>' 
            : '<span class="badge badge-danger">Askıda</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${String(index + 1).padStart(3, '0')}</td>
            <td>${user.fullName}</td>
            <td>${user.email}</td>
            <td>${roleText}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="action-btn text-warning" onclick="durumDegistir('${user._id}')">${user.isActive ? 'Askıya Al' : 'Aktifleştir'}</button>
                <button class="action-btn text-danger" onclick="kullaniciSil('${user._id}')">Sil</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- 2. YENİ KULLANICI EKLEME (POST) ---
async function yeniKullaniciEkle(e) {
    e.preventDefault(); // Sayfa yenilenmesini engelle

    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const roleSelect = document.getElementById('role');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    // Seçilen değere göre Backend'in anladığı 'admin' veya 'standard' kelimesini belirliyoruz
    const roleValue = roleSelect.value === 'Sistem Yöneticisi (Admin)' ? 'admin' : 'standard';

    const token = localStorage.getItem('adminToken');
    if (!token) return alert("Oturum bulunamadı!");

    // Butonu tıklandığında "Kaydediliyor..." yapalım ki adam 2 kere basmasın
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Kaydediliyor...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:5001/api/users', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fullName, email, role: roleValue })
        });

        const data = await response.json();

        if (data.success) {
            // Formu boşalt ve tabloyu yeniden çek (Böylece anında ekranda belirir)
            e.target.reset();
            kullanicilariGetir();
        } else {
            alert('Hata: ' + data.message); // Örn: Bu e-posta zaten kullanımda
        }
    } catch (error) {
        console.error("Kayıt işlemi başarısız:", error);
        alert("Sunucu ile iletişim kurulamadı.");
    } finally {
        // İşlem bitince butonu eski haline getir
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}

// --- 3. KULLANICIYI ASKIYA AL / AKTİFLEŞTİR (PUT) ---
window.durumDegistir = async function(id) {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
        const response = await fetch(`http://localhost:5001/api/users/${id}/toggle-status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            // Başarılıysa tabloyu yenile ki rozet anında "Askıda" veya "Aktif" olarak değişsin
            kullanicilariGetir();
        } else {
            alert("İşlem başarısız: " + data.message);
        }
    } catch (error) {
        console.error("Durum değiştirme hatası:", error);
        alert("Sunucuyla iletişim kurulamadı.");
    }
}

// --- 4. KULLANICIYI SİL (DELETE) ---
window.kullaniciSil = async function(id) {
    // Silmeden önce yanlış tıklamalara karşı bir onay isteyelim
    const onay = confirm("Bu yetkiliyi sistemden kalıcı olarak silmek istediğinize emin misiniz?");
    if (!onay) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
        const response = await fetch(`http://localhost:5001/api/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            // Başarılıysa tabloyu yenile ki kişi listeden kaybolsun
            kullanicilariGetir();
        } else {
            alert("Silme işlemi başarısız: " + data.message);
        }
    } catch (error) {
        console.error("Silme hatası:", error);
        alert("Sunucuyla iletişim kurulamadı.");
    }
}