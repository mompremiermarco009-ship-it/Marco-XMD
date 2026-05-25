const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config.json');

/**
 * Charge la configuration depuis le fichier JSON
 * @returns {object}
 */
const loadConfig = () => {
    try {
        const data = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Erreur chargement config:", err);
        return {};
    }
};

/**
 * Sauvegarde la configuration dans le fichier JSON
 * @param {object} config 
 */
const saveConfig = (config) => {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error("Erreur sauvegarde config:", err);
    }
};

module.exports = {
    loadConfig,
    saveConfig
};
