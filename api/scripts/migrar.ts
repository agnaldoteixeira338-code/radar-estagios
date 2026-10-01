import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { obterPool, fecharPool } from '../src/db';

// Roda, em ordem, os arquivos .sql da pasta migrations que ainda não foram aplicados.
// A tabela "migracoes" guarda quais já rodaram, para nunca aplicar a mesma duas vezes.
async function migrar() {
  const pool = obterPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migracoes (
      nome        TEXT PRIMARY KEY,
      aplicada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const pasta = join(__dirname, '..', 'migrations');
  const arquivos = readdirSync(pasta).filter((a) => a.endsWith('.sql')).sort();
  const { rows } = await pool.query<{ nome: string }>('SELECT nome FROM migracoes');
  const aplicadas = new Set(rows.map((r) => r.nome));

  for (const arquivo of arquivos) {
    if (aplicadas.has(arquivo)) {
      console.log(`- ${arquivo} (já aplicada)`);
      continue;
    }
    const sql = readFileSync(join(pasta, arquivo), 'utf8');
    const cliente = await pool.connect();
    try {
      // Transação: ou a migração inteira funciona, ou nada é alterado no banco.
      await cliente.query('BEGIN');
      await cliente.query(sql);
      await cliente.query('INSERT INTO migracoes (nome) VALUES ($1)', [arquivo]);
      await cliente.query('COMMIT');
      console.log(`✓ ${arquivo} aplicada`);
    } catch (erro) {
      await cliente.query('ROLLBACK');
      throw erro;
    } finally {
      cliente.release();
    }
  }
}

migrar()
  .catch((erro) => {
    console.error('Erro na migração:', erro.message);
    process.exitCode = 1;
  })
  .finally(fecharPool);
