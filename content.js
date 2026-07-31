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


const unlocked = new Set();
const receivedBroadcasts = new Set();


function compare(a, operator, b) {
    switch (operator) {
        case "==": return a == b;
        case "!=": return a != b;
        case ">": return a > b;
        case ">=": return a >= b;
        case "<": return a < b;
        case "<=": return a <= b;
        default: return false;
    }
}


function evaluateCondition(vm, condition) {

    // AND group
    if (condition.AND) {
        return condition.AND.every(
            child => evaluateCondition(vm, child)
        );
    }


    // OR group
    if (condition.OR) {
        return condition.OR.some(
            child => evaluateCondition(vm, child)
        );
    }


    // Variable condition
    if (condition.variable) {
        const c = condition.variable;

        const target =
            vm.runtime.targets[c.targetIndex];

        if (!target) return false;


        const variable =
            target.variables[c.variableId];

        if (!variable) return false;


        return compare(
            variable.value,
            c.operator,
            c.value
        );
    }


    // Broadcast condition
    if (condition.broadcast) {
        return receivedBroadcasts.has(
            condition.broadcast
        );
    }


    return false;
}


function unlockAchievement(id) {
    if (unlocked.has(id)) return;

    unlocked.add(id);

    console.log(
        `🏆 Achievement Unlocked: ${achievements[id].name}`
    );

    window.postMessage({
        type: "SCRATCH_ACHIEVEMENT_UNLOCKED",
        achievement: {
            id: id,
            name: achievements[id].name
        }
    });
}


function checkAchievement(vm, id) {
    const achievement = achievements[id];

    if (unlocked.has(id)) return;


    if (evaluateCondition(vm, achievement.condition)) {
        unlockAchievement(id);
    }
}


function checkContinuousAchievements(vm) {
    for (const [id, achievement] of Object.entries(achievements)) {

        if (achievement.event === "continuous") {
            checkAchievement(vm, id);
        }

    }
}


function handleBroadcast(vm, broadcastName) {

    receivedBroadcasts.add(broadcastName);


    for (const [id, achievement] of Object.entries(achievements)) {

        if (
            achievement.event &&
            achievement.event.type === "broadcast" &&
            achievement.event.value === broadcastName
        ) {
            checkAchievement(vm, id);
        }

    }
}


function hookEvents(vm) {

    const runtime = vm.runtime;

    const originalStartHats =
        runtime.startHats.bind(runtime);


    runtime.startHats = function(
        hat,
        fields,
        target
    ) {

        if (
            hat === "event_whenbroadcastreceived" &&
            fields?.BROADCAST_OPTION
        ) {
            handleBroadcast(
                vm,
                fields.BROADCAST_OPTION
            );
        }


        return originalStartHats(
            hat,
            fields,
            target
        );
    };
}


function start(vm) {

    hookEvents(vm);


    setInterval(() => {
        checkContinuousAchievements(vm);
    }, 16);

}


function waitForVM() {

    const interval = setInterval(() => {

        if (!window.vm) return;


        clearInterval(interval);

        start(window.vm);

    }, 100);

}


waitForVM();