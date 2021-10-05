const StorageManager = {
    set: (obj) =>
        new Promise((resolve) => chrome.storage.sync.set(obj, resolve)),

    get: (obj) =>
        new Promise((resolve) => chrome.storage.sync.get(obj, resolve))
}

const Options = {
    /**
     * Whether to add check emoji (✅) in the beginning of event title.
     */
    'add-emoji-check-mark': true,

    /**
     * Whether to add date time label when it was completed to the description.
     */
    'add-description-completed-datetime': true,

    /**
     * Whether to ad origin title to the description, which is needed for search.
     */
    'add-description-origin-title': true,
};

const OptionsKeys = Object.keys(Options);

async function save_options(event) {
    const { target } = event;

    const { id, checked } = target;
    console.log('save_options', id, checked);

    const statusNode = document.getElementById('status');
    document.forms[0].children[0].disabled = true;

    try {
        await StorageManager.set({ [id]: checked });
        statusNode.textContent = 'Options saved.';
        setTimeout(function () {
            statusNode.textContent = '';
        }, 1500);
    } catch (error) {
        statusNode.textContent =
            'Something went wrong. Please refresh page and try again';
    } finally {
        document.forms[0].children[0].disabled = false;
    }
}

async function restore_options() {
    const resolvedOptions = await StorageManager.get(Options);
    Object.keys(resolvedOptions).forEach((key) => document.getElementById(key).checked = resolvedOptions[key]);
}

document.addEventListener('DOMContentLoaded', onLoad);

function onLoad() {
    restore_options();

    const form = document.forms[0];

    form.addEventListener('change', save_options);
}