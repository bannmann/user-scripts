// ==UserScript==
// @name         Smooth Work Logging
// @description  Makes creating/editing Jira work logs more efficient.
// @namespace    https://github.com/bannmann/
// @version      0.8
// @match        https://jira.eurodata.de/browse/*
// @match        https://jira.eurodata.de/secure/RapidBoard.jspa?*
// @match        https://jira.eurodata.de/issues/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=eurodata.de
// @grant        none
// @updateURL    https://git.eurodata.de/eurodata-dortmund/browser-hacks/-/raw/main/jira/smooth-work-logging.user.js?ref_type=heads
// @downloadURL  https://git.eurodata.de/eurodata-dortmund/browser-hacks/-/raw/main/jira/smooth-work-logging.user.js?ref_type=heads
// ==/UserScript==

(function() {
    'use strict';

    var bodyObserver = new MutationObserver(function(mutations) {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if ('id' in node) {
                    switch (node.id) {
                        case "log-work-dialog":
                            runPatcher(patchLogWorkDialog, node);
                            return;
                        case "edit-log-work-dialog":
                            runPatcher(patchWorklogEditDialog, node);
                            return;
                        case "delete-log-work-dialog":
                            runPatcher(patchWorklogDeleteDialog, node);
                            return;
                    }
                }
            }
        }
    });

    bodyObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    function runPatcher(patcher, dialog) {
        let form = dialog.querySelector("form");
        if (!form) {
            var dialogObserver = new MutationObserver(function(mutations) {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeName === 'FORM') {
                            // Now that we have a form, it should be safe to call the patcher
                            patcher(dialog);
                            this.disconnect();
                            return;
                        }
                    }
                }
            });

            dialogObserver.observe(dialog, {
                childList: true,
                subtree: true
            });
            return;
        }

        patcher(dialog);
    }

    function patchLogWorkDialog(dialog) {
        addDurationButtons(dialog);
        setInitialStartTime(dialog);
        addStartTimeButtons(dialog);
    }

    const durationPattern = /(?:(\d+h) *)?(?:(\d+m))?/;
    function getDurationValues(input) {
        let matches = input.value.match(durationPattern);
        console.debug(matches);
        let values = {
            h: matches[1] || "",
            m: matches[2] || ""
        }
        return values;
    }

    function addDurationButtons(dialog) {
        let gridColumnCount = dialog.classList.contains("popup-width-large") ? 9 : 5;

        let row = document.createElement("div");
        row.classList.add("description");
        row.setAttribute("style", `display:grid; grid-template-columns: repeat(${gridColumnCount}, 1fr); grid-gap: 10px 10px`);

        let input = dialog.querySelector("#log-work-time-logged");
        let values = getDurationValues(input);

        makeButton(values, row, "h", "", "0h");
        makeButton(values, row, "h", "1h");
        makeButton(values, row, "h", "2h");
        makeButton(values, row, "h", "3h");
        makeButton(values, row, "h", "4h");
        makeButton(values, row, "h", "5h");
        makeButton(values, row, "h", "6h");
        makeButton(values, row, "h", "7h");
        makeButton(values, row, "h", "8h");
        makeButton(values, row, "m", "", "0m");
        makeButton(values, row, "m", "15m");
        makeButton(values, row, "m", "30m");
        makeButton(values, row, "m", "45m");

        row.addEventListener("click", function(event) {
            let clicked = event.target;
            if (clicked.nodeName === 'BUTTON') {
                clicked.parentNode.querySelectorAll("button.aui-button-primary[data-kind=" + clicked.dataset.kind + "]").forEach(function (button) {
                    button.classList.remove("aui-button-primary");
                });
                clicked.classList.add("aui-button-primary");

                let values = getDurationValues(input);
                values[clicked.dataset.kind] = clicked.dataset.value;
                input.value = (values.h + " " + values.m).trim();
            }
        });

        let fieldGroup = input.parentNode;
        let existingDescription = fieldGroup.querySelector(".description");
        existingDescription.setAttribute("style", "display: none");
        fieldGroup.insertBefore(row, existingDescription);
    }

    function makeButton(currentValues, row, kind, value, label) {
        let button = document.createElement("button");
        button.setAttribute("type", "button");

        let style = "margin: 0; padding: 4px 7px;";
        if (value == "00" || value == "") {
            style += "grid-column-start: 1;";
        }
        button.setAttribute("style", style);

        button.dataset.kind = kind;
        button.dataset.value = value;
        button.innerText = label || value;
        button.classList.add("aui-button");
        if (currentValues[kind] == value) {
            button.classList.add("aui-button-primary");
        }
        row.appendChild(button);
    }

    const timePattern = /(\d+):(\d+)$/;
    function getTimeValues(input) {
        let matches = input.value.match(timePattern);
        console.warn(matches);
        let values = {
            h: matches[1] || "",
            m: matches[2] || ""
        }
        return values;
    }

    function setInitialStartTime(dialog) {
        let input = dialog.querySelector("#log-work-date-logged-date-picker");
        setStartTime(input, "12:00");
    }

    function addStartTimeButtons(dialog) {
        let gridColumnCount = dialog.classList.contains("popup-width-large") ? 13 : 7;

        let row = document.createElement("div");
        row.classList.add("description");
        row.setAttribute("style", `display:grid; grid-template-columns: repeat(${gridColumnCount}, 1fr); grid-gap: 10px 10px`);

        let input = dialog.querySelector("#log-work-date-logged-date-picker");
        let values = getTimeValues(input);

        makeButton(values, row, "h", "6", "6:");
        makeButton(values, row, "h", "7", "7:");
        makeButton(values, row, "h", "8", "8:");
        makeButton(values, row, "h", "9", "9:");
        makeButton(values, row, "h", "10", "10:");
        makeButton(values, row, "h", "11", "11:");
        makeButton(values, row, "h", "12", "12:");
        makeButton(values, row, "h", "13", "13:");
        makeButton(values, row, "h", "14", "14:");
        makeButton(values, row, "h", "15", "15:");
        makeButton(values, row, "h", "16", "16:");
        makeButton(values, row, "h", "17", "17:");
        makeButton(values, row, "h", "18", "18:");
        makeButton(values, row, "m", "00", ":00");
        makeButton(values, row, "m", "15", ":15");
        makeButton(values, row, "m", "30", ":30");
        makeButton(values, row, "m", "45", ":45");

        row.addEventListener("click", function(event) {
            let clicked = event.target;
            if (clicked.nodeName === 'BUTTON') {
                clicked.parentNode.querySelectorAll("button.aui-button-primary[data-kind=" + clicked.dataset.kind + "]").forEach(function (button) {
                    button.classList.remove("aui-button-primary");
                });
                clicked.classList.add("aui-button-primary");

                let values = getTimeValues(input);
                values[clicked.dataset.kind] = clicked.dataset.value;
                setStartTime(input, values.h + ":" + values.m);
            }
        });

        let fieldGroup = input.parentNode;
        let existingDescription = fieldGroup.querySelector(".description");
        fieldGroup.appendChild(row);
    }

    function setStartTime(input, newTime) {
        input.value = input.value.replace(timePattern, newTime);
    }

    function patchWorklogEditDialog(dialog) {
        addDurationButtons(dialog);
        addStartTimeButtons(dialog);
        changeEstimateAdjustmentMode(dialog);
    }

    function changeEstimateAdjustmentMode(dialog) {
        let leaveExistingOption = dialog.querySelector("input[value=leave]");
        leaveExistingOption.checked = true;
        return leaveExistingOption;
    }

    function patchWorklogDeleteDialog(dialog) {
        let option = changeEstimateAdjustmentMode(dialog);
        option.focus();
    }
})();