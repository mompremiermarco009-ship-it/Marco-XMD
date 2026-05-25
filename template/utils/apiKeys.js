const fs = require('fs');
const path = require('path');

function loadApiKeys() {
    // Chemin vers apiKeys.json dans le dossier racine de la session (template ou sessions/<num>)
    const apiKeysPath = path.join(__dirname, '..', 'apiKeys.json');
    try {
        if (!fs.existsSync(apiKeysPath)) {
            console.warn('⚠️ apiKeys.json introuvable à', apiKeysPath);
            return {};
        }
        return JSON.parse(fs.readFileSync(apiKeysPath, 'utf-8'));
    } catch (err) {
        console.error('❌ Erreur lecture apiKeys.json:', err.message);
        return {};
    }
}

module.exports = { loadApiKeys };
