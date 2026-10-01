import type { Pool } from 'pg';
import type { Perfil, PerfisRepositorio } from './tipos';

const COLUNAS = `
  habilidades,
  TO_CHAR(formatura, 'YYYY-MM') AS formatura,
  nivel_ingles AS "nivelIngles",
  modalidades`;

export function criarPerfisRepositorio(pool: Pool): PerfisRepositorio {
  return {
    async buscar(usuarioId) {
      const { rows } = await pool.query<Perfil>(`SELECT ${COLUNAS} FROM perfis WHERE usuario_id = $1`, [usuarioId]);
      return rows[0] ?? null;
    },

    // "Upsert": cria o perfil se não existir; se existir, substitui pelos dados novos.
    async salvar(usuarioId, perfil) {
      const { rows } = await pool.query<Perfil>(
        `INSERT INTO perfis (usuario_id, habilidades, formatura, nivel_ingles, modalidades)
         VALUES ($1, $2, TO_DATE($3, 'YYYY-MM'), $4, $5)
         ON CONFLICT (usuario_id) DO UPDATE SET
           habilidades   = EXCLUDED.habilidades,
           formatura     = EXCLUDED.formatura,
           nivel_ingles  = EXCLUDED.nivel_ingles,
           modalidades   = EXCLUDED.modalidades,
           atualizado_em = NOW()
         RETURNING ${COLUNAS}`,
        [usuarioId, perfil.habilidades, perfil.formatura, perfil.nivelIngles, perfil.modalidades],
      );
      return rows[0];
    },
  };
}
