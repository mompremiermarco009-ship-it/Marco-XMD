// events/call.js
const fs = require('fs');
const path = require('path');

const ANTICALL_PATH = path.join(__dirname, '..', 'data', 'anticall.json');

function isAnticallEnabled() {
    try {
        if (!fs.existsSync(ANTICALL_PATH)) return false;
        const data = JSON.parse(fs.readFileSync(ANTICALL_PATH, 'utf8') || '{}');
        return !!data.enabled;
    } catch {
        return false;
    }
}

module.exports = {
    name: "call",
    async execute(sock, call) {
        if (!isAnticallEnabled()) return;

        const { id, from, status } = call;
        // Bloquer uniquement les appels entrants (status = 'offer')
        if (status === 'offer' && from) {
            try {
                await sock.rejectCall(id, from);
                console.log(`📵 Appel bloqué de ${from}`);
                // Optionnel : envoyer un message à la personne bloquée
                await sock.sendMessage(from, { text: "📵 Vos appels sont automatiquement bloqués. Contactez-moi par message." });
            } catch (err) {
                console.error("Erreur blocage appel:", err.message);
            }
        }
    }
};
