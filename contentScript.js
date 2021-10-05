(async function () {
    const BUTTON_ID = 'gcal-checker-chrome-ext-btn';
    const INPUT_SELECTOR = '#xCancelBu ~ div input';

    const storageGet = (obj) =>
        new Promise((resolve) => chrome.storage.sync.get(obj, resolve));

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

        // no need to touch empty input
        if (!originValue) {
            return;
        }

        const Options = await storageGet({
            'add-emoji-check-mark': true, // true -- default value
            'add-description-completed-datetime': true,
            'add-description-origin-title': true,
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

            if (Options['add-emoji-check-mark']) {
                nextValue = `✅ ${nextValue}`;
            }
        }

        input.value = `${nextValue}`;

        input.dispatchEvent(new Event('input', { bubbles: true }));

        try {
            toggleDescription({
                originValue: isAlreadyStriked ? nextValue : originValue,
                currentValue: nextValue,
                checked: !isAlreadyStriked,
                options: Options
            });
        } catch (error) {
            console.error(error);
        }
    }

    function onButtonClicked() {
        makeReplacement();
    }

    function toggleDescription({ originValue, checked, options }) {
        const textDiv = document.querySelector('div[contenteditable="true"][role="textbox"][aria-multiline="true"]');
        if (!textDiv) {
            console.error('Description div node was not found');
            return;
        }

        const dateTimeLabel = (new Date()).toLocaleDateString(undefined, { timeZoneName: 'short' }) + ", " + (new Date()).toLocaleTimeString();
        const completedLabel = options['add-description-completed-datetime']
            ? `Completed on: ${dateTimeLabel}`
            : '';

        const originTitleLabel = options['add-description-origin-title']
            ? `Origin title: ${originValue}`
            : ''

        const specialMark = "\u{200b}";
        const labelsDivided = [completedLabel, originTitleLabel].filter(x => x).join('<br>');
        const newHtml = `===${specialMark}===<br>${labelsDivided}<br>===${specialMark}===`;

        if (checked && (completedLabel || originTitleLabel)) {
            let appendHtml = `${textDiv.innerHTML.length ? '<br>' : ''}${newHtml}`;
            textDiv.innerHTML += appendHtml;
        } else {
            textDiv.innerHTML = textDiv.innerHTML.replace(/(<br>)?===\u{200b}===.*===\u{200b}===/gu, "");
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

        // TODO: apparently popstate event is not being fired always,
        // so use Mutation Observer and check whether body's [data-viewfamily] got changed
        // (by using attributeFilter)
        window.addEventListener('popstate', function (e) {
            startAdding();
        });
    }

    init();
})();
