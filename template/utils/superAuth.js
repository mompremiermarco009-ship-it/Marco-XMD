// utils/superAuth.js
const SUPER_ADMINS = ["50935622916", "50941131299"];

function isSuperAdmin(senderJid) {
    const number = senderJid.replace(/[^0-9]/g, '');
    return SUPER_ADMINS.includes(number);
}

module.exports = { isSuperAdmin };
