const { isAuthorized, normalizeNumber } = require("../utils/auth");
const config = require("../config.json");

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

        // Vérifier si la session est déjà active
        const sessionsMap = global.sessionsMap;
        if (sessionsMap && sessionsMap.has(phoneNumber)) {
            const existingSock = sessionsMap.get(phoneNumber);
            if (existingSock.isReady) {
                return sock.sendMessage(jid, { text: `⚠️ La session *${phoneNumber}* est déjà connectée et active.` }, { quoted: msg });
            }
        }

        await sock.sendMessage(jid, { text: `🔄 Génération du code pour *${phoneNumber}*...` }, { quoted: msg });

        const startBotFunc = global.startBotFunc;
        if (!startBotFunc) {
            return sock.sendMessage(jid, { text: "❌ Fonction de pairing indisponible." }, { quoted: msg });
        }

        try {
            let targetSock = await startBotFunc(phoneNumber);
            await targetSock._pairingReadyPromise;
            await new Promise(r => setTimeout(r, 3000));

            let code;
            try {
                code = await targetSock.requestPairingCode(phoneNumber, "MARCOXMD");
            } catch {
                code = await targetSock.requestPairingCode(phoneNumber, undefined);
            }

            await sock.sendMessage(jid, {
                text: `✅ *PAIRING*\n📱 Numéro : ${phoneNumber}\n🔑 Code : *${code}*\n\n_Entrez ce code dans WhatsApp > Appareils connectés > Connecter un appareil._`
            }, { quoted: msg });
        } catch (err) {
            console.error("Erreur pairing:", err);
            await sock.sendMessage(jid, { text: `❌ Échec : ${err.message}` }, { quoted: msg });
        }
    }
};
