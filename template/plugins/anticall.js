const fs = require('fs');
const path = require('path');

const ANTICALL_PATH = path.join(__dirname, '..', 'data', 'anticall.json');

function readState() {
    try {
        if (!fs.existsSync(ANTICALL_PATH)) return { enabled: false };
        const raw = fs.readFileSync(ANTICALL_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return { enabled: !!data.enabled };
    } catch {
        return { enabled: false };
    }
}

function writeState(enabled) {
    try {
        const dir = path.dirname(ANTICALL_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(ANTICALL_PATH, JSON.stringify({ enabled: !!enabled }, null, 2));
    } catch {}
}

module.exports = {
    name: "anticall",
    aliases: ["antiappel", "blockcall"],
    desc: "Active/désactive le blocage automatique des appels",
    usage: ".anticall on / off / status",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const sub = (args[0] || '').toLowerCase().trim();

        if (!sub || (sub !== 'on' && sub !== 'off' && sub !== 'status')) {
            return sock.sendMessage(jid, {
                text: `📵 *ANTICALL*\n\n.anticall on – Active le blocage\n.anticall off – Désactive\n.anticall status – Affiche l'état`
            }, { quoted: msg });
        }

        if (sub === 'status') {
            const state = readState();
            return sock.sendMessage(jid, { text: `📵 Anticall est *${state.enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}*.` }, { quoted: msg });
        }

        const enable = sub === 'on';
        writeState(enable);
        await sock.sendMessage(jid, { text: `📵 Anticall *${enable ? 'activé' : 'désactivé'}*.` }, { quoted: msg });
    }
};
