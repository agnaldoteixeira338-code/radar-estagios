import type { NextFunction, Request, Response } from 'express';
import { lerToken } from './seguranca';

// Disponibiliza req.usuarioId nas rotas protegidas.
declare module 'express-serve-static-core' {
  interface Request {
    usuarioId?: number;
  }
}

// Exige o cabeçalho "Authorization: Bearer <token>" válido; senão responde 401.
export function exigirLogin(segredo: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const [tipo, token] = (req.headers.authorization ?? '').split(' ');
    const usuarioId = tipo === 'Bearer' && token ? lerToken(token, segredo) : null;
    if (!usuarioId) {
      res.status(401).json({ erro: 'Faça login para continuar' });
      return;
    }
    req.usuarioId = usuarioId;
    next();
  };
}
