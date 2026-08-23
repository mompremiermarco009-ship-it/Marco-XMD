// plugins/groups.js - Liste tous les groupes du bot
module.exports = {
    name: "groups",
    aliases: ["groupes", "listgroups", "grouplist"],
    category: "general",
    desc: "Liste tous les groupes où le bot est membre",
    usage: ".groups",
    async execute(sock, msg, args, cmd) {
        const jid = msg.key.remoteJid;

        try {
            await sock.sendMessage(jid, { react: { text: '🔍', key: msg.key } });

            const groups = await sock.groupFetchAllParticipating();
            const groupList = Object.values(groups);

            if (groupList.length === 0) {
                return sock.sendMessage(jid, {
                    text: "❌ Le bot n'est dans aucun groupe pour le moment.\n\n> Powered by ©Mr Marco"
                }, { quoted: msg });
            }

            let text = "╭━━━〔 📚 GROUPES 〕━━━╮\n";
            text += `┃ Nombre total : ${groupList.length}\n`;
            text += "╰━━━━━━━━━━━━━━━━━━╯\n\n";

            for (let i = 0; i < groupList.length; i++) {
                const g = groupList[i];
                const participantsCount = g.participants?.length || 0;
                text += `*${i + 1}. ${g.subject || "Sans nom"}*\n`;
                text += `   🆔 JID : \`${g.id}\`\n`;
                text += `   👥 Participants : ${participantsCount}\n\n`;

                if (text.length > 3500) {
                    await sock.sendMessage(jid, { text }, { quoted: msg });
                    text = "";
                    await new Promise(r => setTimeout(r, 500));
                }
            }

            if (text.trim().length > 0) {
                text += "> Powered by ©Mr Marco";
                await sock.sendMessage(jid, { text }, { quoted: msg });
            }
        } catch (err) {
            console.error("Erreur plugin groups:", err);
            await sock.sendMessage(jid, {
                text: "❌ Une erreur est survenue lors de la récupération des groupes.\n> Powered by ©Mr Marco"
            }, { quoted: msg });
        }
    }
};
