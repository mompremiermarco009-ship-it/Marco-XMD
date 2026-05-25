const axios = require('axios');

const TYPES = ['nom', 'poke', 'cry', 'kiss', 'pat', 'hug', 'wink', 'face-palm', 'quote'];

module.exports = {
    name: "anime",
    aliases: ["animu", "animegif"],
    desc: "GIFs animés et stickers anime",
    usage: ".anime <type>   Types: nom, poke, cry, kiss, pat, hug, wink, face-palm, quote",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const type = (args[0] || '').toLowerCase().replace('_', '-');

        if (!type || !TYPES.includes(type)) {
            return sock.sendMessage(jid, {
                text: `🎌 *Anime*\nTypes disponibles : ${TYPES.join(', ')}\n\nExemple : .anime hug`
            }, { quoted: msg });
        }

        try {
            const { data } = await axios.get(`https://api.some-random-api.com/animu/${type}`);
            if (!data || (!data.link && !data.quote)) throw new Error('Aucune réponse');

            if (data.quote) {
                await sock.sendMessage(jid, { text: `💬 ${data.quote}` }, { quoted: msg });
                return;
            }

            if (data.link) {
                const isGif = data.link.toLowerCase().endsWith('.gif');
                const isImage = /\.(jpg|jpeg|png|webp)$/i.test(data.link);

                if (isGif) {
                    await sock.sendMessage(jid, {
                        video: { url: data.link },
                        gifPlayback: true,
                        caption: `🎌 ${type}`
                    }, { quoted: msg });
                } else if (isImage) {
                    await sock.sendMessage(jid, {
                        image: { url: data.link },
                        caption: `🎌 ${type}`
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(jid, {
                        image: { url: data.link },
                        caption: `🎌 ${type}`
                    }, { quoted: msg });
                }
            }
        } catch (err) {
            console.error('Erreur anime:', err.message);
            await sock.sendMessage(jid, { text: '❌ Impossible de récupérer l\'anime.' }, { quoted: msg });
        }
    }
};
