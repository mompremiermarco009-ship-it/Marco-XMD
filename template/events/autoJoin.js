const fs = require('fs');
const path = require('path');

module.exports = async function autoJoin(sock, myJid) {
    if (!sock.isReady) return;

    const cfgPath = path.join(__dirname, "..", "config.json");
    const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));

    // Groupes
    const groups = cfg.autoJoinGroup || [];
    for (const link of groups) {
        const code = typeof link === 'string' ? link.split('https://chat.whatsapp.com/')[1] : null;
        if (!code) continue;
        try { await sock.groupAcceptInvite(code); console.log(`✅ Groupe rejoint : ${code}`); } catch {}
    }

    // Chaînes
    const channels = cfg.autoJoinChannels || [];
    for (const jid of channels) {
        if (typeof jid === 'string' && jid.includes('@newsletter')) {
            try { if (typeof sock.newsletterFollow === 'function') await sock.newsletterFollow(jid); } catch {}
        }
    }
};
