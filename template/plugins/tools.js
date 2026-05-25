const axios = require('axios');

module.exports = {
    name: "tools",
    aliases: ["util"],
    desc: "Divers outils : image, météo, encyclopédie, traduction",
    usage: ".tools <commande> [args]\n- img <recherche>\n- meteo <ville>\n- wiki <recherche>\n- trad <langue> <texte>",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const sub = args[0]?.toLowerCase();
        if (!sub) return sock.sendMessage(jid, { text: this.usage }, { quoted: msg });

        switch(sub) {
            case 'img': {
                const query = args.slice(1).join(' ');
                if (!query) return sock.sendMessage(jid, { text: '❌ Donnez une recherche.' }, { quoted: msg });
                try {
                    const { data } = await axios.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=DEMO_ACCESS_KEY`);
                    const photo = data.results?.[0];
                    if (photo) {
                        await sock.sendMessage(jid, { image: { url: photo.urls.regular } }, { quoted: msg });
                    } else {
                        await sock.sendMessage(jid, { text: '❌ Aucune image trouvée.' }, { quoted: msg });
                    }
                } catch (e) {
                    await sock.sendMessage(jid, { text: '❌ Erreur recherche image.' }, { quoted: msg });
                }
                break;
            }
            case 'meteo': {
                const city = args.slice(1).join(' ');
                if (!city) return sock.sendMessage(jid, { text: '❌ Ville requise.' }, { quoted: msg });
                try {
                    const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=%C+%t`);
                    await sock.sendMessage(jid, { text: `🌤️ ${city} : ${data}` }, { quoted: msg });
                } catch (e) {
                    await sock.sendMessage(jid, { text: '❌ Erreur météo.' }, { quoted: msg });
                }
                break;
            }
            case 'wiki': {
                const query = args.slice(1).join(' ');
                if (!query) return sock.sendMessage(jid, { text: '❌ Recherche requise.' }, { quoted: msg });
                try {
                    const { data } = await axios.get(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
                    if (data.extract) {
                        await sock.sendMessage(jid, { text: `📚 ${data.title}\n${data.extract.substring(0, 500)}` }, { quoted: msg });
                    } else {
                        await sock.sendMessage(jid, { text: '❌ Pas de résultat.' }, { quoted: msg });
                    }
                } catch (e) {
                    await sock.sendMessage(jid, { text: '❌ Erreur Wikipedia.' }, { quoted: msg });
                }
                break;
            }
            case 'trad': {
                const lang = args[1];
                const text = args.slice(2).join(' ');
                if (!lang || !text) return sock.sendMessage(jid, { text: '❌ Usage : .tools trad <langue> <texte>' }, { quoted: msg });
                try {
                    const { data } = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=fr|${lang}`);
                    if (data.responseData.translatedText) {
                        await sock.sendMessage(jid, { text: `🔤 ${data.responseData.translatedText}` }, { quoted: msg });
                    } else {
                        await sock.sendMessage(jid, { text: '❌ Traduction échouée.' }, { quoted: msg });
                    }
                } catch (e) {
                    await sock.sendMessage(jid, { text: '❌ Erreur traduction.' }, { quoted: msg });
                }
                break;
            }
            default:
                await sock.sendMessage(jid, { text: '❌ Commande inconnue. Utilisez img, meteo, wiki ou trad.' }, { quoted: msg });
        }
    }
};
