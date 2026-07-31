const achievements = {
    "new_level_test": {
        name: "New Level Started",

        event: {
            type: "broadcast",
            value: "EDIT - New Level"
        },

        condition: {
            AND: []
        }
    },


    "apple_master": {
        name: "Apple Master",

        event: "continuous",

        condition: {
            AND: [
                {
                    variable: {
                        targetIndex: 0,
                        variableId: "^I!}0)g@vH/C.EQ,Eg.%",
                        operator: ">=",
                        value: 10
                    }
                }
            ]
        }
    }
};



function showAchievementModal(achievement) {

    const modal = document.createElement("div");

    modal.innerHTML = `
        <div>
            🏆 Achievement Unlocked!
            <br>
            ${achievement.name}
        </div>
    `;

    Object.assign(modal.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        padding: "20px",
        background: "#222",
        color: "white",
        borderRadius: "10px",
        zIndex: 999999
    });

    document.body.appendChild(modal);


    setTimeout(() => {
        modal.remove();
    }, 3000);
}



function waitForVM() {

    const interval = setInterval(() => {

        if (!window.vm) return;


        clearInterval(interval);


        const engine = new AchievementEngine(
            window.vm,
            achievements
        );


        engine.onUnlock = (
            id,
            achievement
        ) => {
            showAchievementModal(achievement);

            window.postMessage({
                type: "SCRATCH_ACHIEVEMENT_UNLOCKED",
                achievement: {
                    id,
                    name: achievement.name
                }
            });
        };


        engine.start();


    }, 100);

}

function showAchievementModal(achievement) {
    const modal = document.createElement("div");

    modal.innerHTML = `
        <div style="
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 8px;
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

        background: "#222",
        color: "#fff",

        padding: "16px 20px",
        borderRadius: "12px",

        fontFamily: "Arial, sans-serif",

        boxShadow: "0 4px 15px rgba(0,0,0,0.4)",

        zIndex: "999999",

        opacity: "0",
        transform: "translateY(20px)",

        transition: "opacity 0.3s ease, transform 0.3s ease"
    });


    document.body.appendChild(modal);


    // Animate in
    requestAnimationFrame(() => {
        modal.style.opacity = "1";
        modal.style.transform = "translateY(0)";
    });


    // Remove after 4 seconds
    setTimeout(() => {

        modal.style.opacity = "0";
        modal.style.transform = "translateY(20px)";

        setTimeout(() => {
            modal.remove();
        }, 300);

    }, 4000);
}


waitForVM();