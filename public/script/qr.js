// script/qr.js
function openQRModal() {
    document.getElementById('qrModal').classList.add('active');
    document.getElementById('qrContainer').innerHTML = '<p style="color:var(--text-secondary);">Chargement du QR code...</p>';
}

function closeQRModal() {
    document.getElementById('qrModal').classList.remove('active');
    document.getElementById('qrContainer').innerHTML = '<p style="color:var(--text-secondary);">Chargement du QR code...</p>';
}

async function showQRCode() {
    let num = document.getElementById('phone').value.trim().replace(/[^0-9]/g, '');
    if (num.length < 10) {
        alert('Numéro invalide.');
        return;
    }
    openQRModal();
    const container = document.getElementById('qrContainer');
    try {
        const res = await fetch(`/qr?number=${encodeURIComponent(num)}`);
        if (!res.ok) {
            const data = await res.json();
            container.innerHTML = `<p style="color:red;">${data.error || 'Erreur'}</p>`;
            return;
        }
        const html = await res.text();
        // Extraire l'URL de l'image
        const match = html.match(/src="([^"]+)"/);
        if (match) {
            container.innerHTML = `<img src="${match[1]}" alt="QR Code" style="max-width:100%; height:auto; border: 4px solid #25D366; border-radius: 10px;">`;
        } else {
            container.innerHTML = '<p style="color:red;">Impossible d\'extraire le QR code.</p>';
        }
    } catch (e) {
        container.innerHTML = '<p style="color:red;">Erreur réseau.</p>';
    }
}
