import type { Pool } from 'pg';
import type { Modalidade, Status, VagaDoBanco, VagasRepositorio } from './tipos';

const VIOLACAO_CHAVE_ESTRANGEIRA = '23503'; // código do PostgreSQL: a vaga referenciada não existe

// Única parte do código que escreve SQL para vagas e candidaturas.
// Os valores vão como parâmetros ($1, $2) e nunca colados no texto do SQL (evita SQL injection).
export function criarVagasRepositorio(pool: Pool): VagasRepositorio {
  return {
    async listar(usuarioId: number, { modalidade }: { modalidade?: Modalidade }): Promise<VagaDoBanco[]> {
      const { rows } = await pool.query<VagaDoBanco>(
        `SELECT v.id,
                v.fonte,
                v.id_externo AS "idExterno",
                v.titulo,
                v.empresa,
                v.cidade,
                v.estado,
                v.modalidade,
                v.link,
                TO_CHAR(v.publicada_em, 'YYYY-MM-DD') AS "publicadaEm",
                v.descricao,
                COALESCE(c.status, 'pendente') AS status
           FROM vagas v
           LEFT JOIN candidaturas c ON c.vaga_id = v.id AND c.usuario_id = $1
          WHERE ($2::text IS NULL OR v.modalidade = $2)`,
        [usuarioId, modalidade ?? null],
      );
      return rows;
    },

    async salvarStatus(usuarioId: number, vagaId: number, status: Status): Promise<boolean> {
      try {
        await pool.query(
          `INSERT INTO candidaturas (usuario_id, vaga_id, status)
           VALUES ($1, $2, $3)
           ON CONFLICT (usuario_id, vaga_id) DO UPDATE SET status = EXCLUDED.status, atualizado_em = NOW()`,
          [usuarioId, vagaId, status],
        );
        return true;
      } catch (erro) {
        if ((erro as { code?: string }).code === VIOLACAO_CHAVE_ESTRANGEIRA) return false;
        throw erro;
      }
    },
  };
}
