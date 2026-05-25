// plugins/download.js
const axios = require('axios');

module.exports = {
    name: 'download',
    aliases: ['dl'],
    description: 'Télécharge un fichier depuis une URL directe et l\'envoie',
    usage: '.download <url>',

    async execute(sock, message, args) {
        const jid = message.key.remoteJid;
        const url = args[0];
        if (!url) {
            return sock.sendMessage(jid, { text: '❌ Donnez une URL de fichier.' }, { quoted: message });
        }

        await sock.sendMessage(jid, { text: '⏳ Téléchargement en cours...' }, { quoted: message });

        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            const buffer = Buffer.from(response.data);
            const filename = url.split('/').pop() || 'file';

            await sock.sendMessage(jid, {
                document: buffer,
                fileName: filename,
                mimetype: response.headers['content-type'] || 'application/octet-stream'
            }, { quoted: message });

        } catch (err) {
            console.error('Erreur download:', err);
            await sock.sendMessage(jid, { text: '⚠️ Impossible de télécharger le fichier.' }, { quoted: message });
        }
    }
};
