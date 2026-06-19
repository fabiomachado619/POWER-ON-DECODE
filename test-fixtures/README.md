# Fixtures de teste

Esta pasta contém arquivos binários opcionais usados apenas em desenvolvimento.

## Estrutura

```text
test-fixtures/
  ssangyong-rexton-25c320-decode/
    original.bin
    expected.bin
```

Se os arquivos não existirem, os testes geram um buffer sintético de 4096 bytes e validam:

- tamanho final
- bytes aplicados no offset correto
- demais bytes inalterados

## Executar testes

```bash
npm run test:tools
```
