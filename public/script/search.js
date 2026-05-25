export default function initSearch(container, controlsContainer) {
    container.innerHTML = `
        <div class="input-group">
            <label for="searchQuery">Pose ta question à DeepSeek</label>
            <input type="text" id="searchQuery" placeholder="Ex : Qui a inventé le téléphone ?">
        </div>
        <button class="btn-primary" id="btnSearch">🤖 Demander à DeepSeek</button>
        <div id="searchResult" style="margin-top:20px; color:var(--text-secondary); text-align:left;"></div>
    `;
    controlsContainer.innerHTML = '';

    const queryInput = document.getElementById('searchQuery');
    const resultDiv = document.getElementById('searchResult');
    const searchBtn = document.getElementById('btnSearch');

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async function doSearch() {
        const query = queryInput.value.trim();
        if (!query) return;
        resultDiv.innerHTML = '<div class="loading-spinner"></div> DeepSeek réfléchit...';

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Erreur inconnue');
            }
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const html = `
                <div style="background:var(--card-bg);padding:15px;border-radius:8px;margin-top:10px;">
                    <h3 style="color:var(--primary);">💬 ${escapeHtml(data.title)}</h3>
                    <div style="color:var(--text-secondary); white-space:pre-wrap;">${escapeHtml(data.snippet)}</div>
                    ${data.link ? `<a href="${escapeHtml(data.link)}" target="_blank" style="color:var(--accent);">Source</a>` : ""}
                </div>
            `;
            resultDiv.innerHTML = html;
        } catch (err) {
            resultDiv.innerHTML = `<p style="color:red;">❌ ${escapeHtml(err.message)}</p>`;
        }
    }

    searchBtn.addEventListener('click', doSearch);
    queryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doSearch();
    });

    return { stop() {} };
}
