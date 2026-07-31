const list = document.getElementById("achievementList");
const title = document.getElementById("gameName");
const alertsToggle = document.getElementById("showAlertsToggle");

function escapeHTML(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Load and save the showAlertsForUnlocked setting
chrome.storage.local.get(["showAlertsForUnlocked"], ({ showAlertsForUnlocked }) => {
    alertsToggle.checked = !!showAlertsForUnlocked;
});

alertsToggle.addEventListener("change", () => {
    chrome.storage.local.set({ showAlertsForUnlocked: alertsToggle.checked });
});

chrome.storage.local.get(["currentSet"], ({ currentSet }) => {
    if (!currentSet) {
        title.textContent = "No Game Loaded";
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";
        emptyState.innerHTML = `
            <div class="empty-icon">🎮</div>
            <div>Open a supported Scratch or TurboWarp game to see achievements.</div>
        `;
        list.appendChild(emptyState);
        return;
    }

    // Render game icon in header if present
    const titleHtml = currentSet.gameIcon
        ? `<img src="${currentSet.gameIcon}" class="game-icon-header" /><span>${escapeHTML(currentSet.gameName)}</span>`
        : `<span>${escapeHTML(currentSet.gameName)}</span>`;
    title.innerHTML = titleHtml;

    const storageKey = currentSet.projectId ? `unlocked_${currentSet.projectId}` : "unlocked";
    
    chrome.storage.local.get([storageKey], (result) => {
        const unlockedList = result[storageKey] || [];
        const achievementsList = Object.entries(currentSet.achievements || {});

        if (achievementsList.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "empty-state";
            emptyState.innerHTML = `
                <div class="empty-icon">🏆</div>
                <div>No achievements defined for this game yet.</div>
            `;
            list.appendChild(emptyState);
            return;
        }

        // Sort achievements by their "order" field
        achievementsList.sort((a, b) => {
            const orderA = a[1].order !== undefined ? a[1].order : 9999;
            const orderB = b[1].order !== undefined ? b[1].order : 9999;
            return orderA - orderB;
        });

        // Calculate and render progress header
        const unlockedCount = achievementsList.filter(([id]) => unlockedList.includes(id)).length;
        const percent = Math.round((unlockedCount / achievementsList.length) * 100);
        
        const progressContainer = document.createElement("div");
        progressContainer.className = "progress-container";
        progressContainer.innerHTML = `
            <div class="progress-info">
                <span>Progress</span>
                <span>${unlockedCount} / ${achievementsList.length} (${percent}%)</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${percent}%"></div>
            </div>
        `;
        list.appendChild(progressContainer);

        for (const [id, achievement] of achievementsList) {
            const isUnlocked = unlockedList.includes(id);
            const div = document.createElement("div");

            div.className = "achievement" + (isUnlocked ? " unlocked" : " locked");

            const badgeContent = achievement.icon
                ? `<img src="${achievement.icon}" class="achievement-icon-image ${isUnlocked ? 'unlocked' : 'locked'}" />`
                : (isUnlocked ? "🏆" : "🔒");

            const deleteBtn = isUnlocked
                ? `<button class="delete-achievement-btn" data-id="${id}" title="Delete achievement progress">×</button>`
                : "";

            div.innerHTML = `
                <div class="achievement-icon-badge">
                    ${badgeContent}
                </div>
                <div class="achievement-details">
                    <div class="name">${achievement.name}</div>
                    <div class="description">${achievement.description || ""}</div>
                </div>
                ${deleteBtn}
            `;

            list.appendChild(div);
        }
    });

    // Handle delete button click events
    list.addEventListener("click", async (e) => {
        if (e.target.classList.contains("delete-achievement-btn")) {
            const id = e.target.getAttribute("data-id");
            if (!id) return;

            const storageKey = currentSet.projectId ? `unlocked_${currentSet.projectId}` : "unlocked";
            chrome.storage.local.get([storageKey], async (result) => {
                let unlocked = result[storageKey] || [];
                unlocked = unlocked.filter(uid => uid !== id);
                await chrome.storage.local.set({ [storageKey]: unlocked });
                window.location.reload();
            });
        }
    });
});