# Documentação - JS Auto (Sistema de Gestão)

## 📋 Índice
1. [Visão Geral do Projeto](#visão-geral)
2. [Estrutura do JavaScript](#estrutura-do-javascript)
3. [Integração com Backend NestJS](#integração-com-backend-nestjs)
4. [Autenticação e Segurança](#autenticação-e-segurança)
5. [Fluxo de Requisições](#fluxo-de-requisições)

---

## 🎯 Visão Geral

O **JS Auto** é um sistema de gestão empresarial com interface em HTML/CSS/JavaScript que se conecta a um backend em **NestJS**. O projeto gerencia:
- **Funcionários** (Nome, CPF, Telefone, Cargo, Salário)
- **Clientes** (Nome, CPF/CNPJ, Contato, Email, Endereço)
- **Produtos** (Nome, Descrição, Preço, Estoque)
- **Veículos** (Placa, Modelo, Marca, Ano, Cliente)

---

## 🔧 Estrutura do JavaScript

### 1. **loading.js** - Tela de Carregamento
Gerencia a animação de splash screen exibida ao entrar no sistema.

```javascript
// Mostra tela de loading por 1.5 segundos
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(hideLoading, 1500);
});

function hideLoading() { /* Remove tela */ }
function showLoading() { /* Mostra tela novamente */ }
```

**Quando usar:**
- Ao carregar dados do backend
- Em operações que demoram

---

### 2. **navbar.js** - Menu de Navegação e Modais
Utiliza **Event Delegation** (delegação de eventos) para gerenciar interações na página sem precisar de múltiplos listeners.

#### Funcionalidades:

**A) Dropdowns (Menus Flutuantes)**
```javascript
// Data-attribute: [data-dropdown-toggle="cadastro"]
// Quando clicado: abre/fecha o menu com ID "cadastro"
```

**B) Abrir Modais**
```javascript
// Link HTML: <a href="#" data-modal-target="modal-funcionario">
// Resultado: abre o modal com id="modal-funcionario"
```

**C) Fechar Modais**
```javascript
// Botão HTML: <span class="close-btn" data-modal-close>&times;</span>
// Resultado: fecha o modal mais próximo
```

**Como funciona Event Delegation:**
- Um único listener em `document` intercepta TODOS os cliques
- Usa `event.target.closest()` para encontrar o elemento relevante
- Muito eficiente (reduz número de listeners)

---

### 3. **api.js** - Comunicação com Backend
O coração do projeto. Aqui acontecem as requisições HTTP para o NestJS.

#### Variáveis Importantes:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
// Endpoint base do seu backend NestJS
```

#### Função Principal:
```javascript
async function sendDataToApi(endpoint, data, method = 'POST') {
    // endpoint: Ex: '/funcionarios'
    // data: Objeto JSON com dados do formulário
    // method: 'POST', 'PUT', 'DELETE', etc.
    // Retorna: Resposta JSON do servidor
}
```

#### Mapeamento de Rotas:
```javascript
const ENDPOINTS_MAP = {
    'funcionario': '/funcionarios',
    'cliente': '/clientes',
    'produto': '/produtos',
    'veiculo': '/veiculos'
};
```

**Exemplo de uso automático:**
```html
<form data-entity="funcionario">
    <input name="Nome" />
    <button type="submit">Cadastrar</button>
</form>
```
→ Quando enviado, chama: `POST /api/funcionarios` com os dados do formulário

#### Tratamento de Erros:
- Se a API retorna erro (status ≠ 200-299), lança erro
- Mensagem de erro vem do servidor (ex: validação)
- O Frontend captura e exibe `alert()` ao usuário

---

## 🚀 Integração com Backend NestJS

### Estrutura Esperada do Backend

Seu backend NestJS precisa ter **controllers** para cada entidade:

```
src/
├── funcionarios/
│   ├── funcionarios.controller.ts
│   ├── funcionarios.service.ts
│   └── dto/
│       └── create-funcionario.dto.ts
├── clientes/
├── produtos/
└── veiculos/
```

### Endpoints Esperados

O frontend espera estes endpoints no seu NestJS:

| Método | URL | Descrição |
|--------|-----|-----------|
| POST | `/api/funcionarios` | Cria novo funcionário |
| GET | `/api/funcionarios` | Lista todos |
| PUT | `/api/funcionarios/:id` | Atualiza |
| DELETE | `/api/funcionarios/:id` | Deleta |
| POST | `/api/clientes` | Cria novo cliente |
| POST | `/api/produtos` | Cria novo produto |
| POST | `/api/veiculos` | Cria novo veículo |

### Exemplo de Controller NestJS

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { FuncionariosService } from './funcionarios.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';

@Controller('api/funcionarios')
export class FuncionariosController {
    constructor(private readonly funcionariosService: FuncionariosService) {}

    @Post()
    create(@Body() createFuncionarioDto: CreateFuncionarioDto) {
        return this.funcionariosService.create(createFuncionarioDto);
    }
}
```

### Exemplo de DTO (Data Transfer Object)

```typescript
export class CreateFuncionarioDto {
    Nome: string;
    CPF: string;
    Telefone?: string;
    Cargo?: string;
    Salario?: number;
}
```

O NestJS valida automaticamente com `ValidationPipe`.

---

## 🔐 Autenticação e Segurança

### Atualmente
O projeto **não possui autenticação implementada**. Qualquer pessoa pode usar.

### Como Adicionar JWT (Token)

#### 1. **No Backend NestJS:**

```typescript   
// Instalar: npm install @nestjs/jwt @nestjs/passport passport passport-jwt

// auth.module.ts
@Module({
    imports: [
        JwtModule.register({
            secret: 'sua_chave_secreta_aqui',
            signOptions: { expiresIn: '24h' },
        }),
    ],
})
export class AuthModule {}

// auth.controller.ts
@Post('login')
login(@Body() loginDto: LoginDto) {
    const token = this.jwtService.sign({ userId: user.id });
    return { access_token: token };
}

// auth.guard.ts - Protege as rotas
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// funcionarios.controller.ts - Usa a guard
@Post()
@UseGuards(JwtAuthGuard)
create(@Body() createFuncionarioDto: CreateFuncionarioDto) {
    // Agora precisa de token válido
}
```

#### 2. **No Frontend (api.js):**

```javascript
// Descomente esta linha no api.js:
'Authorization': `Bearer ${localStorage.getItem('token')}`

// Após login, salve o token:
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
});

const { access_token } = await loginResponse.json();
localStorage.setItem('token', access_token);
```

### Tokens JWT Explicado
- **O que é:** String criptografada contendo informações do usuário
- **Propósito:** Provar que o usuário está autenticado
- **Prazo:** Expira em 24h (exemplo)
- **Armazenamento:** `localStorage` no navegador
- **Segurança:** Sempre use HTTPS em produção

---

## 📡 Fluxo de Requisições

### 1. **Usuário Preenche Formulário**
```
┌─────────────────────────┐
│ Formulário HTML         │
│ <form data-entity="...">│
│   <input name="Nome"/>  │
│   <button type="submit">│
└────────────┬────────────┘
             │
```

### 2. **JavaScript Intercepta o Submit**
```
┌──────────────────────────────────────┐
│ navbar.js - Event Listener           │
│ Verifica: form[data-entity]          │
│ Coleta: FormData → Objeto JSON       │
└────────────┬─────────────────────────┘
             │
             ▼
```

### 3. **Envia para API (api.js)**
```
┌────────────────────────────────────┐
│ fetch('http://localhost:3000/api/...'  │
│ {                                   │
│   method: 'POST',                   │
│   headers: {                        │
│     'Content-Type': 'application/json',
│     'Authorization': 'Bearer token' │
│   },                                │
│   body: JSON.stringify(formData)    │
│ }                                   │
└────────────┬────────────────────────┘
             │
             ▼ (HTTP)
```

### 4. **Backend NestJS Recebe**
```
┌────────────────────────────────────┐
│ Controller recebe @Body()          │
│ DTO valida os dados               │
│ Service salva no banco de dados    │
└────────────┬────────────────────────┘
             │
             ▼
```

### 5. **Backend Retorna Resposta**
```
Sucesso (201 ou 200):
{
    "id": 1,
    "Nome": "João Silva",
    "CPF": "123.456.789-00",
    ...
}

Erro (400, 401, 500):
{
    "statusCode": 400,
    "message": "CPF inválido",
    "error": "Bad Request"
}
```

### 6. **Frontend Processa Resposta (api.js)**
```javascript
if (!response.ok) {
    // Erro - exibe alert com mensagem
    throw new Error(errorData.message);
}

// Sucesso
alert(`Cadastro de ${entity} efetuado com sucesso!`);
form.reset(); // Limpa formulário
modal.classList.remove('show'); // Fecha modal
```

---

## 💾 Tipos de Dados Esperados

### Funcionário
```json
{
    "Nome": "string",
    "CPF": "string (formato: 123.456.789-00)",
    "Telefone": "string (opcional)",
    "Cargo": "string (opcional)",
    "Salario": "number"
}
```

### Cliente
```json
{
    "Nome": "string",
    "CPF_CNPJ": "string",
    "Telefone": "string (opcional)",
    "Email": "string (opcional)",
    "Endereco": "string (opcional)"
}
```

### Produto
```json
{
    "Nome": "string",
    "Descricao": "string (opcional)",
    "Preco": "number",
    "Estoque": "number (inteiro)"
}
```

### Veículo
```json
{
    "Placa": "string",
    "Modelo": "string (opcional)",
    "Marca": "string (opcional)",
    "Ano": "number (opcional)",
    "id_cliente": "number"
}
```

---

## 🐛 Resolvendo Problemas Comuns

### "Erro: Não consegue conectar ao servidor"
```
Motivo: API_BASE_URL incorreta
Solução: Verifique se NestJS está rodando em http://localhost:3000
Comando: npm run start (no backend)
```

### "Error 401 - Unauthorized"
```
Motivo: Token JWT expirou ou inválido
Solução: Faça login novamente para obter novo token
```

### "Error 400 - Bad Request"
```
Motivo: Dados inválidos (validação DTO)
Solução: Verifique mensagem de erro e corrija dados
```

### "CORS Error"
```
Motivo: Frontend e backend em portas diferentes
Solução: Configure CORS no NestJS:

// main.ts
app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true
});
```

---

## 📝 Resumo da Stack

| Camada | Tecnologia | Responsabilidade |
|--------|-----------|-----------------|
| Frontend | HTML/CSS/JS | Interface e requisições |
| Backend | NestJS | Lógica, validação e banco de dados |
| Autenticação | JWT | Segurança |
| Banco de Dados | SQL (TypeORM) | Persistência de dados |

---

## 🚀 Próximos Passos Recomendados

1. **Implementar autenticação JWT**
2. **Adicionar validações no frontend** (CPF, Email, etc)
3. **Criar telas "Ver" para listar dados**
4. **Implementar UPDATE e DELETE**
5. **Adicionar relatórios/exportação**
6. **Deploy em produção** (Vercel, Heroku, Azure)

---

## 📞 Dúvidas?

Cada arquivo JS tem comentários explicativos. Revise:
- `api.js` - Para entender requisições HTTP
- `navbar.js` - Para entender manipulação DOM
- `loading.js` - Para entender ciclo de vida da página
