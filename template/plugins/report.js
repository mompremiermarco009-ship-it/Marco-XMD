// plugins/report.js
const fs = require('fs');

module.exports = {
    name: 'report',
    aliases: ['signaler', 'bug', 'rapport'],
    description: 'Envoyer un signalement au propriétaire du bot',
    usage: '.report <votre message>',

    async execute(sock, message, args) {
        const jid = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;
        const senderName = sender.split('@')[0];

        const reportText = args.join(' ').trim();
        if (!reportText) {
            return sock.sendMessage(jid, { text: '❌ Veuillez écrire votre signalement.\nExemple : *.report Bug sur la commande play*' }, { quoted: message });
        }

        // Lire directement le numéro du propriétaire depuis config.json
        let config = {};
        try {
            config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
        } catch(e) {}

        const ownerNumber = config.ownerNumber || '50941131299';
        const ownerJid = ownerNumber + '@s.whatsapp.net';

        try {
            await sock.sendMessage(ownerJid, {
                text: `📩 *Signalement de @${senderName}*\n\n${reportText}`,
                mentions: [sender]
            });
            await sock.sendMessage(jid, { text: '✅ Votre signalement a été transmis au propriétaire.' }, { quoted: message });
        } catch (err) {
            console.error('Erreur report:', err);
            await sock.sendMessage(jid, { text: '⚠️ Impossible d’envoyer le signalement pour le moment.' }, { quoted: message });
        }
    }
};
