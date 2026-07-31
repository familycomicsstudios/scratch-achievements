function getProjectID() {
    const path = window.location.pathname;

    // TurboWarp URLs:
    // /123456789
    // /editor?project_url=...
    const match = path.match(/\/(\d+)/);

    if (!match) {
        return null;
    }

    return match[1];
}


async function loadAchievementSet(projectID) {

    const url = fetch(
        chrome.runtime.getURL(`sets/${projectID}.json`)
    )

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `No achievement set found for ${projectID}`
        );
    }

    return await response.json();
}

function showSetStatusModal(message, success = false) {
    const modal = document.createElement("div");

    modal.innerHTML = `
        <div style="
            font-size:20px;
            font-weight:bold;
            margin-bottom:8px;
        ">
            🏆 Scratch Achievements
        </div>

        <div>
            ${message}
        </div>
    `;

    Object.assign(modal.style, {
        position: "fixed",
        left: "20px",
        bottom: "20px",

        background: "#222",
        color: "#fff",

        padding: "16px 20px",
        borderRadius: "12px",

        fontFamily: "Arial, sans-serif",

        boxShadow:
            "0 4px 15px rgba(0,0,0,0.4)",

        zIndex: "999999",

        opacity: "0",
        transform: "translateY(20px)",

        transition:
            "opacity .3s ease, transform .3s ease"
    });


    document.body.appendChild(modal);


    requestAnimationFrame(() => {
        modal.style.opacity = "1";
        modal.style.transform = "translateY(0)";
    });


    setTimeout(() => {

        modal.style.opacity = "0";
        modal.style.transform = "translateY(20px)";

        setTimeout(() => {
            modal.remove();
        }, 300);

    }, 5000);
}



function showAchievementModal(achievement) {

    const modal = document.createElement("div");

    modal.innerHTML = `
        <div style="
            font-size:20px;
            font-weight:bold;
            margin-bottom:8px;
        ">
            🏆 Achievement Unlocked!
        </div>

        <div>
            ${achievement.name}
        </div>
    `;


    Object.assign(modal.style, {

        position: "fixed",
        left: "20px",
        bottom: "20px",

        background:"#222",
        color:"#fff",

        padding:"16px 20px",
        borderRadius:"12px",

        fontFamily:"Arial",

        boxShadow:
            "0 4px 15px rgba(0,0,0,.4)",

        zIndex:999999,

        opacity:"0",
        transform:"translateY(20px)",

        transition:
            "opacity .3s, transform .3s"

    });


    document.body.appendChild(modal);


    requestAnimationFrame(() => {
        modal.style.opacity="1";
        modal.style.transform="translateY(0)";
    });


    setTimeout(() => {

        modal.style.opacity="0";
        modal.style.transform="translateY(20px)";


        setTimeout(() => {
            modal.remove();
        },300);

    },4000);
}



async function waitForVM() {

    window.addEventListener("message", event => {

        if (event.data.type === "SCRATCH_ACHIEVEMENT_SET_LOADED") {

            const set = event.data.set;

            showSetStatusModal(
                `Achievement set found:<br>
                <b>${set.gameName}</b><br>
                ${Object.keys(set.achievements).length} achievements`
            );


            const engine = new AchievementEngine(
                window.vm,
                set.achievements
            );


            engine.onUnlock = (
                id,
                achievement
            ) => {
                showAchievementModal(achievement);
            };


            engine.start();
        }


        if (event.data.type === "SCRATCH_ACHIEVEMENT_SET_STATUS") {

            showSetStatusModal(
                "No achievement set found."
            );

        }

    });

}


waitForVM();