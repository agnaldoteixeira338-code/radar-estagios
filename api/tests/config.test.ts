import { lerOrigensPermitidas } from '../src/config';

describe('lerOrigensPermitidas (CORS_ORIGENS)', () => {
  it.each([
    [undefined, undefined],
    ['', undefined],
    [' , ', undefined],
    ['radar-estagios.onrender.com', ['https://radar-estagios.onrender.com']],
    ['https://radar.exemplo.com/', ['https://radar.exemplo.com']],
    ['radar-estagios.onrender.com, http://localhost:5173', ['https://radar-estagios.onrender.com', 'http://localhost:5173']],
  ])('%p vira %p', (entrada, esperado) => {
    expect(lerOrigensPermitidas(entrada)).toEqual(esperado);
  });
});
