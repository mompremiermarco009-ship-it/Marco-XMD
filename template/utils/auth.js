// utils/auth.js — Autorisations et helpers de groupe

/**
 * Normalise un numéro (enlève @, :, caractères non numériques)
 */
function normalizeNumber(raw) {
    if (!raw) return "";
    const match = String(raw).split('@')[0].split(':')[0];
    return match.replace(/[^0-9]/g, '');
}

/**
 * Récupère le numéro de l'expéditeur d'un message
 */
function getSenderNumber(sock, msg) {
    const sender = msg.key.participant || msg.key.remoteJid || "";
    return normalizeNumber(sender);
}

/**
 * Récupère le JID complet de l'expéditeur
 */
function getSenderJid(sock, msg) {
    return msg.key.participant || msg.key.remoteJid || "";
}

/**
 * Vérifie si l'expéditeur est autorisé (owner, bot lui-même, ou mode public)
 */
function isAuthorized(sock, msg, cfg = {}) {
    if (!msg || !msg.key) return false;
    if (msg.key.fromMe) return true;

    const senderNumber = getSenderNumber(sock, msg);

    // Owner unique
    if (cfg.ownerNumber && senderNumber === normalizeNumber(cfg.ownerNumber)) return true;

    // Plusieurs owners
    if (Array.isArray(cfg.ownerNumbers)) {
        if (cfg.ownerNumbers.some(num => normalizeNumber(num) === senderNumber)) return true;
    }

    // Bot lui-même
    if (sock.user && sock.user.id) {
        const botNumber = normalizeNumber(sock.user.id);
        if (senderNumber === botNumber) return true;
    }

    // Mode public
    if (cfg.publicMode === true) return true;

    return false;
}

/**
 * Vérifie si un membre est admin d'un groupe
 * @returns {Promise<boolean>}
 */
async function isGroupAdmin(sock, groupJid, participantJid) {
    try {
        const meta = await sock.groupMetadata(groupJid);
        const p = meta.participants.find(x => x.id === participantJid);
        if (!p) return false;
        return p.admin === 'admin' || p.admin === 'superadmin';
    } catch {
        return false;
    }
}

/**
 * Vérifie si le bot est admin d'un groupe
 * @returns {Promise<boolean>}
 */
async function isBotAdmin(sock, groupJid) {
    try {
        const meta = await sock.groupMetadata(groupJid);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botLid = sock.user?.lid || '';
        const p = meta.participants.find(x =>
            x.id === botId || x.id === botLid || x.id.includes(sock.user.id.split(':')[0])
        );
        if (!p) return false;
        return p.admin === 'admin' || p.admin === 'superadmin';
    } catch {
        return false;
    }
}

/**
 * Extrait un JID cible depuis une mention, une réponse ou un numéro
 */
function extractTarget(msg, args) {
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    if (ctx?.participant) return ctx.participant;
    if (ctx?.mentionedJid?.length) return ctx.mentionedJid[0];
    if (args?.[0]) {
        const num = normalizeNumber(args[0]);
        if (num.length >= 10) return num + '@s.whatsapp.net';
    }
    return null;
}

module.exports = {
    isAuthorized,
    normalizeNumber,
    getSenderNumber,
    getSenderJid,
    isGroupAdmin,
    isBotAdmin,
    extractTarget
};
