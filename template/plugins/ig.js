const axios = require('axios');

module.exports = {
    name: "ig",
    aliases: ["instagram", "insta"],
    desc: "Télécharge un média Instagram",
    usage: ".ig <url>",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const url = (args[0] || '').trim();
        if (!url || !url.includes('instagram.com')) {
            return sock.sendMessage(jid, {
                text: '❌ Donne un lien Instagram valide.\nExemple : .ig https://www.instagram.com/p/xxxx'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(jid, { react: { text: '⬇️', key: msg.key } });

            const apiUrl = `https://tele-social.vercel.app/down?url=${encodeURIComponent(url)}`;
            const { data } = await axios.get(apiUrl, { timeout: 15000 });

            const isOk = data?.success === true || data?.status === true;
            const payload = data?.données || data?.data || data?.result || data?.meta;

            if (!isOk || !payload) throw new Error('Échec API');

            const medias = payload?.medias?.medias || payload?.data?.medias || payload?.medias || [];
            if (!Array.isArray(medias) || medias.length === 0) throw new Error('Aucun média');

            const caption = `📸 *Instagram*\n👤 ${payload?.author?.username || payload?.auteur?.username || 'N/A'}\n❤️ ${payload?.likes ?? 'N/A'} | 💬 ${payload?.comments ?? 'N/A'}`;

            const limit = Math.min(medias.length, 5);
            for (let i = 0; i < limit; i++) {
                const item = medias[i];
                const mediaUrl = item?.org || item?.url || item?.hd || item?.wm;
                if (!mediaUrl) continue;

                const isVideo = item?.type === 'video' || mediaUrl.includes('.mp4');
                if (isVideo) {
                    await sock.sendMessage(jid, {
                        video: { url: mediaUrl },
                        mimetype: 'video/mp4',
                        caption: i === 0 ? caption : ''
                    }, { quoted: i === 0 ? msg : undefined });
                } else {
                    await sock.sendMessage(jid, {
                        image: { url: mediaUrl },
                        caption: i === 0 ? caption : ''
                    }, { quoted: i === 0 ? msg : undefined });
                }
            }

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('Erreur ig:', err.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, { text: '❌ Impossible de télécharger le média Instagram.' }, { quoted: msg });
        }
    }
};
