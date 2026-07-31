class AchievementEngine {
    constructor(vm, achievements) {
        this.vm = vm;
        this.achievements = achievements;

        this.unlocked = new Set();
        this.receivedBroadcasts = new Set();
    }


    compare(a, operator, b) {
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


    evaluateCondition(condition) {

        if (condition.AND) {
            return condition.AND.every(
                child => this.evaluateCondition(child)
            );
        }


        if (condition.OR) {
            return condition.OR.some(
                child => this.evaluateCondition(child)
            );
        }


        if (condition.variable) {
            const c = condition.variable;

            const target =
                this.vm.runtime.targets[c.targetIndex];

            if (!target) return false;


            const variable =
                target.variables[c.variableId];

            if (!variable) return false;


            return this.compare(
                variable.value,
                c.operator,
                c.value
            );
        }


        if (condition.broadcast) {
            return this.receivedBroadcasts.has(
                condition.broadcast
            );
        }


        return false;
    }


    unlockAchievement(id) {
        if (this.unlocked.has(id)) return;

        this.unlocked.add(id);

        const achievement = this.achievements[id];

        console.log(
            `🏆 Achievement Unlocked: ${achievement.name}`
        );

        if (this.onUnlock) {
            this.onUnlock(id, achievement);
        }
}


    checkAchievement(id) {
        const achievement = this.achievements[id];

        if (this.unlocked.has(id)) return;


        if (this.evaluateCondition(achievement.condition)) {
            this.unlockAchievement(id);
        }
    }


    checkContinuous() {
        for (const [id, achievement] of Object.entries(this.achievements)) {

            if (achievement.event === "continuous") {
                this.checkAchievement(id);
            }

        }
    }


    handleBroadcast(name) {

        this.receivedBroadcasts.add(name);


        for (const [id, achievement] of Object.entries(this.achievements)) {

            if (
                achievement.event &&
                achievement.event.type === "broadcast" &&
                achievement.event.value === name
            ) {
                this.checkAchievement(id);
            }

        }
    }


    hookEvents() {

        const runtime = this.vm.runtime;

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
                this.handleBroadcast(
                    fields.BROADCAST_OPTION
                );
            }

            return originalStartHats(
                hat,
                fields,
                target
            );

        }.bind(this);
    }


    start() {
        this.hookEvents();

        this.interval = setInterval(() => {
            this.checkContinuous();
        }, 16);
    }
}