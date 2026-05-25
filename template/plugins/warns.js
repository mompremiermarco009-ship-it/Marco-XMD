// plugins/warns.js
const { readWarns } = require('./warn');

module.exports = {
    name: 'warns',
    aliases: ['listwarn', 'averissements'],
    description: 'Affiche les avertissements d\'un membre',
    usage: '.warns @user',

    async execute(sock, message) {
        const jid = message.key.remoteJid;
        if (!jid.endsWith('@g.us')) return;

        const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (!mentions.length) return sock.sendMessage(jid, { text: '❌ Mentionnez un membre.' }, { quoted: message });

        const target = mentions[0];
        const warns = readWarns(jid);
        const userWarns = warns[target] || [];

        if (userWarns.length === 0) {
            return sock.sendMessage(jid, { text: `✅ Aucun avertissement pour @${target.split('@')[0]}.`, mentions: [target] }, { quoted: message });
        }

        const list = userWarns.map((w, i) => `${i+1}. ${w.reason} (${new Date(w.date).toLocaleString()})`).join('\n');
        await sock.sendMessage(jid, { text: `📋 Avertissements de @${target.split('@')[0]} :\n${list}`, mentions: [target] }, { quoted: message });
    }
};
