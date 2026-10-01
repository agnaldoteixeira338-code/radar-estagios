import { Router, type RequestHandler } from 'express';
import { avaliar } from '../compatibilidade/avaliar';
import { PERFIL_VAZIO, type PerfisRepositorio } from '../perfil/tipos';
import { MODALIDADES, STATUS, type Modalidade, type Status, type Vaga, type VagasRepositorio } from '../vagas/tipos';

const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 100;

export function criarVagasRouter(vagas: VagasRepositorio, perfis: PerfisRepositorio, autenticar: RequestHandler) {
  const router = Router();
  router.use(autenticar);

  // GET /vagas?modalidade=presencial&limite=10
  // Lista as vagas com a nota calculada para o perfil de quem está logado, da maior para a menor.
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

    const usuarioId = req.usuarioId!;
    const [perfil, lista] = await Promise.all([
      perfis.buscar(usuarioId),
      vagas.listar(usuarioId, { modalidade: modalidade as Modalidade | undefined }),
    ]);

    // A nota depende do perfil, então a ordenação e o limite são aplicados depois do cálculo.
    const avaliadas: Vaga[] = lista.map(({ descricao, ...vaga }) => {
      const { nota, ...detalhes } = avaliar(
        { titulo: vaga.titulo, descricao, modalidade: vaga.modalidade },
        perfil ?? PERFIL_VAZIO,
      );
      return { ...vaga, notaCompatibilidade: nota, ...detalhes };
    });
    avaliadas.sort(
      (a, b) =>
        b.notaCompatibilidade - a.notaCompatibilidade ||
        (b.publicadaEm ?? '').localeCompare(a.publicadaEm ?? '') ||
        b.id - a.id,
    );

    const resultado = avaliadas.slice(0, limiteNumero);
    res.json({ total: resultado.length, vagas: resultado });
  });

  // PATCH /vagas/:id/status   corpo: { "status": "enviada" }
  // Atualiza a situação da candidatura de quem está logado nessa vaga.
  router.patch('/:id/status', async (req, res) => {
    const vagaId = Number(req.params.id);
    if (!Number.isInteger(vagaId) || vagaId < 1) {
      res.status(400).json({ erro: 'id deve ser um número inteiro positivo' });
      return;
    }

    const status = req.body?.status;
    if (!STATUS.includes(status)) {
      res.status(400).json({ erro: `status deve ser um destes: ${STATUS.join(', ')}` });
      return;
    }

    const salvo = await vagas.salvarStatus(req.usuarioId!, vagaId, status as Status);
    if (!salvo) {
      res.status(404).json({ erro: 'Vaga não encontrada' });
      return;
    }
    res.json({ vagaId, status });
  });

  return router;
}
