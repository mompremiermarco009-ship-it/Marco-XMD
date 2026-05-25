const axios = require('axios');

module.exports = {
    name: "lyrics",
    aliases: ["paroles", "lyric"],
    desc: "Recherche les paroles d'une chanson",
    usage: ".lyrics <titre de la chanson>",
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(chatId, {
                text: '❌ Veuillez préciser une chanson.\n✅ Exemple : *.lyrics Bohemian Rhapsody*'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatId, { react: { text: '🔍', key: msg.key } }).catch(() => {});

            // Recherche via lyrics.ovh
            const searchRes = await axios.get(
                `https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`,
                { timeout: 10000 }
            );

            const results = searchRes.data?.data;
            if (!results || results.length === 0) {
                return sock.sendMessage(chatId, {
                    text: `❌ Aucune chanson trouvée pour : *${query}*`
                }, { quoted: msg });
            }

            const top = results[0];
            const artist = top.artist?.name || 'Inconnu';
            const title = top.title || query;

            // Récupération des paroles
            const lyricsRes = await axios.get(
                `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
                { timeout: 10000 }
            );

            const lyrics = lyricsRes.data?.lyrics;
            if (!lyrics) {
                return sock.sendMessage(chatId, {
                    text: `❌ Paroles introuvables pour *${title}* de *${artist}*.`
                }, { quoted: msg });
            }

            // Tronquer si trop long
            const maxLen = 3500;
            const truncated = lyrics.length > maxLen
                ? lyrics.substring(0, maxLen) + '\n\n... *(paroles tronquées)*'
                : lyrics;

            const text = `🎵 *${title}*\n👤 *${artist}*\n\n${truncated}`;

            await sock.sendMessage(chatId, { text }, { quoted: msg });
            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } }).catch(() => {});

        } catch (error) {
            console.error('Erreur lyrics:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Impossible de récupérer les paroles. Réessaie plus tard.'
            }, { quoted: msg }).catch(() => {});
        }
    }
};
