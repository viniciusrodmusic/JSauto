/**
 * Constante da URL base da API (Backend em Nest.js).
 * Esta URL deve ser alterada de acordo com o ambiente (desenvolvimento vs produção).
 */
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Função genérica para enviar dados JSON a um endpoint da API de forma assíncrona.
 * 
 * @param {string} endpoint - O caminho para o recurso (ex: '/clientes').
 * @param {Object} data - Os dados estruturados (JSON) a serem enviados.
 * @param {string} method - O verbo HTTP a ser utilizado (POST, PUT, DELETE, etc.). Padrão: 'POST'.
 * @returns {Promise<Object>} Resposta resolvida da API em formato JSON.
 */
async function sendDataToApi(endpoint, data, method = 'POST') {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                // Se a API Nest.js utilizar JWT (AuthGuard), basta descomentar a linha abaixo
                // e recuperar o token de onde estiver armazenado (ex: localStorage).
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        // O Nest.js tipicamente devolve status codes de erro estruturados.
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Lança um erro detalhado caso a API retorne sua própria string de erro (ex: class-validator).
            throw new Error(errorData.message || 'Ocorreu um erro ao comunicar-se com a API do servidor.');
        }

        return await response.json();
    } catch (error) {
        console.error(`[API Controller] Erro na requisição para ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Mapeamento das entidades (forms) para seus respectivos endpoints no backend.
 * O nome da propriedade deve bater com o 'data-entity' no form HTML.
 */
const ENDPOINTS_MAP = {
    'funcionario': '/funcionarios',
    'cliente': '/clientes',
    'produto': '/produtos',
    'veiculo': '/veiculos'
};

/**
 * Listener global para interceptar todos os formulários da página
 * que possuam o atributo mapeador 'data-entity'.
 */
document.addEventListener('submit', async function(event) {
    const form = event.target;
    
    // Verifica se o formulário interceptado foi um dos modais previstos
    if (form.matches('form[data-entity]')) {
        event.preventDefault(); // Impede o reload indesejado de página do padrão submit HTML

        const entity = form.getAttribute('data-entity');
        const endpoint = ENDPOINTS_MAP[entity];
        
        if (!endpoint) {
            console.error(`Endpoint não cadastrado no mapa para a entidade: ${entity}`);
            return;
        }

        // Utilização de FormData para varrer todos os campos <input name="..."> de maneira inteligente
        const formData = new FormData(form);

        /**
         * Converte campos com notação de colchetes (ex: address[street])
         * em objetos aninhados para compatibilidade com o DTO do NestJS.
         */
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

        const data = buildNestedObject(formData);

        // Processamentos opcionais: Converter IDs ou Preços para numéricos se o NestJS exigir rigidez
        if (data.year) {
            data.year = parseInt(data.year, 10);
        }
        if (data.price) {
            data.price = parseFloat(data.price);
        }
        if (data.stock) {
            if (data.stock.quantity !== undefined) data.stock.quantity = parseInt(data.stock.quantity, 10);
            if (data.stock.minStock !== undefined) data.stock.minStock = parseInt(data.stock.minStock, 10);
            if (data.stock.maxStock !== undefined) data.stock.maxStock = parseInt(data.stock.maxStock, 10);
        }

        const submitBtn = form.querySelector('button[type="submit"]');

        try {
            // Loading state (melhoria de UX) e prevenção de múltiplos envios (Spam)
            if (submitBtn) {
                submitBtn.dataset.originalText = submitBtn.textContent;
                submitBtn.textContent = 'Enviando...';
                submitBtn.disabled = true;
            }

            // Aguarda a resposta do Nest.js
            const result = await sendDataToApi(endpoint, data);

            alert(`Cadastro de ${entity} efetuado com sucesso!`);
            
            form.reset(); // Limpa os dados do formulário preenchido

            // Fecha o modal atual com transição suave
            const modal = form.closest('.modal-form');
            if (modal) {
                modal.classList.remove('show');
                // Aguarda animação terminar
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 400);
            }

        } catch (error) {
            // Falha
            alert(`Falha ao registrar dados. \n${error.message}`);
        } finally {
            // Sempre desfaz o estado de loading do botão
            if (submitBtn) {
                submitBtn.textContent = submitBtn.dataset.originalText || 'Cadastrar';
                submitBtn.disabled = false;
            }
        }
    }
});
