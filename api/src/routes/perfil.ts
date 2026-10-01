import { Router } from 'express';
import { exigirLogin } from '../auth/middleware';
import { catalogoPublico } from '../perfil/catalogo';
import { PERFIL_VAZIO, type PerfisRepositorio } from '../perfil/tipos';
import { validarPerfil } from '../perfil/validacao';

// GET /catalogo: lista pública de tecnologias que podem ser marcadas no perfil.
export function criarCatalogoRouter() {
  const router = Router();
  router.get('/', (_req, res) => {
    res.json({ tecnologias: catalogoPublico() });
  });
  return router;
}

// GET /perfil e PUT /perfil: perfil de quem está logado.
export function criarPerfilRouter(perfis: PerfisRepositorio, segredoJwt: string) {
  const router = Router();
  router.use(exigirLogin(segredoJwt));

  router.get('/', async (req, res) => {
    const perfil = await perfis.buscar(req.usuarioId!);
    res.json(perfil ?? PERFIL_VAZIO);
  });

  router.put('/', async (req, res) => {
    const validacao = validarPerfil(req.body);
    if (!validacao.ok) {
      res.status(400).json({ erro: validacao.erro });
      return;
    }
    res.json(await perfis.salvar(req.usuarioId!, validacao.perfil));
  });

  return router;
}
