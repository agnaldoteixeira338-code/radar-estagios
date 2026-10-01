import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { lerToken } from './seguranca';
import type { UsuariosRepositorio } from './tipos';

// Disponibiliza req.usuarioId nas rotas protegidas.
declare module 'express-serve-static-core' {
  interface Request {
    usuarioId?: number;
  }
}

// Exige o cabeçalho "Authorization: Bearer <token>" válido E uma conta que ainda exista.
// Conferir a conta no banco garante que o token de uma conta excluída deixa de funcionar na hora.
export function exigirLogin(segredo: string, usuarios: UsuariosRepositorio): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const [tipo, token] = (req.headers.authorization ?? '').split(' ');
    const usuarioId = tipo === 'Bearer' && token ? lerToken(token, segredo) : null;
    if (!usuarioId || !(await usuarios.buscarPorId(usuarioId))) {
      res.status(401).json({ erro: 'Faça login para continuar' });
      return;
    }
    req.usuarioId = usuarioId;
    next();
  };
}
