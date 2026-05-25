const config = require("../config.json");
const { isAuthorized, normalizeNumber } = require("../utils/auth");

async function kick(sock, msg, args) {
    const jid = msg.key.remoteJid;

    // Vérification d'autorisation (owner ou bot)
    if (!isAuthorized(sock, msg)) {
        return sock.sendMessage(jid, {
            text: "❌owner seulement"
        }, { quoted: msg });
    }

    // Vérifier que c'est un groupe
    if (!jid.endsWith("@g.us")) {
        return sock.sendMessage(jid, { text: "❌ Cette commande ne peut être utilisée que dans un groupe." }, { quoted: msg });
    }

    // Identifier la cible
    let targetJid = null;

    // 1. Si le message est une réponse (quote), on prend l'expéditeur du message cité
    if (msg.message.extendedTextMessage?.contextInfo?.participant) {
        targetJid = msg.message.extendedTextMessage.contextInfo.participant;
    }
    // 2. Sinon, si args[0] est fourni, on essaie de le traiter comme un numéro ou une mention
    else if (args.length > 0) {
        // Vérifier si c'est une mention (le texte contient @ et on a un tableau mentionedJid)
        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentioned && mentioned.length > 0) {
            targetJid = mentioned[0];
        } else {
            // Sinon, on suppose que args[0] est un numéro (avec ou sans indicatif)
            let rawNumber = args[0].replace(/\D/g, '');
            if (rawNumber) {
                targetJid = rawNumber + "@s.whatsapp.net";
            }
        }
    }

    if (!targetJid) {
        return sock.sendMessage(jid, {
            text: "❌ Veuillez mentionner, répondre à un message ou fournir un numéro valide."
        }, { quoted: msg });
    }

    try {
        // Vérifier que la cible est bien dans le groupe
        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants.map(p => p.id);
        if (!participants.includes(targetJid)) {
            return sock.sendMessage(jid, { text: "❌ Cette personne n'est pas dans le groupe." }, { quoted: msg });
        }

        // Récupérer les informations du participant ciblé
        const targetParticipant = groupMetadata.participants.find(p => p.id === targetJid);
        const targetNumber = normalizeNumber(targetJid);
        const owners = (config.owner || []).map(n => normalizeNumber(n));
        const botNumber = normalizeNumber(sock.user.id);
        const isAdmin = targetParticipant?.admin !== null;
        const isOwner = owners.includes(targetNumber);
        const isBot = targetNumber === botNumber;

        // Protections : ne pas kick un admin, un owner ou le bot
        if (isAdmin) {
            return sock.sendMessage(jid, { text: "🚫 Impossible d'expulser un administrateur." }, { quoted: msg });
        }
        if (isOwner) {
            return sock.sendMessage(jid, { text: "🚫 Impossible d'expulser le propriétaire du bot." }, { quoted: msg });
        }
        if (isBot) {
            return sock.sendMessage(jid, { text: "🚫 Je ne peux pas m'auto-expulser !" }, { quoted: msg });
        }

        // Exécution du kick
        await sock.groupParticipantsUpdate(jid, [targetJid], "remove");
        await sock.sendMessage(jid, {
            text: `✅ Utilisateur @${targetNumber} expulsé du groupe.`,
            mentions: [targetJid]
        }, { quoted: msg });

    } catch (e) {
        console.error(e);
        await sock.sendMessage(jid, { text: "❌ Erreur lors de l'expulsion." }, { quoted: msg });
    }
}

module.exports = {
    name: "kick",
    alias: ["expulser", "remove"],
    execute: kick
};
