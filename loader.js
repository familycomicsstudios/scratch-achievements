function getProjectID() {
    const match = window.location.pathname.match(/\/(\d+)/);

    if (!match) {
        return null;
    }

    return match[1];
}


async function loadAchievementSet(projectID) {
    const url = chrome.runtime.getURL(
        `sets/${projectID}.json`
    );

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Achievement set not found: ${projectID}`
        );
    }

    return await response.json();
}


async function startLoader() {
    const projectID = getProjectID();

    if (!projectID) {
        window.postMessage({
            type: "SCRATCH_ACHIEVEMENT_SET_STATUS",
            found: false
        }, "*");

        return;
    }


    try {
        const set = await loadAchievementSet(projectID);

        window.postMessage({
            type: "SCRATCH_ACHIEVEMENT_SET_LOADED",
            set: set
        }, "*");

    } catch (error) {

        window.postMessage({
            type: "SCRATCH_ACHIEVEMENT_SET_STATUS",
            found: false
        }, "*");

    }
}


startLoader();