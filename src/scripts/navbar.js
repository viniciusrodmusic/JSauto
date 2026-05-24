function toggleDropdown(event, menuId) {
    event.preventDefault();
    const menu = document.getElementById(menuId);
    const isVisible = menu.classList.contains('show');
    
    // Fecha todos os dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(m => {
        m.classList.remove('show');
    });
    
    // Abre o dropdown clicado se estava fechado
    if (!isVisible) {
        menu.classList.add('show');
    }
}

// Fecha dropdown ao clicar fora
document.addEventListener('click', function(event) {
    if (!event.target.closest('.nav-dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});
