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

function writeConfig(groupId, config) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(getConfigPath(groupId), JSON.stringify(config, null, 2));
}

const linkPattern = /https?:\/\/\S+|www\.\S+|chat\.whatsapp\.com\/[A-Za-z0-9]{20,}|wa\.me\/channel\/[A-Za-z0-9]{20,}|t\.me\/[A-Za-z0-9_]+/i;

module.exports = {
    name: "antilink",
    aliases: ["antilien", "nolink"],
    desc: "Anti‑liens : supprime les messages contenant des liens",
    usage: ".antilink on/off/set delete|kick|warn",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Cette commande ne fonctionne que dans les groupes.' }, { quoted: msg });
        }

        // Vérifier admin
        const sender = msg.key.participant || jid;
        try {
            const metadata = await sock.groupMetadata(jid);
            const senderInfo = metadata.participants.find(p => p.id === sender);
            if (!senderInfo || (senderInfo.admin !== 'admin' && senderInfo.admin !== 'superadmin')) {
                return sock.sendMessage(jid, { text: '❌ Seuls les administrateurs peuvent gérer l\'anti‑lien.' }, { quoted: msg });
            }
        } catch {
            return sock.sendMessage(jid, { text: '❌ Impossible de vérifier les droits.' }, { quoted: msg });
        }

        const sub = (args[0] || '').toLowerCase();
        if (!sub || (sub !== 'on' && sub !== 'off' && sub !== 'set')) {
            const cfg = readConfig(jid);
            return sock.sendMessage(jid, {
                text: `🛡️ *ANTI‑LIEN*\n\nÉtat : ${cfg.enabled ? 'ON ✅' : 'OFF ❌'}\nAction : ${cfg.action}\n\n.antilink on\n.antilink off\n.antilink set delete|kick|warn`
            }, { quoted: msg });
        }

        if (sub === 'on') {
            const cfg = readConfig(jid);
            cfg.enabled = true;
            writeConfig(jid, cfg);
            return sock.sendMessage(jid, { text: '🛡️ Anti‑lien activé. Les liens seront supprimés.' }, { quoted: msg });
        }

        if (sub === 'off') {
            const cfg = readConfig(jid);
            cfg.enabled = false;
            writeConfig(jid, cfg);
            return sock.sendMessage(jid, { text: '🛡️ Anti‑lien désactivé.' }, { quoted: msg });
        }

        if (sub === 'set') {
            const action = (args[1] || '').toLowerCase();
            if (!['delete', 'kick', 'warn'].includes(action)) {
                return sock.sendMessage(jid, { text: '❌ Action invalide. Utilisez delete, kick ou warn.' }, { quoted: msg });
            }
            const cfg = readConfig(jid);
            cfg.action = action;
            writeConfig(jid, cfg);
            return sock.sendMessage(jid, { text: `🛡️ Action anti‑lien définie sur *${action}*.` }, { quoted: msg });
        }
    }
};
