(async function () {
    const BTN_WRAPPER_ID = "gcal-checker-chrome-ext-btn-wrapper";
    const INPUT_SELECTOR = "#xCancelBu ~ div input";

    const storageGet = (obj) =>
        new Promise((resolve) => chrome.storage.sync.get(obj, resolve));

    const Options = await storageGet({
        "add-emoji-check-mark": true, // true -- default value
        "add-description-completed-datetime": true,
        "add-description-origin-title": true,
        "use-strikethrough-effect": true,
        "add-emoji-crossed-mark": false,
        "enable-reporting": false,
    });
    const isAddCheckMark = Options["add-emoji-check-mark"];
    const isAddCrossedMark = Options["add-emoji-crossed-mark"];
    const ALL_BUTTONS = ["✅", "❌"];
    const BUTTONS_TO_RENDER = [
        ...(isAddCrossedMark ? ["❌"] : []),
        ...(isAddCrossedMark && !isAddCheckMark ? [] : ["✅"]),
        ,
    ].filter((x) => Boolean(x));

    function getInput() {
        return new Promise((resolve, reject) => {
            const delay = 1000;
            const maxIterations = 60;
            let iteration = 0;
            let timeoutLink;

            let isRightPage = getIsRightPage();
            const input = document.querySelector(INPUT_SELECTOR);

            if (isRightPage && input) {
                resolve(input);

                return;
            }

            function checkInDelay() {
                clearTimeout(timeoutLink);
                timeoutLink = setTimeout(() => {
                    isRightPage = getIsRightPage();
                    const input = document.querySelector(INPUT_SELECTOR);
                    if (isRightPage && input) {
                        resolve(input);

                        return;
                    }

                    if (iteration > maxIterations) {
                        reject(new Error("Input node was not found; timeout"));
                        return;
                    }

                    iteration += 1;
                    checkInDelay();
                }, delay);
            }

            checkInDelay();
        });
    }

    function addStrikeEffect(value) {
        if (!Options["use-strikethrough-effect"]) {
            return value;
        }

        return value
            .split("")
            .map((item) => {
                /*
                    don't break special characters and emojis.
                    2000 is just randomly picked code point from where most characters
                    seems broken with added strike effect.
                    ideally there should be proper checking whether specific code point
                    can be shown OK with added strike effect.
                */
                if (item.charCodeAt(0) > 2000) {
                    return item;
                }

                return item + "\u0336";
            })
            .join("");
    }

    function removeStrikeEffect(value) {
        return value
            .split("")
            .filter((item) => item !== "\u0336")
            .join("");
    }

    function addEmoji(value, emoji) {
        if (
            !Options["add-emoji-check-mark"] &&
            !Options["add-emoji-crossed-mark"]
        ) {
            return value;
        }
        return `${emoji} ${value}`;
    }

    function removeEmoji(value) {
        // remove previous emoji
        return value.replace(
            new RegExp(`^(${ALL_BUTTONS.join("|")})(\\s)`, "gi"),
            ""
        );
    }

    function getNextTitleValue(titleValue, emojiClicked) {
        let nextValue = titleValue;

        const isMarked =
            [...nextValue].some((item) => item === "\u0336") ||
            ALL_BUTTONS.some((button) => nextValue.startsWith(button));

        if (isMarked) {
            nextValue = removeStrikeEffect(nextValue);
            nextValue = removeEmoji(nextValue);
        } else {
            nextValue = addStrikeEffect(nextValue);
            nextValue = addEmoji(nextValue, emojiClicked);
        }

        return nextValue;
    }

    async function makeReplacement(emojiClicked) {
        const input = await getInput();
        const originValue = input.value;

        // no need to touch empty input
        if (!originValue) {
            return;
        }

        const nextValue = getNextTitleValue(originValue, emojiClicked);

        const isMarked =
            [...nextValue].some((item) => item === "\u0336") ||
            ALL_BUTTONS.some((button) => nextValue.startsWith(button));

        input.value = `${nextValue}`;

        input.dispatchEvent(new Event("input", { bubbles: true }));

        toggleDescription({
            originValue: removeStrikeEffect(removeEmoji(nextValue)),
            checked: isMarked,
        });
    }

    function onButtonClicked(btnText) {
        try {
            makeReplacement(btnText);
            log("Succesfull usage: click");
        } catch (error) {
            logError(error);
        }
    }

    function toggleDescription({ originValue, checked }) {
        const textDiv = document.querySelector(
            'div[contenteditable="true"][role="textbox"][aria-multiline="true"]'
        );
        if (!textDiv) {
            logError("Description div node was not found");
            return;
        }

        // clear previous values
        textDiv.innerHTML = textDiv.innerHTML.replace(
            /(<br>)?===\u{200b}===.*===\u{200b}===/gu,
            ""
        );

        const isCompleteDateTimeEnabled =
            Options["add-description-completed-datetime"];
        const isOriginTitleEnabled = Options["add-description-origin-title"];

        // no description modifiers added in option
        if (!isCompleteDateTimeEnabled && !isOriginTitleEnabled) {
            return;
        }

        const dateTimeLabel =
            new Date().toLocaleDateString(undefined, {
                timeZoneName: "short",
            }) +
            ", " +
            new Date().toLocaleTimeString();
        const completedLabel = isCompleteDateTimeEnabled
            ? `Marked on: ${dateTimeLabel}`
            : "";

        const originTitleLabel = isOriginTitleEnabled
            ? `Origin title: ${originValue}`
            : "";

        const specialMark = "\u{200b}";
        const labelsDivided = [completedLabel, originTitleLabel]
            .filter((x) => x)
            .join("<br>");
        const newHtml = `===${specialMark}===<br>${labelsDivided}<br>===${specialMark}===`;

        if (checked && (completedLabel || originTitleLabel)) {
            let appendHtml = `${
                textDiv.innerHTML.length ? "<br>" : ""
            }${newHtml}`;
            textDiv.innerHTML += appendHtml;
        } else {
            textDiv.innerHTML = textDiv.innerHTML.replace(
                /(<br>)?===\u{200b}===.*===\u{200b}===/gu,
                ""
            );
        }
    }

    function addButton(container) {
        const btnWrapper = document.createElement("div");
        btnWrapper.id = BTN_WRAPPER_ID;
        btnWrapper.style.position = "absolute";
        btnWrapper.style.right = 0;

        function renderButton(btnText) {
            const button = document.createElement("button");
            button.innerText = btnText;

            button.style.border = "none";
            button.style.outline = "none";
            button.style.padding = 0;
            button.style.margin = "0 0 0 5px";
            button.style.background = "none";
            button.style.fontSize = "0.9em";

            button.addEventListener("click", () => onButtonClicked(btnText));

            btnWrapper.appendChild(button);
        }

        BUTTONS_TO_RENDER.forEach((button) => renderButton(button));

        container.appendChild(btnWrapper);
    }

    async function startAdding() {
        try {
            const isAlreadyAdded = document.getElementById(BTN_WRAPPER_ID);
            if (isAlreadyAdded) {
                return;
            }

            const input = await getInput();
            addButton(input.parentElement);
        } catch (error) {
            logError(error);
        }
    }

    function getIsRightPage() {
        return window.location.href.indexOf("eventedit") !== -1;
    }

    function log(message) {
        console.log("Google Chrome Event Checker extension log:");
        console.log(message);
        if (window.Sentry) {
            Sentry.captureMessage(message);
        }
    }

    function logError(error) {
        console.error("Google Chrome Event Checker extension error:");
        console.error(error);
        if (window.Sentry) {
            Sentry.captureException(error);
        }
    }

    function init() {
        const targetNode = document.body;
        const config = { attributes: true };

        const callback = (mutationList) => {
            for (const mutation of mutationList) {
                if (mutation.attributeName !== "data-viewkey") {
                    continue;
                }

                if (
                    document.body.dataset.viewkey.toLowerCase() !== "eventedit"
                ) {
                    continue;
                }

                startAdding();
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    }

    function initSentry() {
        const version = window.chrome?.runtime?.getManifest()?.version || "n/a";
        Sentry.init({
            dsn: "https://6ba30b2efd7341d5b70786ee9f3d1b25@o4503916873777152.ingest.sentry.io/4503916877185024",
            initialScope: {
                tags: { version },
            },
            beforeSend: (event) => {
                if (event.request.url) {
                    // don't capture current url as it contains private data (event id)
                    delete event.request.url;
                }

                return event;
            },
        });
    }

    try {
        init();

        if (Options["enable-reporting"]) {
            initSentry();
        }
    } catch (error) {
        logError(error);
    }
})();
