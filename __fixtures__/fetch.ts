import { jest } from '@jest/globals'

export const fetch = jest.fn<typeof global.fetch>()
global.fetch = fetch
