const axios = require('axios');

module.exports = {
    name: 'joke',
    aliases: ['blague', 'drole'],
    category: 'game',
    desc: 'Raconte une blague aléatoire',
    usage: '.joke',

    async execute(sock, msg) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';

        try {
            await sock.sendMessage(jid, { react: { text: '😂', key: msg.key } });

            // Blagues en français (pas d'API fiable en FR)
            const jokes = [
                "Pourquoi les plongeurs plongent-ils toujours en arrière ?\n\nParce que sinon, ils tombent dans le bateau ! 🚤",
                "Qu'est-ce qu'un chat qui s'appelle Claude ?\n\nUn chat-claude ! 🐱",
                "Pourquoi les pirates portent-ils des lunettes ?\n\nPour mieux voir les bateaux ! 🏴‍☠️",
                "Comment appelle-t-on un chien qui a perdu la queue ?\n\nUn chien tronqué ! 🐕",
                "Que dit une maman kangourou à son petit ?\n\nReste dans la poche ! 🦘",
                "Pourquoi les girafes ont-elles un long cou ?\n\nParce que leurs pieds sentent mauvais ! 🦒",
                "Qu'est-ce qu'un canif ?\n\nUn petit fien ! 🐶",
                "Pourquoi l'épouvantail a reçu un prix ?\n\nParce qu'il était exceptionnel dans son domaine ! 🌾",
                "Comment appelle-t-on un boomerang qui ne revient pas ?\n\nUn bâton ! 🪵",
                "Que fait une fraise sur un cheval ?\n\nTagada tagada ! 🍓",
                "Pourquoi les maths sont tristes ?\n\nParce qu'elles ont trop de problèmes ! 📐",
                "Comment fait-on pour rendre un ver de terre marrant ?\n\nOn le fait rire aux éclats ! 🐛"
            ];

            const joke = jokes[Math.floor(Math.random() * jokes.length)];

            const text = `╔════════════════════════╗\n` +
                         `║   😂  𝐁𝐋𝐀𝐆𝐔𝐄\n` +
                         `╚════════════════════════╝\n\n` +
                         `┃  ${joke}\n\n` +
                         `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`;

            await sock.sendMessage(jid, { text }, { quoted: msg });
        } catch (err) {
            console.error('Erreur joke:', err.message);
            await sock.sendMessage(jid, { text: '❌ Erreur.' }, { quoted: msg });
        }
    }
};
