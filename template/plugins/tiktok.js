const axios = require('axios');

module.exports = {
    name: "tiktok",
    aliases: ["tt", "tik"],
    desc: "Télécharge une vidéo TikTok (lien)",
    usage: ".tiktok <url>",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const url = args[0];
        if (!url || !url.includes('tiktok.com')) return sock.sendMessage(jid, { text: '❌ Lien TikTok invalide.' }, { quoted: msg });

        try {
            // Utiliser une API simple (ex: tikwm.com)
            const { data } = await axios.get('https://www.tikwm.com/api/', { params: { url } });
            if (data.code === 0 && data.data) {
                const videoUrl = data.data.play || data.data.wmplay;
                if (videoUrl) {
                    await sock.sendMessage(jid, {
                        video: { url: videoUrl },
                        caption: `🎬 ${data.data.title || ''}`
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(jid, { text: '❌ Vidéo introuvable.' }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(jid, { text: '❌ Erreur API.' }, { quoted: msg });
            }
        } catch (err) {
            console.error('Erreur tiktok:', err);
            await sock.sendMessage(jid, { text: '❌ Erreur lors du téléchargement.' }, { quoted: msg });
        }
    }
};
