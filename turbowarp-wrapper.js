// Append the styling to head
const style = document.createElement("style");
style.textContent = `
    .scratch-achievements-container {
        position: fixed;
        left: 24px;
        bottom: 24px;
        display: flex;
        flex-direction: column-reverse;
        gap: 12px;
        z-index: 9999999;
        pointer-events: none;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }
    .scratch-achievements-toast {
        display: flex;
        align-items: center;
        gap: 16px;
        min-width: 320px;
        max-width: 420px;
        background: rgba(28, 28, 30, 0.9);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 16px 20px;
        color: #ffffff;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), 
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
        transform: translateY(40px) scale(0.95);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: auto;
    }
    .scratch-achievements-toast.show {
        transform: translateY(0) scale(1);
        opacity: 1;
    }
    .scratch-achievements-toast.unlock {
        border-color: rgba(255, 215, 0, 0.35);
        box-shadow: 0 12px 32px rgba(255, 215, 0, 0.1), 
                    0 8px 24px rgba(0, 0, 0, 0.4), 
                    inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }
    .scratch-achievements-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.08);
        font-size: 24px;
        flex-shrink: 0;
        overflow: hidden;
    }
    .scratch-achievements-toast.unlock .scratch-achievements-icon-wrapper {
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2));
        color: #ffd700;
        filter: drop-shadow(0 2px 6px rgba(255, 215, 0, 0.3));
        animation: scratch-achievements-bounce 1s infinite alternate;
    }
    .scratch-achievements-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex-grow: 1;
    }
    .scratch-achievements-toast-type {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        color: #8e8e93;
    }
    .scratch-achievements-toast.unlock .scratch-achievements-toast-type {
        color: #ffd700;
    }
    .scratch-achievements-toast-name {
        font-size: 15px;
        font-weight: 700;
        color: #ffffff;
    }
    .scratch-achievements-toast-desc {
        font-size: 12px;
        color: #c7c7cc;
        line-height: 1.4;
    }
    @keyframes scratch-achievements-bounce {
        from { transform: translateY(0); }
        to { transform: translateY(-3px); }
    }
`;
document.head.appendChild(style);

let toastContainer = null;

function getFullscreenElement() {
    return document.fullscreenElement
        || document.webkitFullscreenElement
        || document.mozFullScreenElement
        || document.msFullscreenElement
        || null;
}

function ensureToastContainerParent() {
    if (!toastContainer) return;
    const target = getFullscreenElement() || document.body;
    if (toastContainer.parentElement !== target) {
        target.appendChild(toastContainer);
    }
}

function getToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.className = "scratch-achievements-container";
        document.body.appendChild(toastContainer);
        document.addEventListener("fullscreenchange", ensureToastContainerParent);
        document.addEventListener("webkitfullscreenchange", ensureToastContainerParent);
    }
    ensureToastContainerParent();
    return toastContainer;
}

function escapeHTML(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showSetStatusModal(message, isSuccess = false, iconUrl = null) {
    const container = getToastContainer();
    const toast = document.createElement("div");
    toast.className = "scratch-achievements-toast";
    
    let iconContent = isSuccess ? "🎮" : "❌";
    if (iconUrl) {
        iconContent = `<img src="${iconUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />`;
    }
    
    toast.innerHTML = `
        <div class="scratch-achievements-icon-wrapper">
            ${iconContent}
        </div>
        <div class="scratch-achievements-details">
            <div class="scratch-achievements-toast-type">Scratch Achievements</div>
            <div class="scratch-achievements-toast-desc">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Trigger transition
    requestAnimationFrame(() => {
        toast.classList.add("show");
    });
    
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function showAchievementModal(achievement) {
    const container = getToastContainer();
    const toast = document.createElement("div");
    toast.className = "scratch-achievements-toast unlock";
    
    const iconContent = achievement.icon 
        ? `<img src="${achievement.icon}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />` 
        : "🏆";
    
    toast.innerHTML = `
        <div class="scratch-achievements-icon-wrapper">${iconContent}</div>
        <div class="scratch-achievements-details">
            <div class="scratch-achievements-toast-type">Achievement Unlocked!</div>
            <div class="scratch-achievements-toast-name">${escapeHTML(achievement.name)}</div>
            ${achievement.description ? `<div class="scratch-achievements-toast-desc">${escapeHTML(achievement.description)}</div>` : ""}
        </div>
    `;
    
    container.appendChild(toast);
    
    // Trigger transition
    requestAnimationFrame(() => {
        toast.classList.add("show");
    });
    
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

let activeEngine = null;
let activeSet = null;
let activeUnlocked = [];
let currentShowAlerts = false;
const sessionPopupsShown = new Set();

function startEngine(set, unlocked) {
    activeSet = set;
    activeUnlocked = unlocked;

    // Clean up any previously active engine instance
    if (activeEngine) {
        console.log("Stopping previous AchievementEngine instance.");
        activeEngine.stop();
        activeEngine = null;
    }

    if (!window.vm) {
        console.warn("Scratch VM is not ready yet. Waiting for it...");
        const checkInterval = setInterval(() => {
            if (window.vm) {
                clearInterval(checkInterval);
                startEngine(set, unlocked);
            }
        }, 100);
        return;
    }

    try {
        console.log("Initializing AchievementEngine for project:", set.gameName);
        const engineUnlocked = currentShowAlerts ? [] : unlocked;
        activeEngine = new window.AchievementEngine(window.vm, set.achievements, {
            unlocked: engineUnlocked,
            onUnlock: (id, achievement) => {
                const wasCollected = activeUnlocked.includes(id);
                const shouldShowPopup = !wasCollected
                    || (currentShowAlerts && !sessionPopupsShown.has(id));

                if (shouldShowPopup) {
                    if (wasCollected) sessionPopupsShown.add(id);
                    showAchievementModal(achievement);
                }
                window.postMessage({
                    type: "SCRATCH_ACHIEVEMENT_UNLOCKED",
                    achievementId: id,
                    achievement: achievement
                }, "*");
            }
        });
        activeEngine.start();
    } catch (error) {
        console.error("Failed to start AchievementEngine:", error);
    }
}

// Listen for messages from loader.js (extension context)
window.addEventListener("message", (event) => {
    if (event.data.type === "SCRATCH_ACHIEVEMENT_SET_LOADED") {
        const { set, unlocked, showAlertsForUnlocked } = event.data;
        currentShowAlerts = !!showAlertsForUnlocked;
        sessionPopupsShown.clear();

        showSetStatusModal(
            `Loaded achievements for <b>${escapeHTML(set.gameName)}</b> (${Object.keys(set.achievements).length} total)`,
            true,
            set.gameIcon
        );
        
        startEngine(set, unlocked);
    }
    
    if (event.data.type === "SCRATCH_ACHIEVEMENT_SET_STATUS" && event.data.found === false) {
        if (activeEngine) {
            console.log("No achievement set found for new project, stopping engine.");
            activeEngine.stop();
            activeEngine = null;
        }
        activeSet = null;
        activeUnlocked = [];
    }

    if (event.data.type === "SCRATCH_ACHIEVEMENT_UNLOCKED_CHANGED") {
        const { unlocked } = event.data;
        const removed = activeUnlocked.filter(id => !unlocked.includes(id));
        activeUnlocked = unlocked;
        if (activeEngine) {
            console.log("Active engine unlocked achievements list synchronized:", unlocked);
            for (const id of removed) {
                activeEngine.unlocked.delete(id);
                sessionPopupsShown.delete(id);
            }
            if (currentShowAlerts) {
                activeEngine.unlocked = new Set([...unlocked, ...activeEngine.unlocked]);
            } else {
                activeEngine.unlocked = new Set(unlocked);
            }
        }
    }

    if (event.data.type === "SCRATCH_ACHIEVEMENT_SETTINGS_CHANGED") {
        const { showAlertsForUnlocked } = event.data;
        currentShowAlerts = !!showAlertsForUnlocked;
        if (activeSet) {
            console.log("Settings changed, restarting engine with showAlertsForUnlocked =", currentShowAlerts);
            startEngine(activeSet, activeUnlocked);
        }
    }
});