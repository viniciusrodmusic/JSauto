// Adiciona um único listener global para cliques (Delegação de Eventos - Event Delegation)
document.addEventListener('click', function(event) {
    
    // 1. Lógica para fechar dropdown ao clicar fora
    if (!event.target.closest('.nav-dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }

    // 2. Toggle Dropdown (Abre/Fecha) via data-attribute
    const dropdownToggle = event.target.closest('[data-dropdown-toggle]');
    if (dropdownToggle) {
        event.preventDefault(); // Evita scroll do link #
        const menuId = dropdownToggle.getAttribute('data-dropdown-toggle');
        const menu = document.getElementById(menuId);
        
        const isVisible = menu.classList.contains('show');
        
        // Fecha todos antes de abrir
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
        
        if (!isVisible) {
            menu.classList.add('show');
        }
    }

    // 3. Abrir Modal via data-attribute
    const modalTarget = event.target.closest('[data-modal-target]');
    if (modalTarget) {
        event.preventDefault();
        const modalId = modalTarget.getAttribute('data-modal-target');
        
        document.querySelectorAll('.modal-form').forEach(m => m.classList.remove('show'));
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = ''; // Remove inline display:none
            modal.classList.add('show');
        }
    }

    // 4. Fechar Modal via data-attribute com transição suave
    const modalClose = event.target.closest('[data-modal-close]');
    if (modalClose) {
        const modal = modalClose.closest('.modal-form');
        if (modal) {
            modal.classList.remove('show');
            // Aguarda animação terminar antes de permitir abrir novo modal
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }
});
