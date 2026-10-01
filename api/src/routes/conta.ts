import { Router, type RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { conferirSenha } from '../auth/seguranca';
import type { UsuariosRepositorio } from '../auth/tipos';
import { PERFIL_VAZIO, type PerfisRepositorio } from '../perfil/tipos';
import type { VagasRepositorio } from '../vagas/tipos';

// Direitos do titular dos dados (LGPD): acesso aos próprios dados e exclusão da conta.
export function criarContaRouter(
  usuarios: UsuariosRepositorio,
  perfis: PerfisRepositorio,
  vagas: VagasRepositorio,
  autenticar: RequestHandler,
  limiteTentativas = 10,
) {
  const router = Router();
  router.use(autenticar);

  // A exclusão confere a senha: limita as tentativas para ninguém usar esta rota para adivinhá-la.
  const limitador = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: limiteTentativas,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { erro: 'Muitas tentativas. Tente de novo em alguns minutos.' },
  });

  // GET /conta/dados -> tudo o que o sistema guarda sobre a pessoa, num só arquivo.
  router.get('/dados', async (req, res) => {
    const usuarioId = req.usuarioId!;
    const [usuario, perfil, candidaturas] = await Promise.all([
      usuarios.buscarPorId(usuarioId),
      perfis.buscar(usuarioId),
      vagas.listarCandidaturas(usuarioId),
    ]);
    res.setHeader('Content-Disposition', 'attachment; filename="meus-dados-radar-de-estagios.json"');
    res.json({
      exportadoEm: new Date().toISOString(),
      conta: usuario,
      perfil: perfil ?? PERFIL_VAZIO,
      candidaturas,
      observacao: 'A senha não aparece aqui: o sistema guarda só um hash (resumo criptográfico) dela, que não pode ser revertido.',
    });
  });

  // DELETE /conta   corpo: { "senha": "..." }
  // Exige a senha de novo: assim um token roubado ou um clique sem querer não apagam a conta.
  router.delete('/', limitador, async (req, res) => {
    const senha = req.body?.senha;
    if (typeof senha !== 'string' || !senha) {
      res.status(400).json({ erro: 'Informe sua senha para confirmar a exclusão' });
      return;
    }

    const usuario = await usuarios.buscarPorId(req.usuarioId!);
    const comSenha = usuario ? await usuarios.buscarPorEmail(usuario.email) : null;
    if (!comSenha || !(await conferirSenha(senha, comSenha.senhaHash))) {
      res.status(403).json({ erro: 'Senha incorreta' });
      return;
    }

    await usuarios.excluir(comSenha.id);
    res.status(204).end();
  });

  return router;
}
