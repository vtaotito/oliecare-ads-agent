# OlieCare Ads Agent

Backend Node.js que conecta um agente de IA (Claude) à Google Ads API para otimização automática de campanhas da OlieCare.

## Funcionalidades

- **CRUD de Campanhas** — criar, listar, pausar, alterar orçamento
- **Gestão de Palavras-chave** — performance, adicionar, pausar, negativar
- **Anúncios Responsivos (RSA)** — criar e monitorar performance
- **Relatórios** — overview da conta e relatório por campanha
- **Agente IA** — ciclo automático (cron 6h) que analisa métricas e executa otimizações via Claude

## Requisitos

- Node.js >= 18
- Conta Google Ads com Developer Token
- Chave da API Anthropic (Claude)

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Copiar e preencher variáveis de ambiente
cp .env.example .env
# edite o .env com suas credenciais

# 3. Obter refresh token do Google Ads
npm run get-token

# 4. Rodar em desenvolvimento
npm run dev

# 5. Produção com PM2
npx pm2 start ecosystem.config.js
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |
| GET | `/api/campaigns` | Listar campanhas (últimos 7 dias) |
| POST | `/api/campaigns` | Criar campanha |
| PATCH | `/api/campaigns/:id/status` | Alterar status |
| PATCH | `/api/campaigns/:id/budget` | Alterar orçamento |
| GET | `/api/keywords/campaign/:id` | Performance de palavras-chave |
| POST | `/api/keywords/adgroup/:id` | Adicionar palavras-chave |
| POST | `/api/keywords/negative/:id` | Adicionar negativas |
| POST | `/api/ads/adgroup/:id` | Criar RSA |
| GET | `/api/ads/campaign/:id/performance` | Performance de anúncios |
| GET | `/api/reports/overview?days=7` | Overview da conta |
| GET | `/api/reports/campaigns?days=30` | Relatório de campanhas |
| POST | `/api/agent/run` | Executar ciclo completo do agente |
| POST | `/api/agent/analyze` | Apenas analisar (sem executar ações) |

## Arquitetura

```
src/
├── server.js           # Express + cron
├── auth/               # OAuth2 Google Ads
├── services/           # Lógica de negócio
├── routes/             # Endpoints REST
├── middleware/          # Auth JWT + error handler
└── utils/              # Logger (Winston)
```

## Licença

Proprietário — OlieCare / GPTO
