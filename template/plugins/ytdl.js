const ytdl = require('@distube/ytdl-core');
const yts = require('yt-search');

module.exports = {
    name: "ytdl",
    aliases: ["youtube", "yt"],
    desc: "Télécharge une vidéo ou audio YouTube",
    usage: ".ytdl <url/recherche>",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const query = args.join(' ');
        if (!query) return sock.sendMessage(jid, { text: '❌ Donnez un lien ou une recherche.' }, { quoted: msg });

        let url = query;
        if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
            const results = await yts(query);
            if (results.videos.length > 0) {
                url = results.videos[0].url;
            } else {
                return sock.sendMessage(jid, { text: '❌ Aucun résultat YouTube.' }, { quoted: msg });
            }
        }

        try {
            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title;
            const stream = ytdl(url, { quality: 'highest' });

            // Envoyer la vidéo
            await sock.sendMessage(jid, { video: stream, caption: title }, { quoted: msg });
        } catch (err) {
            console.error('Erreur ytdl:', err);
            await sock.sendMessage(jid, { text: '❌ Impossible de télécharger la vidéo.' }, { quoted: msg });
        }
    }
};
