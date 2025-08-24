import { jest } from '@jest/globals'

export const sendToSlack =
  jest.fn<typeof import('../src/sendToSlack.js').sendToSlack>()
