import type { Pool } from 'pg';
import type { FiltrosVagas, Vaga, VagasRepositorio } from './tipos';

// Única parte do código que escreve SQL para a tabela vagas.
export function criarVagasRepositorio(pool: Pool): VagasRepositorio {
  return {
    async listar({ modalidade, limite }: FiltrosVagas): Promise<Vaga[]> {
      // Os valores vão como parâmetros ($1, $2) e nunca colados no texto do SQL.
      // Isso impede ataques de "SQL injection".
      const { rows } = await pool.query<Vaga>(
        `SELECT id,
                fonte,
                id_externo           AS "idExterno",
                titulo,
                empresa,
                cidade,
                estado,
                modalidade,
                link,
                TO_CHAR(publicada_em, 'YYYY-MM-DD') AS "publicadaEm",
                nota_compatibilidade AS "notaCompatibilidade"
           FROM vagas
          WHERE ($1::text IS NULL OR modalidade = $1)
          ORDER BY nota_compatibilidade DESC NULLS LAST, publicada_em DESC NULLS LAST, id DESC
          LIMIT $2`,
        [modalidade ?? null, limite],
      );
      return rows;
    },
  };
}
