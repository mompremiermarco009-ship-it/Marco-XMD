const shazam = require('shazam-api');

module.exports = {
    name: "shazam",
    aliases: ["reconnaitre"],
    desc: "Reconnaît une musique (audio ou réponse à un fichier audio)",
    usage: ".shazam (en répondant à un audio)",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        // Récupérer le buffer audio du message cité ou du message lui-même
        let audioBuffer = null;
        if (msg.message?.audioMessage) {
            audioBuffer = await sock.downloadMediaMessage(msg, "buffer", {});
        } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage) {
            const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            audioBuffer = await sock.downloadMediaMessage({ message: quoted }, "buffer", {});
        } else {
            return sock.sendMessage(jid, { text: '❌ Envoyez ou citez un message audio.' }, { quoted: msg });
        }

        try {
            const result = await shazam(audioBuffer, 'fr');
            if (result && result.track && result.artist) {
                await sock.sendMessage(jid, { text: `🎵 *${result.track}* - ${result.artist}` }, { quoted: msg });
            } else {
                await sock.sendMessage(jid, { text: '❌ Musique non reconnue.' }, { quoted: msg });
            }
        } catch (err) {
            console.error('Erreur shazam:', err);
            await sock.sendMessage(jid, { text: '❌ Erreur lors de la reconnaissance.' }, { quoted: msg });
        }
    }
};
