// plugins/resetwarn.js
const fs = require('fs');
const path = require('path');
const getWarnsPath = (groupId) => path.join(__dirname, '..', 'data', `warns_${groupId}.json`);

module.exports = {
    name: 'resetwarn',
    aliases: ['clearwarn', 'unwarn'],
    description: 'Réinitialise les avertissements d\'un membre',
    usage: '.resetwarn @user',

    async execute(sock, message) {
        const jid = message.key.remoteJid;
        if (!jid.endsWith('@g.us')) return;

        const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (!mentions.length) return sock.sendMessage(jid, { text: '❌ Mentionnez un membre.' }, { quoted: message });
        const target = mentions[0];

        const file = getWarnsPath(jid);
        if (!fs.existsSync(file)) return sock.sendMessage(jid, { text: '✅ Aucun avertissement à réinitialiser.' }, { quoted: message });
        const warns = JSON.parse(fs.readFileSync(file, 'utf-8'));
        if (warns[target]) {
            delete warns[target];
            fs.writeFileSync(file, JSON.stringify(warns, null, 2));
            await sock.sendMessage(jid, { text: `🔄 Avertissements de @${target.split('@')[0]} réinitialisés.`, mentions: [target] }, { quoted: message });
        } else {
            await sock.sendMessage(jid, { text: 'ℹ️ Ce membre n\'a aucun avertissement.' }, { quoted: message });
        }
    }
};
