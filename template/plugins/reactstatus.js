const fs = require('fs');
const path = require('path');
const { isAuthorized } = require('../utils/auth');

module.exports = {
    name: 'reactstatus',
    aliases: ['autostatus', 'statusreaction'],
    category: 'owner',
    desc: 'Active/désactive les réactions aux statuts (globale ou par numéro)',
    usage: '.reactstatus on/off [numéro]',
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || require('../config.json');

        if (!isAuthorized(sock, msg, cfg)) {
            return sock.sendMessage(jid, { text: '❌ Commande réservée au propriétaire.' }, { quoted: msg });
        }

        const sub = (args[0] || '').toLowerCase();
        const targetNumber = args[1] ? args[1].replace(/[^0-9]/g, '') : null;

        if (sub === 'on') {
            if (targetNumber) {
                if (!cfg.excludedStatusNumbers) cfg.excludedStatusNumbers = [];
                cfg.excludedStatusNumbers = cfg.excludedStatusNumbers.filter(n => n !== targetNumber);
            } else {
                cfg.reactstatus = true;
            }
        } else if (sub === 'off') {
            if (targetNumber) {
                if (!cfg.excludedStatusNumbers) cfg.excludedStatusNumbers = [];
                if (!cfg.excludedStatusNumbers.includes(targetNumber)) cfg.excludedStatusNumbers.push(targetNumber);
            } else {
                cfg.reactstatus = false;
            }
        } else {
            const globalStatus = cfg.reactstatus ? 'ON 🟢' : 'OFF 🔴';
            const excluded = cfg.excludedStatusNumbers ? `\nExclus : ${cfg.excludedStatusNumbers.join(', ')}` : '';
            return sock.sendMessage(jid, { text: `👀 *Auto-Status* : ${globalStatus}${excluded}` }, { quoted: msg });
        }

        const sessionID = sock.user.id.split(':')[0].replace(/[^0-9]/g, '');
        const sessionConfigPath = path.join(__dirname, '..', 'sessions', sessionID, 'config.json');
        try {
            fs.mkdirSync(path.dirname(sessionConfigPath), { recursive: true });
            fs.writeFileSync(sessionConfigPath, JSON.stringify(cfg, null, 2));
        } catch (e) {
            console.error('Erreur sauvegarde reactstatus:', e.message);
        }
        sock.config = cfg;

        const status = cfg.reactstatus ? 'activé ✅' : 'désactivé ❌';
        await sock.sendMessage(jid, { text: `👀 Réactions aux statuts *${status}* pour cette session.` }, { quoted: msg });
    }
};
