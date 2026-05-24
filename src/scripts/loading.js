// Controla a tela de loading
document.addEventListener('DOMContentLoaded', function() {
    // Simula carregamento de 2 segundos
    setTimeout(hideLoading, 1500);
});

function hideLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        
        // Remove do DOM após a animação
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}

// Se precisar mostrar loading novamente (ex: ao carregar dados)
function showLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
        loadingScreen.classList.remove('hidden');
    }
}
