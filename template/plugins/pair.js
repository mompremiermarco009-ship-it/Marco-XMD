//const { isAuthorized, normalizeNumber } = require("../utils/auth");
const config = require("../config.json");
const axios = require("axios");

module.exports = {
    name: "pair",
    alias: ["connect", "addbot"],
    category: "owner",
    desc: "Générer un code de couplage pour un nouveau bot",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;

        if (!isAuthorized(sock, msg, config)) {
            return sock.sendMessage(jid, { text: "❌ Commande réservée au propriétaire." }, { quoted: msg });
        }

        if (!args[0]) {
            return sock.sendMessage(jid, { text: `❌ Utilisation : *${config.prefix}pair <numéro>* (ex: ${config.prefix}pair 50941131299)` }, { quoted: msg });
        }

        const phoneNumber = normalizeNumber(args[0]);
        
        await sock.sendMessage(jid, { text: `🔄 Génération du code pour *${phoneNumber}*...` }, { quoted: msg });

        try {
            // On utilise l'API interne du serveur Express
            const port = process.env.PORT || 10000;
            const response = await axios.get(`http://localhost:${port}/pair?number=${phoneNumber}`);
            
            if (response.data && response.data.code) {
                const code = response.data.code;
                const message = `✅ *MARCO-XMD PAIRING*\n\n` +
                                `📱 Numéro : ${phoneNumber}\n` +
                                `🔑 Code : *${code}*\n\n` +
                                `_Entrez ce code sur votre WhatsApp (Appareils connectés > Connecter un appareil > Se connecter avec le numéro de téléphone)_`;
                
                await sock.sendMessage(jid, { text: message }, { quoted: msg });
            } else {
                throw new Error("Aucun code reçu du serveur.");
            }
        } catch (err) {
            console.error("Erreur pairing:", err.message);
            await sock.sendMessage(jid, { 
                text: `❌ Erreur lors de la génération du code.\n\n_Détails: ${err.response?.data?.error || err.message}_` 
            }, { quoted: msg });
        }
    }
};
