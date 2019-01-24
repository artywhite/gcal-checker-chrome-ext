(async function(){
  const BUTTON_ID = 'as-my-complete-button';
  const INPUT_SELECTOR = '#xCancelBu ~ div input';

  function getInput() {
    return new Promise((resolve, reject) => {
      const input = document.querySelector(INPUT_SELECTOR);
      if (input) {
        resolve(input);
      }

      const delay = 500;
      const maxIterations = 10;
      let iteration = 0;
      let timeoutLink;

      function checkInDelay() {
        timeoutLink = setTimeout(() => {
          const input = document.querySelector(INPUT_SELECTOR);
          if (input) {
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
    let nextValue = input.value;

    const isAlreadyStriked = [...nextValue].some(item => item === '\u0336');

    if (isAlreadyStriked) {
      // TODO: emoji icon setting
      // nextValue = nextValue.slice(2);
      nextValue = nextValue.split('').filter(item => item !== '\u0336').join('');
    } else {
      nextValue = nextValue.split('').map((item => item + '\u0336')).join("");
      // TODO: emoji icon setting
      // nextValue = `✅ ${nextValue}`
    }

    input.value = `${nextValue}`;

    input.dispatchEvent(new Event('input', { 'bubbles': true }))
  }

  function onButtonClicked() {
    makeReplacement();
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

  function init() {
    startAdding();

    window.addEventListener('popstate', async function(e) {
      await startAdding();
    });
  }

  init();
})()
