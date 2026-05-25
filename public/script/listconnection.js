// script/listconnection.js
async function loadSessions() {
    const container = document.getElementById('sessionList');
    try {
        const res = await fetch('/api/sessions');
        const sessions = await res.json();
        if (!Array.isArray(sessions) || sessions.length === 0) {
            container.innerHTML = '<p>Aucune session active pour le moment.</p>';
            return;
        }
        let html = '';
        sessions.forEach(session => {
            html += `
            <div class="session-item">
                <span class="session-number">📱 +${session}</span>
                <button class="delete-btn" onclick="deleteSession('${session}')">
                    <i class="fas fa-trash-alt"></i> Supprimer
                </button>
            </div>`;
        });
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = '<p style="color:red;">Erreur lors du chargement des sessions.</p>';
        console.error(err);
    }
}

async function deleteSession(sessionId) {
    if (!confirm(`Supprimer définitivement la session ${sessionId} ?`)) return;
    try {
        const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            alert('Session supprimée.');
            loadSessions(); // rafraîchir la liste
        } else {
            alert(data.error || 'Échec de la suppression.');
        }
    } catch (err) {
        alert('Erreur réseau.');
        console.error(err);
    }
}

// Charger automatiquement au chargement de la page
document.addEventListener('DOMContentLoaded', loadSessions);
