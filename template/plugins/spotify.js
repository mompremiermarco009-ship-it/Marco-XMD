const spotify = require('spotify-dl');

module.exports = {
    name: "spotify",
    aliases: ["sp", "spdl"],
    desc: "Télécharge une musique depuis Spotify (lien)",
    usage: ".spotify <url>",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const url = args[0];
        if (!url || !url.includes('spotify.com')) return sock.sendMessage(jid, { text: '❌ Lien Spotify invalide.' }, { quoted: msg });

        try {
            const info = await spotify(url);
            if (info && info.song && info.download) {
                const audioBuffer = await info.download();
                await sock.sendMessage(jid, {
                    audio: audioBuffer,
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    title: info.song
                }, { quoted: msg });
            } else {
                await sock.sendMessage(jid, { text: '❌ Impossible de télécharger.' }, { quoted: msg });
            }
        } catch (err) {
            console.error('Erreur spotify:', err);
            await sock.sendMessage(jid, { text: '❌ Erreur Spotify.' }, { quoted: msg });
        }
    }
};
