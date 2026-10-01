// Lê as origens permitidas no CORS a partir da variável CORS_ORIGENS (separadas por vírgula).
// Aceita só o domínio (ex.: "radar-estagios.onrender.com"), que é como o Render informa o endereço
// de outro serviço; nesse caso completa com "https://".
export function lerOrigensPermitidas(valor: string | undefined): string[] | undefined {
  const origens = (valor ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean)
    .map((o) => (/^https?:\/\//.test(o) ? o : `https://${o}`));
  return origens.length > 0 ? origens : undefined;
}
