const API_BASE_URL = 'https://auto-bots-api-production.up.railway.app';
const AUTH_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

let authRefreshTimerId = null;

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

    console.log(`[API] ${method} ${endpoint}`, { body: config.body });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    console.log(`[API] Resposta: ${response.status} ${response.statusText}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message || 'Ocorreu um erro ao comunicar-se com a API do servidor.');
        
        console.error(`[API] Erro HTTP ${response.status}:`, errorData);
        
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    const text = await response.text();
    const result = text ? JSON.parse(text) : null;
    console.log(`[API] Dados recebidos:`, result);
    
    return result;
}

async function login(email, password) {
    console.log('[Auth] Iniciando login para:', email);
    const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
    });
    console.log('[Auth] Login bem-sucedido. Aguardando propagação do cookie...');
    // Pequeno delay para garantir que o cookie HTTPOnly foi armazenado
    await new Promise(resolve => setTimeout(resolve, 500));
    return result;
}

async function logout() {
    stopAuthRefreshInterval();
    try {
        await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.warn('[API] Erro ao encerrar sessão:', error.message);
    }
    window.location.href = 'index.html';
}

async function fetchProfile() {
    return apiRequest('/auth/profile');
}

/**
 * Busca o perfil com retry automático em caso de falha
 */
async function fetchProfileWithRetry(maxRetries = 3, delayMs = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Auth] Tentativa ${attempt}/${maxRetries} de buscar perfil...`);
            return await fetchProfile();
        } catch (error) {
            lastError = error;
            console.warn(`[Auth] Tentativa ${attempt} falhou:`, error.message);
            
            if (attempt < maxRetries) {
                console.log(`[Auth] Aguardando ${delayMs}ms antes de tentar novamente...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    
    throw lastError;
}

async function refreshSession() {
    return apiRequest('/auth/refresh', { method: 'POST' });
}

function stopAuthRefreshInterval() {
    if (authRefreshTimerId !== null) {
        clearInterval(authRefreshTimerId);
        authRefreshTimerId = null;
    }
}

function startAuthRefreshInterval() {
    stopAuthRefreshInterval();

    authRefreshTimerId = setInterval(async () => {
        try {
            await refreshSession();
        } catch (error) {
            console.warn('[API] Falha ao renovar sessão:', error.message);
            if (handleUnauthorized(error)) {
                stopAuthRefreshInterval();
            }
        }
    }, AUTH_REFRESH_INTERVAL_MS);
}

async function fetchUsers() {
    return apiRequest('/users');
}

function hideLoadingScreen() {
    if (typeof hideLoading === 'function') {
        hideLoading();
    }
}

async function initManagementPage() {
    if (!document.getElementById('logout-btn')) return;

    console.log('[Auth] Inicializando página de gerenciamento...');

    try {
        console.log('[Auth] Buscando perfil do usuário com retry...');
        const profile = await fetchProfileWithRetry(3, 1500);
        
        console.log('[Auth] Perfil recebido:', profile);
        
        const userLabel = document.getElementById('user-label');
        if (userLabel && profile) {
            const name = [profile.name, profile.lastname].filter(Boolean).join(' ');
            userLabel.textContent = name || profile.email || '';
            console.log('[Auth] Nome do usuário definido:', name);
        }
    } catch (error) {
        console.error('[Auth] Erro ao buscar perfil após retries:', error);
        console.error('[Auth] Status do erro:', error.status);
        console.error('[Auth] Mensagem do erro:', error.message);
        
        const errorMsg = error.status === 401 || error.status === 403
            ? 'Sua sessão expirou. Por favor, faça login novamente.'
            : `Erro ao carregar dados: ${error.message}`;
        
        showErrorToast(errorMsg);
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    hideLoadingScreen();
    console.log('[Auth] Iniciando intervalo de renovação de autenticação...');
    startAuthRefreshInterval();
}

function handleUnauthorized(error) {
    const isAuthError = error.status === 401 || error.status === 403;

    if (isAuthError) {
        showErrorToast('Sessão inválida. Faça login novamente.');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return true;
    }

    return false;
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
        if (handleUnauthorized(error)) return;
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
            showWarningToast('Preencha e-mail e senha.');
            return;
        }

        try {
            if (submitBtn) {
                submitBtn.dataset.originalText = submitBtn.textContent;
                submitBtn.textContent = 'Entrando...';
                submitBtn.disabled = true;
            }

            await login(email, password);
            showSuccessToast('Login realizado com sucesso!');
            
            // Aguardar um pouco antes de redirecionar para o usuário ver o toast
            setTimeout(() => {
                window.location.href = 'gerenciamento.html';
            }, 1500);
        } catch (error) {
            showErrorToast(`Falha no login: ${error.message}`);
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

            showSuccessToast(`Cadastro de ${entity} efetuado com sucesso!`);
            form.reset();

            const modal = form.closest('.modal-form');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 400);
            }
        } catch (error) {
            showErrorToast(`Falha ao registrar dados: ${error.message}`);
        } finally {
            if (submitBtn) {
                submitBtn.textContent = submitBtn.dataset.originalText || 'Cadastrar';
                submitBtn.disabled = false;
            }
        }
    }
});

document.addEventListener('click', function (event) {
    if (event.target.closest('#logout-btn')) {
        logout();
        return;
    }

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

document.addEventListener('DOMContentLoaded', initManagementPage);

document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || !document.getElementById('logout-btn')) return;

    refreshSession().catch(function (error) {
        console.warn('[API] Falha ao renovar sessão ao retornar à aba:', error.message);
        if (handleUnauthorized(error)) {
            stopAuthRefreshInterval();
        }
    });
});

window.addEventListener('beforeunload', stopAuthRefreshInterval);
