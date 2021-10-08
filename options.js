const StorageManager = {
    set: (obj) =>
        new Promise((resolve) => chrome.storage.sync.set(obj, resolve)),

    get: (obj) =>
        new Promise((resolve) => chrome.storage.sync.get(obj, resolve))
}

// TODO: have a single place for options info -> reuse this object in options.html
const InitialOptions = {
    /**
     * Whether to add check emoji (✅) in the beginning of event title.
     */
    'add-emoji-check-mark': true,

    /**
     * Whether to add date time label when it was completed to the description.
     */
    'add-description-completed-datetime': true,

    /**
     * Whether to ada origin title to the description, which is needed for search.
     */
    'add-description-origin-title': true,

    /**
     * Whether to add strikethrough effect on event title. Note: either this or check mark emoji setting should be enabled in order to see event as completed.
     */
     'use-strikethrough-effect': true,
};

const OptionsKeys = Object.keys(InitialOptions);

async function save_options(event) {
    const { target } = event;
    const { id, checked } = target;
    const form = document.forms[0];
    const fieldset = form.children[0];
    const statusNode = document.getElementById('status');
    const currentValues = [...form.elements].reduce((result, item) => {
        if (item.nodeName.toLowerCase() !== 'input') {
            return result;
        }
        result[item.id] = item.checked;
        return result;
    }, {});

    const neitherChecked = !currentValues['add-emoji-check-mark'] && !currentValues['use-strikethrough-effect'];
    if (neitherChecked) {
        statusNode.textContent =
            'Either check mark or strikethrough effect should be selected';

        target.checked = true;

        return;
    }

    fieldset.disabled = true;

    statusNode.textContent = '';

    try {
        await StorageManager.set({ [id]: checked });
        statusNode.textContent = 'Options saved.';
    } catch (error) {
        statusNode.textContent =
            'Something went wrong. Please refresh page and try again';
    } finally {
        fieldset.disabled = false;
    }
}

async function restore_options() {
    const resolvedOptions = await StorageManager.get(InitialOptions);
    Object.keys(resolvedOptions).forEach((key) => document.getElementById(key).checked = resolvedOptions[key]);
}

document.addEventListener('DOMContentLoaded', onLoad);

function onLoad() {
    restore_options();

    const form = document.forms[0];

    form.addEventListener('change', save_options);
}