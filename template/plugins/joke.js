// plugins/joke.js
const fetch = global.fetch || require('node-fetch');

module.exports = {
    name: 'joke',
    aliases: ['blague', 'drole', 'humour'],
    description: 'Affiche une blague aléatoire en français',
    usage: '.joke',

    async execute(sock, message, args, { config }) {
        const jid = message.key.remoteJid;

        try {
            const response = await fetch('https://v2.jokeapi.dev/joke/Any?lang=fr&type=single,twopart');
            const data = await response.json();

            if (!data || data.error) {
                return sock.sendMessage(jid, { text: '❌ Impossible de récupérer une blague pour le moment.' }, { quoted: message });
            }

            let jokeText = '';
            if (data.type === 'single') {
                jokeText = `😂 *Blague :*\n${data.joke}`;
            } else if (data.type === 'twopart') {
                jokeText = `😂 *Blague :*\n- ${data.setup}\n\n... ${data.delivery}`;
            } else {
                jokeText = `😂 *Blague :*\n${data.joke || 'Aucune blague trouvée.'}`;
            }

            await sock.sendMessage(jid, { text: jokeText }, { quoted: message });

        } catch (error) {
            console.error('Erreur plugin joke:', error);
            await sock.sendMessage(jid, { text: '⚠️ Une erreur est survenue lors de la récupération de la blague.' }, { quoted: message });
        }
    }
};
