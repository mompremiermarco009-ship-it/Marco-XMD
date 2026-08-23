// utils/superAuth.js – version optimisée
const DEFAULT_SUPER_ADMINS = ["50935622916", "50941131299"];

function isSuperAdmin(senderJid, config = {}) {
    const number = String(senderJid).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');

    // Super-admins définis dans la config (prioritaire)
    if (Array.isArray(config.superAdmins)) {
        return config.superAdmins.some(admin => String(admin).replace(/[^0-9]/g, '') === number);
    }

    // Fallback : liste par défaut
    return DEFAULT_SUPER_ADMINS.includes(number);
}

module.exports = { isSuperAdmin };
