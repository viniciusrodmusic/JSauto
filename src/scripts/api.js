const API_BASE_URL = 'https://auto-bots-api-production.up.railway.app';

/**
 * Requisição genérica à API com suporte a cookies HTTPOnly (credentials).
 */
async function apiRequest(endpoint, options = {}) {
    const { method = 'GET', body } = options;

    const config = {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    };

    if (body !== undefined) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message || 'Ocorreu um erro ao comunicar-se com a API do servidor.');
        throw new Error(message);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

async function login(email, password) {
    return apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
    });
}

async function fetchUsers() {
    return apiRequest('/users');
}

const ENDPOINTS_MAP = {
    funcionario: '/users/register',
    cliente: '/clientes',
    produto: '/produtos',
    veiculo: '/veiculos',
};

function buildNestedObject(formData) {
    const result = {};
    for (const [key, value] of formData.entries()) {
        const match = key.match(/^([^\[]+)\[([^\]]+)\]$/);
        if (match) {
            const [, parent, child] = match;
            if (!result[parent]) result[parent] = {};
            result[parent][child] = value;
        } else {
            result[key] = value;
        }
    }
    return result;
}

function renderFuncionariosList(users) {
    const listEl = document.getElementById('funcionarios-list');
    const panelEl = document.getElementById('panel-funcionarios');
    if (!listEl || !panelEl) return;

    if (!users || users.length === 0) {
        listEl.innerHTML = '<p class="data-panel__empty">Nenhum funcionário cadastrado.</p>';
    } else {
        listEl.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>E-mail</th>
                        <th>Telefone</th>
                        <th>Cidade</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map((user) => `
                        <tr>
                            <td>${user.name} ${user.lastname}</td>
                            <td>${user.email}</td>
                            <td>${user.phone || '—'}</td>
                            <td>${user.address?.city || '—'}</td>
                            <td>${user.address?.state || '—'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    document.querySelectorAll('.modal-form').forEach((m) => m.classList.remove('show'));
    panelEl.hidden = false;
}

async function showFuncionarios() {
    const listEl = document.getElementById('funcionarios-list');
    const panelEl = document.getElementById('panel-funcionarios');
    if (!listEl || !panelEl) return;

    listEl.innerHTML = '<p class="data-panel__loading">Carregando funcionários...</p>';
    panelEl.hidden = false;

    try {
        const users = await fetchUsers();
        renderFuncionariosList(users);
    } catch (error) {
        listEl.innerHTML = `<p class="data-panel__error">Falha ao carregar funcionários.<br>${error.message}</p>`;
    }
}

document.addEventListener('submit', async function (event) {
    const form = event.target;

    if (form.matches('#login-form')) {
        event.preventDefault();

        const email = form.querySelector('#email').value.trim();
        const password = form.querySelector('#senha').value;
        const submitBtn = form.querySelector('button[type="submit"]');

        if (!email || !password) {
            alert('Preencha e-mail e senha.');
            return;
        }

        try {
            if (submitBtn) {
                submitBtn.dataset.originalText = submitBtn.textContent;
                submitBtn.textContent = 'Entrando...';
                submitBtn.disabled = true;
            }

            await login(email, password);
            window.location.href = 'gerenciamento.html';
        } catch (error) {
            alert(`Falha no login.\n${error.message}`);
        } finally {
            if (submitBtn) {
                submitBtn.textContent = submitBtn.dataset.originalText || 'Entrar';
                submitBtn.disabled = false;
            }
        }
        return;
    }

    if (form.matches('form[data-entity]')) {
        event.preventDefault();

        const entity = form.getAttribute('data-entity');
        const endpoint = ENDPOINTS_MAP[entity];

        if (!endpoint) {
            console.error(`Endpoint não cadastrado no mapa para a entidade: ${entity}`);
            return;
        }

        const formData = new FormData(form);
        const data = buildNestedObject(formData);

        if (data.year) data.year = parseInt(data.year, 10);
        if (data.price) data.price = parseFloat(data.price);
        if (data.stock) {
            if (data.stock.quantity !== undefined) data.stock.quantity = parseInt(data.stock.quantity, 10);
            if (data.stock.minStock !== undefined) data.stock.minStock = parseInt(data.stock.minStock, 10);
            if (data.stock.maxStock !== undefined) data.stock.maxStock = parseInt(data.stock.maxStock, 10);
        }

        const submitBtn = form.querySelector('button[type="submit"]');

        try {
            if (submitBtn) {
                submitBtn.dataset.originalText = submitBtn.textContent;
                submitBtn.textContent = 'Enviando...';
                submitBtn.disabled = true;
            }

            await apiRequest(endpoint, { method: 'POST', body: data });

            alert(`Cadastro de ${entity} efetuado com sucesso!`);
            form.reset();

            const modal = form.closest('.modal-form');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 400);
            }
        } catch (error) {
            alert(`Falha ao registrar dados.\n${error.message}`);
        } finally {
            if (submitBtn) {
                submitBtn.textContent = submitBtn.dataset.originalText || 'Cadastrar';
                submitBtn.disabled = false;
            }
        }
    }
});

document.addEventListener('click', function (event) {
    const viewTarget = event.target.closest('[data-view-target]');
    if (viewTarget) {
        event.preventDefault();
        const view = viewTarget.getAttribute('data-view-target');
        if (view === 'funcionarios') {
            showFuncionarios();
        }
        return;
    }

    const closePanel = event.target.closest('[data-panel-close]');
    if (closePanel) {
        const panel = document.getElementById('panel-funcionarios');
        if (panel) panel.hidden = true;
    }
});
