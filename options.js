let storageSet = (obj) =>
    new Promise((resolve) => chrome.storage.sync.set(obj, resolve));
let storageGet = (obj) =>
    new Promise((resolve) => chrome.storage.sync.get(obj, resolve));

async function save_options() {
    const addEmojiCheckMarkNode = document.getElementById(
        'add-emoji-check-mark'
    );
    const statusNode = document.getElementById('status');
    addEmojiCheckMarkNode.disabled = true;

    try {
        await storageSet({ addEmojiCheckMark: addEmojiCheckMarkNode.checked });
        statusNode.textContent = 'Options saved.';
        setTimeout(function () {
            statusNode.textContent = '';
        }, 1500);
    } catch (error) {
        statusNode.textContent =
            'Something went wrong. Please refresh page and try again';
    } finally {
        addEmojiCheckMarkNode.disabled = false;
    }
}

async function restore_options() {
    const { addEmojiCheckMark } = await storageGet({
        addEmojiCheckMark: false, // false -- default value
    });
    document.getElementById('add-emoji-check-mark').checked = addEmojiCheckMark;
}
document.addEventListener('DOMContentLoaded', restore_options);
document
    .getElementById('add-emoji-check-mark')
    .addEventListener('change', save_options);
