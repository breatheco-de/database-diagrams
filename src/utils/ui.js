export function showSnackbar(message, duration = 3000) {
    const snackbar = document.createElement('div');
    snackbar.className = 'snackbar';
    snackbar.textContent = message;
    document.body.appendChild(snackbar);
    
    // Trigger reflow for animation
    snackbar.offsetHeight;
    snackbar.classList.add('show');
    
    setTimeout(() => {
        snackbar.classList.remove('show');
        setTimeout(() => document.body.removeChild(snackbar), 300);
    }, duration);
}
