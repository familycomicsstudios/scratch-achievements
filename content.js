// Example achievement database
const achievements = {
    "first_apples": {
        name: "Apple Collector",
        targetIndex: 0, // Stage
        variableId: "^I!}0)g@vH/C.EQ,Eg.%", // Apples
        condition: {
            operator: ">=",
            value: 10
        }
    },

    "hundred_apples": {
        name: "Apple Hoarder",
        targetIndex: 0,
        variableId: "^I!}0)g@vH/C.EQ,Eg.%",
        condition: {
            operator: ">=",
            value: 100
        }
    },

    "back_to_level_select": {
        name: "Back to Level Select",
        targetIndex: 0,
        variableId: "tN?,)+jkOy8Zj==YZeC1",
        condition: {
            operator: "==",
            value: true
        }
    }
};

function compare(a, operator, b) {
    switch (operator) {
        case "==": return a == b;
        case "===": return a === b;
        case "!=": return a != b;
        case "!==": return a !== b;
        case ">": return a > b;
        case ">=": return a >= b;
        case "<": return a < b;
        case "<=": return a <= b;
        default:
            console.error("Unknown operator:", operator);
            return false;
    }
}

function watchAchievements(vm) {
    const unlocked = new Set();

    setInterval(() => {
        for (const [id, achievement] of Object.entries(achievements)) {

            if (unlocked.has(id)) continue;

            const target = vm.runtime.targets[achievement.targetIndex];
            if (!target) continue;

            const variable = target.variables[achievement.variableId];
            if (!variable) continue;

            if (
                compare(
                    variable.value,
                    achievement.condition.operator,
                    achievement.condition.value
                )
            ) {
                unlocked.add(id);

                console.log(
                    `🏆 Achievement Unlocked: ${achievement.name}`
                );
            }
        }
    }, 16);
}

function waitForVM() {
    const interval = setInterval(() => {
        if (!window.vm) return;

        clearInterval(interval);

        console.log("VM found!");
        watchAchievements(window.vm);
    }, 100);
}

waitForVM();