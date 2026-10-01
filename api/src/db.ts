import { Pool } from 'pg';

// Um "pool" mantém algumas conexões abertas com o banco e reaproveita cada uma,
// em vez de abrir uma conexão nova a cada requisição (o que seria lento).
let pool: Pool | undefined;

export function obterPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL não definida. Crie o arquivo api/.env a partir do .env.example.');
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function fecharPool(): Promise<void> {
  await pool?.end();
  pool = undefined;
}
