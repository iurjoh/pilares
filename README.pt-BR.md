# Pilares

**Português (Brasil)** | [English](README.md)

Acompanhe pequenos hábitos e reflexões em cinco áreas da vida. Registre um passo de hoje e reveja seu progresso em um só lugar, sem conta para o uso básico.

## Demo

[Abrir o app](https://pilares.pages.dev/)

Abra no navegador, sem instalar nada ou usar o terminal.

![Controle de água do Pilares em inglês: quantidade consumida, resumo e meta diária em campos separados](docs/assets/pilares-water-en-2026-10-11.png)

Interface da imagem em inglês, capturada em 11/10/2026 sem registros pessoais. O app pode mostrar os rótulos em inglês ou português, conforme o idioma escolhido.

## Experimente um pequeno passo

1. Abra a demo e escolha **Físico**. No celular, use a navegação dos pilares ou os cartões da home.
2. Em **Água do dia.**, no campo **Ou escreva em litros**, digite `0.5` (meio litro). Não altere **Minha meta diária (litros)**. O resumo deve mostrar a quantidade registrada.
3. Abra **Configurações** para alternar entre português e inglês. Use registros fictícios ao explorar; seu progresso pertence a este navegador.

Esse primeiro uso não exige login Google. A biblioteca pessoal opcional usa login Google e arquivos escolhidos do Drive.

## O que você pode usar

| Espaço | Exemplos |
| --- | --- |
| Espiritual | Referências a capítulos bíblicos, leituras concluídas e práticas semanais. |
| Mental e Emocional | Registro de humor, notas opcionais e calendário. |
| Físico | Água, sono, movimento e alimentação. |
| Intelectual | Minutos de leitura, notas de aprendizado e biblioteca opcional na nuvem. |
| Financeiro | Checklists mensais e metas que você define. Sem conexão bancária ou recomendação de investimentos. |

Português e inglês usam a mesma interface. O progresso básico fica local e não é sincronizado automaticamente entre aparelhos.

## Status e limites

Beta em evolução. Os cinco espaços existem, mas recursos implementados e build verde não são um certificado completo de acessibilidade nem garantia de recuperação dos dados.

- Limpar os dados do site ou mudar de aparelho pode perder o progresso. Não há backup automático.
- Configurações tem controles de exportação e exclusão total. Arquivos exportados podem conter notas sensíveis; guarde-os em lugar privado.
- O acesso Google é opcional. O escopo `drive.file` limita arquivos acessíveis, mas não é somente leitura. A pessoa seleciona PDFs; escolher uma pasta não libera seu conteúdo.
- O app não é um cofre criptografado. Cuidado com perfis de navegador compartilhados.

## Testes

O candidato `feat/qa-local`, ainda em revisão, acrescenta:

```sh
npm run qa
```

Esse comando reúne Vitest e Playwright. A nova spec verifica navegação entre os cinco pilares e registro de humor, nota, prática e tempo de telas com recarga, usando dados fictícios; também verifica acessibilidade após a interação. Os testes do candidato não certificam todos os recursos nem o OAuth real. O `main` consultado para este piloto ainda não tem o script `qa`.

## Histórico do projeto

O projeto começou com cinco espaços independentes em uma estrutura comum, depois ganhou progresso local, idiomas e acesso à biblioteca escolhida pelo visitante. O trabalho de privacidade retirou a listagem privada da biblioteca do dono da interface pública.

Uma auditoria de 28/09/2026 registrou achados de acessibilidade, segurança e desempenho. Os resultados históricos ficam no registro de construção; não são a contagem de pendências de hoje.

[História da construção, arquitetura, decisões de design e auditorias históricas](docs/BUILD.pt-BR.md)

## Créditos e licença

Iuri Johansson define a direção e as decisões do projeto; Instinct auxilia na implementação e documentação.

[Licença MIT](LICENSE), copyright 2026 Iuri Johansson. Bibliotecas, serviços e outros conteúdos mantêm seus próprios termos. O plano bíblico usa referências a capítulos, sem republicar uma tradução; as fontes originais das contagens permanecem no registro de construção.
