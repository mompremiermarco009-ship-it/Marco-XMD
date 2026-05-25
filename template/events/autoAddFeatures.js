const addCanalButton = require('./chanelbouton');
const createFakeQuote = require('./fakequote');

module.exports = {
    name: 'connection.update',
    async execute(sock, update, { plugins }) {
        // On ne patche qu'une seule fois, quand la connexion est ouverte
        if (update.connection === 'open') {
            if (sock._autoFeaturesPatched) return;
            sock._autoFeaturesPatched = true;

            // Sauvegarde de la méthode d'envoi originale
            const originalSend = sock.sendMessage.bind(sock);

            // Surcharge de sendMessage
            sock.sendMessage = async (jid, content, options = {}) => {
                // Si le contenu est une simple chaîne, on le transforme en objet
                if (typeof content === 'string') {
                    content = { text: content };
                }

                // Exclusion globale : si la propriété __noAutoFeatures est vraie, on laisse passer
                if (content.__noAutoFeatures) {
                    return originalSend(jid, content, options);
                }

                // 1. Ajout du bouton chaîne (newsletter), sauf s'il existe déjà ou si __noCanal est vrai
                if (!content.__noCanal && !content.contextInfo?.forwardedNewsletterMessageInfo) {
                    content = addCanalButton(content);
                }

                // 2. Ajout de la fausse citation, sauf si une citation est déjà fournie ou si __noFakeQuote est vrai
                if (!options.quoted && !content.__noFakeQuote) {
                    options.quoted = createFakeQuote();
                }

                // Envoi du message modifié
                return originalSend(jid, content, options);
            };
        }
    }
};
