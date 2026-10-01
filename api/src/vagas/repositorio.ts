import type { Pool } from 'pg';
import type { FiltrosVagas, Status, Vaga, VagasRepositorio } from './tipos';

// Colunas devolvidas pela API, já com os nomes no formato do TypeScript (camelCase).
const COLUNAS = `
  id,
  fonte,
  id_externo              AS "idExterno",
  titulo,
  empresa,
  cidade,
  estado,
  modalidade,
  link,
  TO_CHAR(publicada_em, 'YYYY-MM-DD') AS "publicadaEm",
  nota_compatibilidade    AS "notaCompatibilidade",
  habilidades_encontradas AS "habilidadesEncontradas",
  requisitos_faltando     AS "requisitosFaltando",
  diferenciais_faltando   AS "diferenciaisFaltando",
  alertas,
  motivo_eliminacao       AS "motivoEliminacao",
  status`;

// Única parte do código que escreve SQL para a tabela vagas.
// Os valores vão como parâmetros ($1, $2) e nunca colados no texto do SQL.
// Isso impede ataques de "SQL injection".
export function criarVagasRepositorio(pool: Pool): VagasRepositorio {
  return {
    async listar({ modalidade, limite }: FiltrosVagas): Promise<Vaga[]> {
      const { rows } = await pool.query<Vaga>(
        `SELECT ${COLUNAS}
           FROM vagas
          WHERE ($1::text IS NULL OR modalidade = $1)
          ORDER BY nota_compatibilidade DESC NULLS LAST, publicada_em DESC NULLS LAST, id DESC
          LIMIT $2`,
        [modalidade ?? null, limite],
      );
      return rows;
    },

    async atualizarStatus(id: number, status: Status): Promise<Vaga | null> {
      const { rows } = await pool.query<Vaga>(
        `UPDATE vagas
            SET status = $2, status_atualizado_em = NOW()
          WHERE id = $1
      RETURNING ${COLUNAS}`,
        [id, status],
      );
      return rows[0] ?? null;
    },
  };
}
