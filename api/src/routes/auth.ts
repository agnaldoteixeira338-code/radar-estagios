import { Router, type RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { conferirSenha, gerarHashSenha, gerarToken, HASH_FALSO } from '../auth/seguranca';
import type { UsuariosRepositorio } from '../auth/tipos';
import { validarCadastro, validarLogin } from '../auth/validacao';

export interface OpcoesAuth {
  segredoJwt: string;
  // Máximo de tentativas de login/cadastro por IP a cada 15 minutos.
  limiteTentativas?: number;
  // Custo do bcrypt; só os testes usam um valor menor (padrão: CUSTO_BCRYPT = 12).
  custoBcrypt?: number;
}

export function criarAuthRouter(usuarios: UsuariosRepositorio, autenticar: RequestHandler, opcoes: OpcoesAuth) {
  const router = Router();

  // Bloqueia quem tenta muitas senhas seguidas (ataque de força bruta).
  const limitador = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: opcoes.limiteTentativas ?? 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { erro: 'Muitas tentativas. Tente de novo em alguns minutos.' },
  });

  // POST /auth/cadastro   { nome, email, senha } -> 201 { token, usuario }
  router.post('/cadastro', limitador, async (req, res) => {
    const validacao = validarCadastro(req.body);
    if (!validacao.ok) {
      res.status(400).json({ erro: validacao.erro });
      return;
    }
    const { nome, email, senha } = validacao.dados;

    const usuario = await usuarios.criar({ nome, email, senhaHash: await gerarHashSenha(senha, opcoes.custoBcrypt) });
    if (!usuario) {
      res.status(409).json({ erro: 'Já existe uma conta com este e-mail' });
      return;
    }
    res.status(201).json({ token: gerarToken(usuario.id, opcoes.segredoJwt), usuario });
  });

  // POST /auth/login   { email, senha } -> 200 { token, usuario }
  router.post('/login', limitador, async (req, res) => {
    const validacao = validarLogin(req.body);
    if (!validacao.ok) {
      res.status(400).json({ erro: validacao.erro });
      return;
    }
    const { email, senha } = validacao.dados;

    const encontrado = await usuarios.buscarPorEmail(email);
    // Sempre compara uma senha (mesmo sem conta), para o tempo de resposta não revelar
    // se o e-mail existe. A mensagem de erro também é a mesma nos dois casos.
    const senhaCerta = await conferirSenha(senha, encontrado?.senhaHash ?? HASH_FALSO);
    if (!encontrado || !senhaCerta) {
      res.status(401).json({ erro: 'E-mail ou senha incorretos' });
      return;
    }
    const usuario = { id: encontrado.id, nome: encontrado.nome, email: encontrado.email };
    res.json({ token: gerarToken(usuario.id, opcoes.segredoJwt), usuario });
  });

  // GET /auth/eu -> dados de quem está logado
  router.get('/eu', autenticar, async (req, res) => {
    res.json(await usuarios.buscarPorId(req.usuarioId!));
  });

  return router;
}
