// ==UserScript==
// @name         Smooth Work Logging
// @namespace    https://github.com/bannmann/
// @version      0.1
// @match        https://jira.eurodata.de/browse/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=eurodata.de
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const patchingDelay = 250;

    var observer = new MutationObserver(function(mutations) {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if ('id' in node) {
                    switch(node.id) {
                        case "log-work-dialog":
                            runDelayed(patchLogWorkDialog, node);
                            return;
                        case "edit-log-work-dialog":
                            runDelayed(patchWorklogEditDialog, node);
                            return;
                        case "delete-log-work-dialog":
                            runDelayed(patchWorklogDeleteDialog, node);
                            return;
                    }
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true
    });

    function runDelayed(handler, dialog) {
        setTimeout(handler, patchingDelay, dialog);
    }

    function patchLogWorkDialog(dialog) {
        addDurationButtons(dialog);
        addStartEndSelects(dialog);
    }

    const pattern = /(?:(\d+h) *)?(?:(\d+m))?/;
    function getValues(input) {
        let matches = input.value.match(pattern);
        console.warn(matches);
        let values = {
            h: matches[1] || "",
            m: matches[2] || ""
        }
        return values;
    }

    function addDurationButtons(dialog) {
        let row = document.createElement("div");
        row.classList.add("description");
        row.setAttribute("style", "display:grid; grid-template-columns: repeat(9, 1fr); grid-gap: 10px 10px");

        let input = dialog.querySelector("#log-work-time-logged");
        let values = getValues(input);

        function makeButton(kind, value, label) {
            let button = document.createElement("button");
            button.setAttribute("type", "button");
            button.setAttribute("style", "margin: 0");
            button.dataset.kind = kind;
            button.dataset.value = value;
            button.innerText = label || value;
            button.classList.add("aui-button");
            if (values[kind] == value) {
                button.classList.add("aui-button-primary");
            }
            row.appendChild(button);
        }
        makeButton("h", "", "0h");
        makeButton("h", "1h");
        makeButton("h", "2h");
        makeButton("h", "3h");
        makeButton("h", "4h");
        makeButton("h", "5h");
        makeButton("h", "6h");
        makeButton("h", "7h");
        makeButton("h", "8h");
        makeButton("m", "", "0m");
        makeButton("m", "15m");
        makeButton("m", "30m");
        makeButton("m", "45m");

        row.addEventListener("click", function(event) {
            let clicked = event.originalTarget;
            if (clicked.nodeName === 'BUTTON') {
                clicked.parentNode.querySelectorAll("button.aui-button-primary[data-kind=" + clicked.dataset.kind + "]").forEach(function (button) {
                    button.classList.remove("aui-button-primary");
                });
                clicked.classList.add("aui-button-primary");

                let values = getValues(input);
                values[clicked.dataset.kind] = clicked.dataset.value;
                input.value = (values.h + " " + values.m).trim();
            }
        });

        let fieldGroup = input.parentNode;
        let existingDescription = fieldGroup.querySelector(".description");
        fieldGroup.insertBefore(row, existingDescription);
    }

    const timePattern = /\d+:\d+/;
    function addStartEndSelects(dialog) {
        let input = dialog.querySelector("input[name=startDate]");
        let initialStartTime = timePattern.exec(input.value)[0].padStart(5, 0);
        let fieldGroup = input.parentNode;

        let span = document.createElement("span");
        span.id = "smoothTimePickers";
        fieldGroup.appendChild(span);

        function addSelect(id, listener, valueToPreselect) {
            let select = document.createElement("select");
            select.id = id;
            select.classList.add("select");
            select.setAttribute("style", "width: auto; margin-left: 10px");
            select.setAttribute("size", "3");

            function toPaddedString(number) {
                return ("" + number).padStart(2, 0);
            }

            let closestMatchingOption = null;
            for (let hour = 0; hour < 24; hour++) {
                for (let minute = 0; minute < 60; minute += 15) {
                    let option = document.createElement("option");
                    let value = toPaddedString(hour) + ":" + toPaddedString(minute);
                    option.innerText = value;
                    option.addEventListener("click", listener);
                    select.appendChild(option);

                    if (!!valueToPreselect && value <= valueToPreselect) {
                        closestMatchingOption = option;
                        if (value == valueToPreselect) {
                            option.selected = true;
                        }
                    }
                }
            }

            span.appendChild(select);


            if (closestMatchingOption != null) {
                // Determine option height - only works when the select is already added to the DOM
                let optionHeightInPixels = closestMatchingOption.clientHeight;

                // With 3 rows, this achieves the desired effect of the closest match being in the middle
                let optionIndexToScrollTo = closestMatchingOption.index - 1;
                select.scrollTo(0, optionIndexToScrollTo * optionHeightInPixels);
            }
        }

        addSelect("startTime", function(event) {
            input.value = input.value.replace(timePattern, event.target.value);
        }, initialStartTime);

        //addSelect("endTime", initialStartTime);
    }

    function patchWorklogEditDialog(dialog) {
        addDurationButtons(dialog);
        addStartEndSelects(dialog);
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