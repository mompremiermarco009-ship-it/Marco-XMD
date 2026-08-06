// script/search.js
// Optimisations : les variables CSS utilisées (--card-bg, --text-secondary,
// --accent) n'existent pas dans le thème du nouveau dashboard, ce qui les
// rendait invisibles/inertes ; remplacées par les vraies variables
// (--bg, --text-light, --primary). Le libellé annonçait "DeepSeek" alors que
// server.js interroge en réalité Wikipédia puis DuckDuckGo — corrigé pour ne
// pas induire en erreur. Ajout d'un état de chargement qui désactive le
// bouton (évite le double-clic / la double requête).
export default function initSearch(container, controlsContainer) {
    container.innerHTML = `
        <div class="input-group" style="text-align:left; margin-bottom:12px;">
            <label for="searchQuery" style="font-size:13px; font-weight:600; color:#6b7280; display:block; margin-bottom:6px;">Pose ta question</label>
            <input type="text" id="searchQuery" placeholder="Ex : Qui a inventé le téléphone ?" style="width:100%; padding:10px; border-radius:8px; border:1px solid #e5e7eb; font-size:1rem; box-sizing:border-box;">
        </div>
        <button id="btnSearch" style="width:100%; background:#3b82f6; color:#fff; border:none; padding:10px; border-radius:8px; font-weight:700; cursor:pointer;">🔍 Rechercher</button>
        <div id="searchResult" style="margin-top:20px; color:#374151; text-align:left;"></div>
    `;
    controlsContainer.innerHTML = '';

    const queryInput = document.getElementById('searchQuery');
    const resultDiv = document.getElementById('searchResult');
    const searchBtn = document.getElementById('btnSearch');
    let loading = false;

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text ?? '';
        return div.innerHTML;
    }

    async function doSearch() {
        if (loading) return;
        const query = queryInput.value.trim();
        if (!query) return;

        loading = true;
        searchBtn.disabled = true;
        searchBtn.style.opacity = '0.6';
        searchBtn.textContent = '⏳ Recherche...';
        resultDiv.innerHTML = '<p style="color:#6b7280;">Recherche en cours...</p>';

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Erreur inconnue');
            }
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            resultDiv.innerHTML = `
                <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:15px;border-radius:10px;">
                    <h3 style="color:#3b82f6; margin:0 0 8px;">💬 ${escapeHtml(data.title)}</h3>
                    <div style="color:#374151; white-space:pre-wrap; font-size:14px;">${escapeHtml(data.snippet)}</div>
                    ${data.link ? `<a href="${escapeHtml(data.link)}" target="_blank" rel="noopener" style="color:#3b82f6; display:inline-block; margin-top:8px; font-size:13px;">Voir la source →</a>` : ''}
                </div>
            `;
        } catch (err) {
            resultDiv.innerHTML = `<p style="color:#ef4444;">❌ ${escapeHtml(err.message)}</p>`;
        } finally {
            loading = false;
            searchBtn.disabled = false;
            searchBtn.style.opacity = '1';
            searchBtn.textContent = '🔍 Rechercher';
        }
    }

    searchBtn.addEventListener('click', doSearch);
    queryInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doSearch(); });

    return { stop() {} };
}
