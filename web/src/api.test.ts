import { describe, expect, it } from 'vitest'
import { enderecoDaApi } from './api'

describe('enderecoDaApi', () => {
  it.each([
    [undefined, '/api'],
    ['', '/api'],
    ['radar-estagios-api.onrender.com', 'https://radar-estagios-api.onrender.com'],
    ['radar-estagios-api.onrender.com/', 'https://radar-estagios-api.onrender.com'],
    ['https://api.exemplo.com', 'https://api.exemplo.com'],
    ['http://localhost:4000/', 'http://localhost:4000'],
  ])('%p vira %p', (entrada, esperado) => {
    expect(enderecoDaApi(entrada)).toBe(esperado)
  })
})
