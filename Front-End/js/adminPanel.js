document.addEventListener('DOMContentLoaded', () => {
    // Sayfa açıldığında logları çek
    fetchLogs();

    // 'Yenile' butonuna basıldığında logları tekrar çek
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchLogs);
    }
});

async function fetchLogs() {
    const tableBody = document.getElementById('log-table-body');
    const token = localStorage.getItem('adminToken');

    if (!token) return;

    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loglar yükleniyor...</td></tr>';

    try {
        const response = await fetch('http://localhost:5001/api/logs', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            renderLogs(data.data);
            updateStats(data.data); // İstatistikleri güncelle
        } else {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444;">${data.message}</td></tr>`;
        }
    } catch (error) {
        console.error('Bağlantı hatası:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ef4444;">Sunucuya bağlanılamadı. Node.js sunucusunu kontrol edin.</td></tr>';
    }
}

function renderLogs(logs) {
    const tableBody = document.getElementById('log-table-body');
    tableBody.innerHTML = ''; 

    if (logs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #9ca3af;">Henüz sistemde hiç kayıtlı log bulunmuyor.</td></tr>';
        return;
    }

    logs.forEach(log => {
        let badgeClass = 'badge-success';
        if (log.status === 'warning') badgeClass = 'badge-warning';
        if (log.status === 'danger') badgeClass = 'badge-danger';

        const dateObj = new Date(log.createdAt);
        const dateStr = dateObj.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

        const evidenceHtml = log.evidenceImage 
            ? `<a href="${log.evidenceImage}" class="view-image-link" target="_blank">Görüntüyü İncele</a>` 
            : '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dateStr}, ${timeStr}</td>
            <td>${log.userName || 'Bilinmiyor'}</td>
            <td>${log.eventType}</td>
            <td><span class="badge ${badgeClass}">${log.statusText}</span></td>
            <td>${evidenceHtml}</td>
        `;
        
        tableBody.appendChild(tr);
    });
}

// YENİ EKLENEN FONKSİYON: İstatistik kartlarını günceller
function updateStats(logs) {
    let successCount = 0;
    let warningCount = 0;
    let dangerCount = 0;

    // Sadece bugünün tarihini alıyoruz
    const today = new Date().setHours(0, 0, 0, 0);

    logs.forEach(log => {
        const logDate = new Date(log.createdAt).setHours(0, 0, 0, 0);
        
        // Sadece bugünün loglarını say
        if (logDate === today) {
            if (log.status === 'success') successCount++;
            if (log.status === 'warning') warningCount++;
            if (log.status === 'danger') dangerCount++;
        }
    });

    // Sayıları HTML'e bas
    document.getElementById('stat-success').textContent = successCount;
    document.getElementById('stat-warning').textContent = warningCount;
    document.getElementById('stat-danger').textContent = dangerCount;
}