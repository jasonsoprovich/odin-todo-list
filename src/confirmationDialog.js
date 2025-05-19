function qs(selector, scope = document) {
  if (!scope) return null;
  return scope.querySelector(selector);
}

const dialogElement = qs('#confirmation-dialog');
let messageElement = null;
let confirmButton = null;
let cancelButton = null;
let currentConfirmCallback = null;

function closeDialog() {
  if (dialogElement) {
    dialogElement.close();
  }
  currentConfirmCallback = null;
}

function handleConfirm() {
  console.log('✅ handleConfirm fired; callback=', currentConfirmCallback);
  if (typeof currentConfirmCallback === 'function') {
    currentConfirmCallback();
  }
  closeDialog();
}

if (dialogElement) {
  messageElement = qs('#confirmation-message', dialogElement);
  confirmButton = qs('#confirm-yes-btn', dialogElement);
  cancelButton = qs('#confirm-no-btn', dialogElement);

  confirmButton.addEventListener('click', handleConfirm);
  cancelButton.addEventListener('click', closeDialog);
} else {
  // eslint-disable-next-line no-console
  console.error(
    'Confirmation dialog element (#confirmation-dialog) not found in the DOM. Dialog will not function.'
  );
}

const confirmationDialog = {
  open(message, onConfirm) {
    if (dialogElement && messageElement) {
      messageElement.textContent = message;
      currentConfirmCallback = onConfirm;
      dialogElement.showModal();
    } else {
      // eslint-disable-next-line no-console
      console.error(
        'Cannot open confirmation dialog: essential elements are missing. Check initialization logs.'
      );
    }
  },
};

export default confirmationDialog;
