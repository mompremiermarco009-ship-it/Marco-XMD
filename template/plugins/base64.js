// plugins/base64.js
module.exports = {
    name: 'base64',
    aliases: ['b64'],
    description: 'Encode ou décode un texte en Base64',
    usage: '.base64 encode <texte> / .base64 decode <base64>',

    async execute(sock, message, args) {
        const jid = message.key.remoteJid;
        if (!args[0] || !['encode', 'decode'].includes(args[0].toLowerCase())) {
            return sock.sendMessage(jid, { text: '❌ Usage : .base64 encode <texte> ou .base64 decode <base64>' }, { quoted: message });
        }
        const action = args[0].toLowerCase();
        const input = args.slice(1).join(' ');
        if (!input) return sock.sendMessage(jid, { text: '❌ Texte manquant.' }, { quoted: message });

        try {
            let result;
            if (action === 'encode') {
                result = Buffer.from(input, 'utf-8').toString('base64');
            } else {
                result = Buffer.from(input, 'base64').toString('utf-8');
            }
            await sock.sendMessage(jid, { text: `🔐 Base64 ${action === 'encode' ? 'Encodé' : 'Décodé'} :\n${result}` }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(jid, { text: '⚠️ Erreur : chaîne invalide ou encodage incorrect.' }, { quoted: message });
        }
    }
};
