/** Create a button element */
export function createButton(
    text: string,
    className: string,
    onClick: () => void
): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.className = className;
    btn.addEventListener('click', onClick);
    return btn;
}

/** Create status element */
export function createStatus(): HTMLSpanElement {
    const span = document.createElement('span');
    span.id = 'md-export-status';
    return span;
}

/** Update status text */
export function updateStatus(message: string): void {
    const el = document.getElementById('md-export-status');
    if (el) el.textContent = message;
}

/** Show loading state on button */
export function setButtonLoading(btn: HTMLButtonElement, loading: boolean, text: string): void {
    btn.disabled = loading;
    btn.textContent = loading ? 'Loading...' : text;
}
