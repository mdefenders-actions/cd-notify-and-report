import { jest } from '@jest/globals'
export const tagRelease =
  jest.fn<typeof import('../src/tagRelease.js').tagRelease>()
