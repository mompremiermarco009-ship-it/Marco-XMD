const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'antimention');

function getStatePath(groupId) {
    return path.join(DATA_DIR, `${groupId}.json`);
}

function readState(groupId) {
    try {
        const file = getStatePath(groupId);
        if (!fs.existsSync(file)) return { enabled: false, threshold: 5, adminBypass: true };
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch { return { enabled: false, threshold: 5, adminBypass: true }; }
}

module.exports = {
    name: "messages.upsert",
    async execute(sock, { messages }) {
        for (const msg of messages) {
            const jid = msg.key.remoteJid;
            if (!jid.endsWith('@g.us')) continue;
            if (!msg.message) continue;
            if (msg.key.fromMe) continue; // ne pas supprimer ses propres messages

            const state = readState(jid);
            if (!state.enabled) continue;

            // Vérifier le nombre de mentions
            const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (mentions.length >= state.threshold) {
                // Admin bypass : si l'expéditeur est admin, on ignore
                const sender = msg.key.participant || jid;
                if (state.adminBypass) {
                    try {
                        const metadata = await sock.groupMetadata(jid);
                        const senderInfo = metadata.participants.find(p => p.id === sender);
                        if (senderInfo && (senderInfo.admin === 'admin' || senderInfo.admin === 'superadmin')) continue;
                    } catch {}
                }

                // Supprimer le message
                try {
                    await sock.sendMessage(jid, {
                        delete: {
                            remoteJid: jid,
                            fromMe: false,
                            id: msg.key.id,
                            participant: sender
                        }
                    });
                    console.log(`🗑️ Message supprimé (anti‑mention) de ${sender} dans ${jid}`);
                } catch (err) {
                    console.error('Erreur suppression antimention:', err.message);
                }
            }
        }
    }
};
