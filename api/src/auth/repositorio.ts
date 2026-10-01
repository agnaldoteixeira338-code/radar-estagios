import type { Pool } from 'pg';
import type { Usuario, UsuarioComSenha, UsuariosRepositorio } from './tipos';

const VIOLACAO_UNICIDADE = '23505'; // código do PostgreSQL para "valor duplicado"

export function criarUsuariosRepositorio(pool: Pool): UsuariosRepositorio {
  return {
    async buscarPorEmail(email) {
      const { rows } = await pool.query<UsuarioComSenha>(
        `SELECT id, nome, email, senha_hash AS "senhaHash"
           FROM usuarios
          WHERE LOWER(email) = LOWER($1)`,
        [email],
      );
      return rows[0] ?? null;
    },

    async buscarPorId(id) {
      const { rows } = await pool.query<Usuario>('SELECT id, nome, email FROM usuarios WHERE id = $1', [id]);
      return rows[0] ?? null;
    },

    async criar({ nome, email, senhaHash }) {
      try {
        const { rows } = await pool.query<Usuario>(
          `INSERT INTO usuarios (nome, email, senha_hash)
           VALUES ($1, $2, $3)
           RETURNING id, nome, email`,
          [nome, email, senhaHash],
        );
        return rows[0];
      } catch (erro) {
        if ((erro as { code?: string }).code === VIOLACAO_UNICIDADE) return null;
        throw erro;
      }
    },
  };
}
