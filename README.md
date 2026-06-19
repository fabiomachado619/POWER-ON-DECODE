# POWER ON DECODE TOOL

Plataforma SaaS para aplicação segura de procedimentos de decode em arquivos EEPROM/ECU automotivos, com login, controle de acesso por módulos comprados e arquitetura expansível para novos procedimentos.

## Stack

- **Frontend/API:** Next.js 14 + TypeScript + TailwindCSS
- **Banco:** PostgreSQL + Prisma ORM
- **Auth:** JWT em cookie HTTP-only + bcrypt
- **Validação:** Zod
- **Deploy:** Docker + docker-compose (VPS)

## Requisitos

- Node.js 20+
- PostgreSQL 16+ (local ou container)
- Docker e Docker Compose (para deploy em VPS)

## Instalação local

### 1. Clonar e instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com sua `DATABASE_URL`, `JWT_SECRET` e demais valores.

### 3. Subir banco e aplicar schema

Com PostgreSQL rodando:

```bash
npm run db:push
npm run db:seed
```

### 4. Iniciar em desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### Credenciais padrão (seed)

- **Email:** `admin@powerondecode.local`
- **Senha:** `Admin@123456`

## Deploy em VPS com Docker

### 1. Preparar ambiente

```bash
cp .env.example .env
```

Defina segredos fortes em produção:

- `JWT_SECRET`
- `PAYMENT_WEBHOOK_SECRET`

### 2. Subir serviços

```bash
docker compose up -d db
docker compose --profile setup run --rm migrate
docker compose up -d --build app
```

A aplicação ficará disponível em `http://SEU_IP:3000`.

### 3. Atualizar após mudanças

```bash
docker compose up -d --build app
```

## Estrutura principal

```text
src/
├── app/
│   ├── login/
│   ├── dashboard/
│   ├── modules/
│   │   └── ssangyong/
│   └── api/
│       ├── auth/
│       ├── decode/ssangyong/
│       ├── modules/
│       ├── history/
│       └── webhooks/payment/
├── components/
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── accessControl.ts
│   ├── binaryFile.ts
│   ├── paymentProvider.ts
│   ├── webhookController.ts
│   └── productAccessMapper.ts
├── modules/
│   └── ssangyong/
│       ├── procedures.ts   ← regras centralizadas de decode
│       ├── decoder.ts
│       └── validator.ts
└── types/
```

## Módulos comerciais

Cada usuário enxerga apenas módulos liberados em `user_modules`.

Módulos seed:

- SsangYong Decode
- Volkswagen Decode
- Fiat Decode
- Jeep/Fiat Scanner

## Fluxo de pagamento (webhook)

Endpoint:

```http
POST /api/webhooks/payment
```

Headers suportados:

- `x-payment-provider`: `generic`, `kiwify`, `hotmart`, `cartpanda`, `pepper`, `kirvano`
- `x-webhook-secret`: deve coincidir com `PAYMENT_WEBHOOK_SECRET` (se configurado)

Payload genérico de exemplo:

```json
{
  "externalEventId": "evt_123",
  "externalProductId": "prod_ssangyong",
  "customerEmail": "cliente@email.com",
  "customerName": "Cliente Teste",
  "status": "approved"
}
```

Mapeamento produto → módulo via `PAYMENT_PRODUCT_MAP`:

```env
PAYMENT_PRODUCT_MAP=prod_ssangyong:ssangyong,prod_volkswagen:volkswagen
```

## Procedimento SsangYong (25C320)

Regra centralizada em `src/modules/ssangyong/procedures.ts`:

- EEPROM: 25C320 / 25LC320
- Tamanho: 4096 bytes
- Offset: `0x03F0`
- Gravação fixa de 16 bytes (sem validar bytes antigos)
- Arquivo original nunca alterado — processamento em memória
- Download sugerido: `nome_original_DECODE_OFF.bin`

## Segurança

- Arquivos `.bin` processados em memória (não persistidos por padrão)
- Logs técnicos sem conteúdo do arquivo
- Middleware de autenticação
- Autorização por módulo (`requireModuleAccess`)
- Aceite obrigatório de backup e responsabilidade na UI

## Scripts úteis

```bash
npm run dev          # desenvolvimento
npm run build        # build produção
npm run start        # start produção
npm run db:push      # aplicar schema
npm run db:seed      # popular dados iniciais
npm run db:studio    # Prisma Studio
```

## Observações técnicas

- Novos procedimentos devem ser adicionados em `procedures.ts` e sincronizados no seed/banco.
- A camada de pagamento é genérica e preparada para múltiplos provedores.
- Para novos módulos (ex.: Volkswagen), crie pasta em `src/modules/<marca>/` seguindo o padrão SsangYong.

## Aviso legal

Ferramenta destinada a uso técnico autorizado em bancada/oficina. O operador deve sempre manter backup do arquivo original e assumir responsabilidade pelo procedimento realizado.
