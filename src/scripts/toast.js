/**
 * Sistema de Toast elegante
 */

function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.error('[Toast] Container não encontrado!');
        return;
    }

    // Criar elemento do toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Icons para cada tipo
    const icons = {
        success: 'bi-check-circle-fill',
        error: 'bi-exclamation-circle-fill',
        info: 'bi-info-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
    };

    const iconClass = icons[type] || icons.info;

    toast.innerHTML = `
        <i class="bi ${iconClass}"></i>
        <span class="toast-content">${message}</span>
        <button type="button" class="toast-close" aria-label="Fechar notificação">
            <i class="bi bi-x"></i>
        </button>
    `;

    container.appendChild(toast);

    // Handler do botão de fechar
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    // Auto-remover após duration
    const timeoutId = setTimeout(() => removeToast(toast), duration);

    // Armazenar timeout para limpeza
    toast.dataset.timeoutId = timeoutId;

    return toast;
}

function removeToast(toast) {
    if (!toast.classList.contains('removing')) {
        toast.classList.add('removing');
        
        // Limpar timeout se existir
        const timeoutId = toast.dataset.timeoutId;
        if (timeoutId) {
            clearTimeout(Number(timeoutId));
        }

        setTimeout(() => {
            toast.remove();
        }, 300);
    }
}

// Funções de conveniência
function showSuccessToast(message, duration = 4000) {
    return showToast(message, 'success', duration);
}

function showErrorToast(message, duration = 5000) {
    return showToast(message, 'error', duration);
}

function showInfoToast(message, duration = 4000) {
    return showToast(message, 'info', duration);
}

function showWarningToast(message, duration = 4500) {
    return showToast(message, 'warning', duration);
}
