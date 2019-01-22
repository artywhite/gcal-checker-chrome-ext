
const BUTTON_ID = 'as-my-complete-button';

console.warn('strike-trough MODULE init');


(async function(){
  function getInput() {
    return new Promise((resolve, reject) => {
      let input = document.querySelector('#xCancelBu ~ div input');
      if (input) {
        resolve(input);
      }

      let timeoutLink;
      const delay = 500;
      const maxIterations = 10;
      let iteration = 0;

      function checkInDelay() {
        timeoutLink = setTimeout(() => {
          let input = document.querySelector('#xCancelBu ~ div input');
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

  function onButtonClicked(event) {
    makeReplacement();
  }

  function addButton(container) {
    var alreadyButton = document.getElementById(BUTTON_ID);
    if (alreadyButton) {
      return;
    }

    var button = document.createElement('button');
    button.innerText = '✅';

    button.style.border = 'none';
    button.style.padding = 0;
    button.style.margin = 0;
    button.style.background = 'none';
    button.style.fontSize = '1.1em';

    button.id = BUTTON_ID;

    button.addEventListener('click', onButtonClicked);
    container.appendChild(button);
  }

  async function init() {
    console.warn('strike-trough init');
    const input = await getInput();
    console.warn('input found', input);
    addButton(input.parentElement);
  }

  window.addEventListener('popstate', async function(e){
    console.log('url changed');
    // TODO: check if valid url
    await init();
  });

  init();

})()
