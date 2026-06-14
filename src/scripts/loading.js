function hideLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');

        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}

function showLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
        loadingScreen.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const isManagementPage = document.getElementById('logout-btn');
    if (!isManagementPage) {
        setTimeout(hideLoading, 1500);
    }
});
