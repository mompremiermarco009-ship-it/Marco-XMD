const fs = require('fs');
const path = require('path');

const handleEvents = (sock, saveCreds, commands) => {
    const eventsPath = __dirname;

    fs.readdirSync(eventsPath).forEach(file => {
        if (file.endsWith('.js') && file !== 'index.js') {
            try {
                const event = require(path.join(eventsPath, file));

                if (typeof event === 'function') {
                    event(sock, saveCreds, commands);
                }

            } catch (err) {
                console.error(`❌ Erreur dans ${file}:`, err.message);
            }
        }
    });
};

module.exports = { handleEvents };
