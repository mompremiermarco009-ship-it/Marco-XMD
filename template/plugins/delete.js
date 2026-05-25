// plugins/delete.js
module.exports = {
    name: "delete",
    aliases: ["del", "purge"],
    desc: "Supprime des messages récents (admin seulement)",
    usage: ".del <nombre> ou .del @user <nombre>",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith("@g.us")) {
            return sock.sendMessage(jid, { text: "❌ Cette commande ne fonctionne que dans les groupes." }, { quoted: msg });
        }

        // Vérifier que l'utilisateur est admin
        const sender = msg.key.participant || msg.key.remoteJid;
        try {
            const metadata = await sock.groupMetadata(jid);
            const participants = metadata.participants;
            const senderInfo = participants.find(p => p.id === sender);
            const isAdmin = senderInfo && (senderInfo.admin === "admin" || senderInfo.admin === "superadmin");
            if (!isAdmin) {
                return sock.sendMessage(jid, { text: "❌ Seuls les administrateurs peuvent supprimer des messages." }, { quoted: msg });
            }
        } catch (err) {
            return sock.sendMessage(jid, { text: "❌ Impossible de vérifier les droits d'administration." }, { quoted: msg });
        }

        // Récupérer le nombre de messages à supprimer
        let count = 1; // par défaut 1 message
        let targetUser = null;

        // Détection d'une mention
        const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentions && mentions.length > 0) {
            targetUser = mentions[0];
        }

        // Nombre passé en argument
        if (args.length > 0) {
            const maybeNum = parseInt(args[0], 10);
            if (!isNaN(maybeNum) && maybeNum > 0) {
                count = Math.min(maybeNum, 50); // limite à 50
            }
        }

        // Si pas de cible et pas de nombre, effacer le dernier message du groupe
        if (!targetUser && count === 1 && args.length === 0) {
            // Supprimer le message auquel on répond (si reply)
            const repliedId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
            const repliedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

            if (repliedId && repliedParticipant) {
                try {
                    await sock.sendMessage(jid, {
                        delete: {
                            remoteJid: jid,
                            fromMe: false,
                            id: repliedId,
                            participant: repliedParticipant
                        }
                    });
                    return; // message supprimé, on quitte
                } catch (e) {
                    return sock.sendMessage(jid, { text: "❌ Échec de la suppression du message ciblé." }, { quoted: msg });
                }
            }

            // Sinon, expliquer l'usage
            return sock.sendMessage(jid, {
                text: "❌ Spécifiez un nombre de messages à supprimer.\nExemple : .del 5\nOu répondez à un message avec .del"
            }, { quoted: msg });
        }

        // Récupération des messages récents (via le store interne de Baileys)
        // Comme nous n'avons pas de store persistant, on va informer que cette fonctionnalité est limitée
        await sock.sendMessage(jid, {
            text: `ℹ️ La suppression de ${count} message(s) ${targetUser ? 'de @' + targetUser.split('@')[0] : 'du groupe'} nécessite un stockage local des messages.\nPour l'instant, utilisez .del en répondant à un message spécifique.`,
            mentions: targetUser ? [targetUser] : []
        }, { quoted: msg });
    }
};
