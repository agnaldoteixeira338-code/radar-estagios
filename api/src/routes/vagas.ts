import { Router } from 'express';
import {
  MODALIDADES,
  STATUS,
  type Modalidade,
  type Status,
  type VagasRepositorio,
} from '../vagas/tipos';

const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 100;

// GET /vagas?modalidade=presencial&limite=10
// Lista as vagas, das mais compatíveis para as menos compatíveis.
export function criarVagasRouter(repositorio: VagasRepositorio) {
  const router = Router();

  router.get('/', async (req, res) => {
    const { modalidade, limite } = req.query;

    if (modalidade !== undefined && !MODALIDADES.includes(modalidade as Modalidade)) {
      res.status(400).json({ erro: `modalidade deve ser uma destas: ${MODALIDADES.join(', ')}` });
      return;
    }

    const limiteNumero = limite === undefined ? LIMITE_PADRAO : Number(limite);
    if (!Number.isInteger(limiteNumero) || limiteNumero < 1 || limiteNumero > LIMITE_MAXIMO) {
      res.status(400).json({ erro: `limite deve ser um número inteiro entre 1 e ${LIMITE_MAXIMO}` });
      return;
    }

    const vagas = await repositorio.listar({
      modalidade: modalidade as Modalidade | undefined,
      limite: limiteNumero,
    });
    res.json({ total: vagas.length, vagas });
  });

  // PATCH /vagas/:id/status   corpo: { "status": "enviada" }
  // Atualiza a situação da sua candidatura nessa vaga.
  router.patch('/:id/status', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ erro: 'id deve ser um número inteiro positivo' });
      return;
    }

    const status = req.body?.status;
    if (!STATUS.includes(status)) {
      res.status(400).json({ erro: `status deve ser um destes: ${STATUS.join(', ')}` });
      return;
    }

    const vaga = await repositorio.atualizarStatus(id, status as Status);
    if (!vaga) {
      res.status(404).json({ erro: 'Vaga não encontrada' });
      return;
    }
    res.json(vaga);
  });

  return router;
}
