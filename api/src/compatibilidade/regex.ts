// No JavaScript, o "\b" (limite de palavra) só reconhece letras sem acento como parte da palavra.
// Assim, /\bexcel\b/ casa com "EXCELÊNCIA" e /\bexpress\b/ com "expressão", porque "Ê" e "ã"
// são vistos como "fora da palavra". Esta função troca cada "\b" por um limite que entende
// as letras acentuadas do português.

const LETRA = 'A-Za-z0-9_À-ÖØ-öø-ÿ';
const LIMITE = `(?:(?<![${LETRA}])(?=[${LETRA}])|(?<=[${LETRA}])(?![${LETRA}]))`;

export function comLimitesDePalavra(padrao: RegExp): RegExp {
  return new RegExp(padrao.source.replaceAll(String.raw`\b`, LIMITE), padrao.flags);
}
