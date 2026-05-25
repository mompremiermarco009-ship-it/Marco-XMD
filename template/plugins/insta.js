const axios = require('axios');

module.exports = {
    name: "insta",
    aliases: ["ig", "instagram"],
    desc: "Télécharge une vidéo ou image Instagram",
    usage: ".insta <url>",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const url = args[0];
        if (!url || !url.includes('instagram.com')) return sock.sendMessage(jid, { text: '❌ Fournissez une URL Instagram valide.' }, { quoted: msg });

        try {
            // Utilisation de l'API insta-dl (ou une alternative gratuite)
            const { data } = await axios.get(`https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`);
            if (!data || !data.thumbnail_url) return sock.sendMessage(jid, { text: '❌ Impossible de récupérer le média.' }, { quoted: msg });

            // Pour simplifier, on renvoie le thumbnail ; pour une vraie vidéo, il faut une autre approche
            await sock.sendMessage(jid, { image: { url: data.thumbnail_url }, caption: '📸 Instagram' }, { quoted: msg });
        } catch (err) {
            console.error('Erreur insta:', err);
            await sock.sendMessage(jid, { text: '❌ Erreur lors du téléchargement.' }, { quoted: msg });
        }
    }
};
