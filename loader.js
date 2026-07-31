function getProjectID() {
    const pathname = window.location.pathname;
    
    // 1. Direct path match: e.g. /60917032
    const pathMatch = pathname.match(/\/(\d+)/);
    if (pathMatch) {
        return pathMatch[1];
    }
    
    // 2. Query parameter match: e.g. ?project_url=.../60917032
    const searchParams = new URLSearchParams(window.location.search);
    const projectUrl = searchParams.get("project_url");
    if (projectUrl) {
        const urlMatch = projectUrl.match(/\/(\d+)/);
        if (urlMatch) {
            return urlMatch[1];
        }
    }
    
    return null;
}

async function loadAchievementSet(projectID) {
    const url = chrome.runtime.getURL(`sets/${projectID}.json`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Achievement set not found: ${projectID}`);
    }
    return await response.json();
}

let currentProjectId = null;
let lastUrl = window.location.href;

async function handleUrlChange() {
    const projectID = getProjectID();
    
    if (projectID === currentProjectId) {
        return;
    }
    
    currentProjectId = projectID;
    console.log(`Scratch Achievements: Active project ID is now ${projectID}`);

    if (!projectID) {
        await chrome.storage.local.remove("currentSet");
        window.postMessage({
            type: "SCRATCH_ACHIEVEMENT_SET_STATUS",
            found: false
        }, "*");
        return;
    }

    try {
        const set = await loadAchievementSet(projectID);
        set.projectId = projectID;

        const storageKey = `unlocked_${projectID}`;
        const result = await chrome.storage.local.get(storageKey);
        const unlocked = result[storageKey] || [];

        const settingsResult = await chrome.storage.local.get(["showAlertsForUnlocked"]);
        const showAlerts = !!settingsResult.showAlertsForUnlocked;

        await chrome.storage.local.set({ currentSet: set });

        window.postMessage({
            type: "SCRATCH_ACHIEVEMENT_SET_LOADED",
            set: set,
            unlocked: unlocked,
            showAlertsForUnlocked: showAlerts
        }, "*");

    } catch (error) {
        console.warn(`Scratch Achievements: No set found or error loading for ${projectID}`);
        await chrome.storage.local.remove("currentSet");
        window.postMessage({
            type: "SCRATCH_ACHIEVEMENT_SET_STATUS",
            found: false
        }, "*");
    }
}

// Watch for single-page application URL changes
setInterval(() => {
    if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        handleUrlChange();
    }
}, 1000);

window.addEventListener("message", async (event) => {
    if (event.data.type !== "SCRATCH_ACHIEVEMENT_UNLOCKED") {
        return;
    }

    const { achievementId } = event.data;
    if (!currentProjectId || !achievementId) return;

    const storageKey = `unlocked_${currentProjectId}`;
    const result = await chrome.storage.local.get(storageKey);
    const unlocked = result[storageKey] || [];

    if (!unlocked.includes(achievementId)) {
        unlocked.push(achievementId);
        await chrome.storage.local.set({ [storageKey]: unlocked });
        console.log(`Saved unlocked achievement '${achievementId}' for project ${currentProjectId}`);
    }
});

// Reactively watch storage changes to sync back to main world page
chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName !== "local") return;

    if (currentProjectId) {
        const storageKey = `unlocked_${currentProjectId}`;
        if (changes[storageKey]) {
            const unlocked = changes[storageKey].newValue || [];
            window.postMessage({
                type: "SCRATCH_ACHIEVEMENT_UNLOCKED_CHANGED",
                unlocked: unlocked
            }, "*");
        }
    }

    if (changes["showAlertsForUnlocked"]) {
        const showAlerts = !!changes["showAlertsForUnlocked"].newValue;
        window.postMessage({
            type: "SCRATCH_ACHIEVEMENT_SETTINGS_CHANGED",
            showAlertsForUnlocked: showAlerts
        }, "*");
    }
});

// Run initial loader check
handleUrlChange();