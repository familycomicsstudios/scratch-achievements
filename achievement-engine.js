class AchievementEngine {
    constructor(vm, achievements, options = {}) {
        if (!vm || !vm.runtime) {
            throw new Error("AchievementEngine requires a valid Scratch VM instance with a runtime.");
        }
        this.vm = vm;
        this.achievements = achievements || {};
        this.unlocked = new Set(options.unlocked || []);
        this.onUnlock = options.onUnlock || null;

        this.receivedBroadcasts = new Set();
        this._hooked = false;
        this._originalStartHats = null;
        this.interval = null;
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
        if (!condition) return false;

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
            const target = this.vm.runtime.targets[c.targetIndex];
            if (!target) return false;

            const variable = target.variables[c.variableId];
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
            `🏆 Achievement Unlocked: ${achievement ? achievement.name : id}`
        );

        if (this.onUnlock) {
            this.onUnlock(id, achievement);
        }
    }

    checkAchievement(id) {
        const achievement = this.achievements[id];
        if (!achievement) return;

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
        if (this._hooked) return;

        this._originalStartHats = runtime.startHats;
        const self = this;
        runtime.startHats = function(hat, fields, target) {
            if (
                hat === "event_whenbroadcastreceived" &&
                fields?.BROADCAST_OPTION
            ) {
                self.handleBroadcast(fields.BROADCAST_OPTION);
            }

            return self._originalStartHats.call(this, hat, fields, target);
        };
        this._hooked = true;
    }

    start() {
        this.hookEvents();

        if (this.interval) {
            clearInterval(this.interval);
        }
        this.interval = setInterval(() => {
            this.checkContinuous();
        }, 16);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        if (this._hooked && this._originalStartHats) {
            this.vm.runtime.startHats = this._originalStartHats;
            this._originalStartHats = null;
            this._hooked = false;
        }
    }
}

// Expose globally
if (typeof window !== "undefined") {
    window.AchievementEngine = AchievementEngine;
} else if (typeof global !== "undefined") {
    global.AchievementEngine = AchievementEngine;
} else {
    globalThis.AchievementEngine = AchievementEngine;
}