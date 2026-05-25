const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'antilink');

function getConfigPath(groupId) {
    return path.join(DATA_DIR, `${groupId}.json`);
}

function readConfig(groupId) {
    try {
        const file = getConfigPath(groupId);
        if (!fs.existsSync(file)) return { enabled: false, action: 'delete' };
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch { return { enabled: false, action: 'delete' }; }
}

const linkPattern = /https?:\/\/\S+|www\.\S+|chat\.whatsapp\.com\/[A-Za-z0-9]{20,}|wa\.me\/channel\/[A-Za-z0-9]{20,}|t\.me\/[A-Za-z0-9_]+/i;

module.exports = {
    name: "messages.upsert",
    async execute(sock, { messages }) {
        for (const msg of messages) {
            const jid = msg.key.remoteJid;
            if (!jid.endsWith('@g.us')) continue;
            if (!msg.message) continue;
            if (msg.key.fromMe) continue;

            const cfg = readConfig(jid);
            if (!cfg.enabled) continue;

            let texte = "";
            const m = msg.message;
            if (m.conversation) texte = m.conversation;
            else if (m.extendedTextMessage) texte = m.extendedTextMessage.text;
            else if (m.imageMessage) texte = m.imageMessage.caption;
            else if (m.videoMessage) texte = m.videoMessage.caption;
            if (!texte) continue;

            if (!linkPattern.test(texte)) continue;

            const sender = msg.key.participant || jid;

            // Vérifier si l'expéditeur est admin (bypass)
            try {
                const metadata = await sock.groupMetadata(jid);
                const senderInfo = metadata.participants.find(p => p.id === sender);
                if (senderInfo && (senderInfo.admin === 'admin' || senderInfo.admin === 'superadmin')) continue;
            } catch {}

            // Action
            if (cfg.action === 'delete') {
                try {
                    await sock.sendMessage(jid, {
                        delete: {
                            remoteJid: jid,
                            fromMe: false,
                            id: msg.key.id,
                            participant: sender
                        }
                    });
                    await sock.sendMessage(jid, { text: `⚠️ @${sender.split('@')[0]} les liens ne sont pas autorisés.`, mentions: [sender] });
                } catch (e) {
                    console.error('Erreur suppression antilink:', e.message);
                }
            } else if (cfg.action === 'kick') {
                try {
                    await sock.groupParticipantsUpdate(jid, [sender], 'remove');
                    await sock.sendMessage(jid, { text: `🚫 @${sender.split('@')[0]} a été exclu pour avoir envoyé un lien.`, mentions: [sender] });
                } catch (e) {
                    console.error('Erreur kick antilink:', e.message);
                }
            } else if (cfg.action === 'warn') {
                await sock.sendMessage(jid, { text: `⚠️ @${sender.split('@')[0]} avertissement : les liens sont interdits.`, mentions: [sender] });
            }
        }
    }
};
