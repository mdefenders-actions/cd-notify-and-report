import { jest } from '@jest/globals'

export const pushToLoki =
  jest.fn<typeof import('../src/pushToLoki.js').pushToLoki>()
