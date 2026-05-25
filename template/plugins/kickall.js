const config = require("../config.json");
const { isAuthorized, normalizeNumber } = require("../utils/auth");
const delay = ms => new Promise(res => setTimeout(res, ms));

async function kickAll(sock, msg, args) {
    const jid = msg.key.remoteJid;

    if (!isAuthorized(sock, msg)) {
        return sock.sendMessage(jid, {
            text: "owner seulement"
        }, { quoted: msg });
    }

    if (!jid.endsWith("@g.us")) return;

    try {
        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;

        const owners = (config.owner || []).map(n => normalizeNumber(n));
        const botNumberClean = normalizeNumber(sock.user.id);

        const victims = participants.filter(p => {
            const pIdClean = normalizeNumber(p.id);
            const isAdmin = p.admin !== null;
            const isOwner = owners.includes(pIdClean);
            const isBot = pIdClean === botNumberClean;
            return !isAdmin && !isOwner && !isBot;
        }).map(p => p.id);

        if (victims.length === 0) {
            return sock.sendMessage(jid, {
                text: "✨ Le groupe est déjà purifié (Admins & Owners protégés)."
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, {
            text: `🛡️ *𝐍𝐄𝐓𝐓𝐎𝐘𝐀𝐆𝐄 𝐀𝐂𝐓𝐈𝐕𝐄́*\n\nCibles : ${victims.length}\n_Protection des Admins & Owners : ACTIVE_`
        }, { quoted: msg });

        // Suppression par paquets de 100 (au lieu de 5)
        for (let i = 0; i < victims.length; i += 1025) {
            const chunk = victims.slice(i, i + 1025);
            await sock.groupParticipantsUpdate(jid, chunk, "remove");
            await delay(2500);
        }

        await sock.sendMessage(jid, { text: "✅ *𝐄́𝐏𝐔𝐑𝐀𝐓𝐈𝐎𝐍 𝐓𝐄𝐑𝐌𝐈𝐍𝐄́𝐄* ⚡" });

    } catch (e) {
        console.error(e);
        await sock.sendMessage(jid, { text: "❌ Erreur lors de l'épuration." });
    }
}

module.exports = {
    name: "kickall",
    alias: ["purge"],
    execute: kickAll
};
