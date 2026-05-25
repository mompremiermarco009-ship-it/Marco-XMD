// plugins/weather.js
const axios = require('axios');

module.exports = {
    name: "weather",
    aliases: ["meteo", "wttr"],
    desc: "Affiche la météo d'une ville",
    usage: ".meteo <ville>",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const city = args.join(' ');
        if (!city) return sock.sendMessage(jid, { text: '❌ Donnez une ville.' }, { quoted: msg });
        try {
            const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=%C+%t+%w+%h`);
            await sock.sendMessage(jid, { text: `🌤️ Météo *${city}* :\n${data}` }, { quoted: msg });
        } catch (e) {
            await sock.sendMessage(jid, { text: '❌ Erreur météo.' }, { quoted: msg });
        }
    }
};
