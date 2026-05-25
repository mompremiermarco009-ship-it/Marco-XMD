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

function writeState(groupId, state) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(getStatePath(groupId), JSON.stringify(state, null, 2));
}

module.exports = {
    name: "antimention",
    aliases: ["antim", "amention"],
    desc: "Active/désactive l'anti‑mention (supprime les messages contenant des @)",
    usage: ".antimention on/off/status",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Cette commande ne fonctionne que dans les groupes.' }, { quoted: msg });
        }

        // Vérifier que l'utilisateur est admin
        const sender = msg.key.participant || msg.key.remoteJid;
        try {
            const metadata = await sock.groupMetadata(jid);
            const participants = metadata.participants;
            const senderInfo = participants.find(p => p.id === sender);
            const isAdmin = senderInfo && (senderInfo.admin === 'admin' || senderInfo.admin === 'superadmin');
            if (!isAdmin) {
                return sock.sendMessage(jid, { text: '❌ Seuls les administrateurs peuvent gérer l\'anti‑mention.' }, { quoted: msg });
            }
        } catch (err) {
            return sock.sendMessage(jid, { text: '❌ Impossible de vérifier les droits d\'administration.' }, { quoted: msg });
        }

        const sub = (args[0] || '').toLowerCase().trim();
        if (!sub || (sub !== 'on' && sub !== 'off' && sub !== 'status')) {
            return sock.sendMessage(jid, {
                text: `🛡️ *ANTI-MENTION*\n\n.antimention on  – Active\n.antimention off – Désactive\n.antimention status – Affiche l'état`
            }, { quoted: msg });
        }

        if (sub === 'status') {
            const state = readState(jid);
            return sock.sendMessage(jid, { text: `🛡️ Anti‑mention : *${state.enabled ? 'ON ✅' : 'OFF ❌'}*\n📌 Seuil : ${state.threshold} mentions\n👑 Admin bypass : ${state.adminBypass ? 'ON' : 'OFF'}` }, { quoted: msg });
        }

        const enable = sub === 'on';
        const state = readState(jid);
        state.enabled = enable;
        writeState(jid, state);
        await sock.sendMessage(jid, { text: `🛡️ Anti‑mention *${enable ? 'activé' : 'désactivé'}*.` }, { quoted: msg });
    }
};
