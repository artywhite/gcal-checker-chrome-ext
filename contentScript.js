(async function () {
    const BUTTON_ID = 'gcal-checker-chrome-ext-btn';
    const INPUT_SELECTOR = '#xCancelBu ~ div input';

    const storageGet = (obj) =>
        new Promise((resolve) => chrome.storage.sync.get(obj, resolve));

    function getInput() {
        return new Promise((resolve, reject) => {
            const delay = 500;
            const maxIterations = 15;
            let iteration = 0;
            let timeoutLink;

            let isRightPage = getIsRightPage();
            const input = document.querySelector(INPUT_SELECTOR);

            if (isRightPage && input) {
                resolve(input);

                return;
            }

            function checkInDelay() {
                timeoutLink = setTimeout(() => {
                    isRightPage = getIsRightPage();
                    const input = document.querySelector(INPUT_SELECTOR);
                    if (isRightPage && input) {
                        resolve(input);
                        clearTimeout(timeoutLink);

                        return;
                    }

                    if (iteration > maxIterations) {
                        reject(new Error('Input node was not found; timeout'));
                        return;
                    }

                    iteration += 1;
                    checkInDelay();
                }, delay);
            }

            checkInDelay();
        });
    }

    async function makeReplacement() {
        const input = await getInput();
        const originValue = input.value;
        const { addEmojiCheckMark } = await storageGet({
            addEmojiCheckMark: false, // false -- default value
        });
        let nextValue = input.value;

        const isAlreadyStriked = [...nextValue].some(
            (item) => item === '\u0336'
        );

        if (isAlreadyStriked) {
            // remove strike effect and first emoji
            if (nextValue[0] === '✅') {
                nextValue = nextValue.slice(2); // emoji and space
            }

            nextValue = nextValue
                .split('')
                .filter((item) => item !== '\u0336')
                .join('');
        } else {
            // add strike effect and first emoji
            nextValue = nextValue
                .split('')
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

                    return item + '\u0336';
                })
                .join('');

            if (addEmojiCheckMark) {
                nextValue = `✅ ${nextValue}`;
            }
        }

        input.value = `${nextValue}`;

        input.dispatchEvent(new Event('input', { bubbles: true }));

        try {
            toggleDescription({
                originValue: isAlreadyStriked ? nextValue : originValue,
                currentValue: nextValue,
                checked: !isAlreadyStriked
            });
        } catch (error) {
            console.error(error);
        }
    }

    function onButtonClicked() {
        makeReplacement();
    }

    function toggleDescription({ originValue, checked }) {
        const textDiv = document.querySelector('div[aria-label="Description"][role="textbox"]');
        if (!textDiv) {
            // TODO: what?
            return;
        }
        const specialMark = "\u{200b}";
        const dateTimeLabel = (new Date()).toLocaleDateString(undefined, { timeZoneName: 'short' }) + ", " + (new Date()).toLocaleTimeString();
        if (checked) {
            textDiv.innerHTML += `<br>===${specialMark}===<br>Completed on: ${dateTimeLabel}<br>Origin title: ${originValue}<br>===${specialMark}===`;
        } else {
            textDiv.innerHTML = textDiv.innerHTML.replace(/<br>===\u{200b}===<br>Completed on:.*<br>===\u{200b}===/gu, "");
        }
    }

    function addButton(container) {
        const alreadyButton = document.getElementById(BUTTON_ID);
        if (alreadyButton) {
            return;
        }

        const button = document.createElement('button');
        button.innerText = '✅';

        button.style.border = 'none';
        button.style.outline = 'none';
        button.style.padding = 0;
        button.style.margin = 0;
        button.style.background = 'none';
        button.style.fontSize = '1.1em';

        button.id = BUTTON_ID;

        button.addEventListener('click', onButtonClicked);

        container.appendChild(button);
    }

    async function startAdding() {
        try {
            const input = await getInput();
            addButton(input.parentElement);
        } catch (error) {
            // TODO
        }
    }

    function getIsRightPage() {
        return window.location.href.indexOf('eventedit') !== -1;
    }

    function init() {
        startAdding();

        window.addEventListener('popstate', function (e) {
            startAdding();
        });
    }

    init();
})();
