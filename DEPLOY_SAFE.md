# Deploy seguro — POWER ON DECODE TOOL

Este documento descreve o fluxo recomendado para atualizar produção sem perder dados nem quebrar ferramentas existentes.

## Fluxo correto de atualização

1. Fazer backup do banco PostgreSQL
2. Baixar a atualização do GitHub
3. Instalar dependências
4. Rodar migrações seguras
5. Rodar seed idempotente de ferramentas
6. Rodar build
7. Reiniciar a aplicação
8. Testar login
9. Testar ferramenta antiga (SsangYong)
10. Testar ferramenta nova, se houver

## Comandos recomendados para produção

```bash
npm ci
npx prisma migrate deploy
npm run seed:tools
npm run test:tools
npm run build
docker compose up -d --build app
```

Se o projeto ainda usar `db push` em ambientes controlados:

```bash
npx prisma db push
npm run seed:tools
npm run test:tools
npm run build
```

## Comandos proibidos em produção

- `prisma migrate reset`
- `deleteMany` em seed
- apagar volume do PostgreSQL
- trocar `DATABASE_URL` sem backup
- rodar seed destrutivo
- `npm run db:push -- --force-reset`

## Seed seguro

O seed principal (`npm run db:seed`) e o seed de ferramentas (`npm run seed:tools`) são idempotentes:

- fazem `upsert` de categorias, montadoras, módulos e ferramentas
- criam admin apenas se não existir
- não apagam usuários
- não apagam acessos
- não apagam `payment_events`
- não apagam `decode_logs`

## Arquitetura modular de ferramentas

Cada ferramenta implementada fica em:

```text
src/tools/<slug-da-ferramenta>/
  tool.config.ts
  validator.ts
  processor.ts
  route.ts
  page.tsx
  tests.ts
  index.ts
```

Registro central:

```text
src/tools/registry.ts
```

Motor genérico:

```text
src/lib/toolEngine.ts
```

## Como adicionar uma nova ferramenta

1. Criar base com template:

```bash
npm run create:tool -- fiat-iaw10gf-decode --name="Fiat IAW 10GF Decode" --category=decode --manufacturer=fiat
```

2. Implementar `validator.ts` e `processor.ts`
3. Registrar em `src/tools/registry.ts`
4. Sincronizar vitrine:

```bash
npm run seed:tools
```

5. Validar regressão:

```bash
npm run test:tools
npm run lint
npm run build
```

6. Deploy seguro conforme este documento

## Regra de ouro

Ao adicionar uma nova ferramenta, os testes da SsangYong devem continuar passando. Se uma atualização quebrar uma ferramenta antiga, o build/deploy não deve seguir.

## O que fica no banco

Somente metadados comerciais:

- nome
- descrição
- imagem
- URL de compra
- ordem
- status ativo/inativo
- categoria
- montadora

A regra técnica fica sempre no código versionado no GitHub.
