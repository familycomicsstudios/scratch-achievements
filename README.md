# scratch-achievements

Scratch Achievements is a browser extension that interacts with Scratch's VM to dynamically give the player achievements based on
variable changes as well as broadcasts.

## Installation

Download this repository as a .zip file and load it unpacked into your browser of choice. This extension is designed for Chromium based
browsers.

## Set Design

Sets are structured around events and variables. This is a sample set:

```
{
    "gameName": "Appel", // The name of the game in the set
    "achievements": {
        "new_level_test": {
            "name": "Spiking", // The achievement's name

            "event": { // The event that causes it to be checked
                "type": "broadcast", // The type of event
                "value": "Level - Complete" // The broadcast's name that causes it to be checked
            },

            "condition": {
                "AND": [
                    {
                        "variable": {
                            "targetIndex": 0, // Sprite index 0 (stage)
                            "variableId": "`ry3}:Cl|4?t9XIKgjXl", // Variable ID (can be accessed through developer console)
                            "operator": "==",
                            "value": 2
                        }
                    }
                ]
            }
        },

        "apple_collector": {
            "name": "Apple Collector I",

            "event": "continuous", // Always check if the conditions are true

            "condition": {
                "AND": [
                    {
                        "variable": { // Condition 1: APPLES >= 35
                            "targetIndex": 0,
                            "variableId": "^I!}0)g@vH/C.EQ,Eg.%",
                            "operator": ">=",
                            "value": 35
                        }
                    },
                    {
                        "variable": { // Condition 2: LEVEL # == 2
                            "targetIndex": 0,
                            "variableId": "`ry3}:Cl|4?t9XIKgjXl",
                            "operator": "==",
                            "value": 2
                        }
                    }
                ]
            }
        }
    }
}
```