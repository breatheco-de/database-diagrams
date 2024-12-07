export function showSnackbar(message, duration = 3000) {
    // Remove any existing snackbars
    const existingSnackbars = document.querySelectorAll('.snackbar');
    existingSnackbars.forEach(s => document.body.removeChild(s));
    
    const snackbar = document.createElement('div');
    snackbar.className = 'snackbar';
    snackbar.textContent = message;
    document.body.appendChild(snackbar);
    
    // Force reflow
    snackbar.offsetHeight;
    
    // Show snackbar
    requestAnimationFrame(() => {
        snackbar.classList.add('show');
    });
    
    // Hide and remove after duration
    setTimeout(() => {
        snackbar.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(snackbar)) {
                document.body.removeChild(snackbar);
            }
        }, 300); // Match transition duration
    }, duration);
}
