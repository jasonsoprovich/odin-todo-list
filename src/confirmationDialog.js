function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

const dialogElement = qs('#confirmation-dialog');
const messageElement = qs('#confirmation-message', dialogElement);
const confirmOkBtn = qs('#confirm-ok-btn', dialogElement);
const confirmCancelBtn = qs('#confirm-cancel-btn', dialogElement);

let currentResolve = null;

function show(message = 'Are you sure?') {
  return new Promise((resolve) => {
    currentResolve = resolve;
    messageElement.textContent = message;
    if (dialogElement && typeof dialogElement.showModal === 'function') {
      dialogElement.showModal();
    } else {
      // eslint-disable-next-line no-console
      console.error(
        'Confirmation dialog element not found or showModal not supported.'
      );
      resolve(false);
    }
  });
}

function handleConfirmation(confirmed) {
  if (dialogElement && typeof dialogElement.close === 'function') {
    dialogElement.close();
  }
  if (currentResolve) {
    currentResolve(confirmed);
    currentResolve = null;
  }
}

if (confirmOkBtn) {
  confirmOkBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleConfirmation(true);
  });
}

if (confirmCancelBtn) {
  confirmCancelBtn.addEventListener('click', () => {
    handleConfirmation(false);
  });
}

if (dialogElement) {
  dialogElement.addEventListener('close', () => {
    if (currentResolve) {
      handleConfirmation(false);
    }
  });
}

export default {
  show,
};
