import type * as fs from 'fs/promises'
import { jest } from '@jest/globals'

export const access = jest.fn<typeof fs.access>()
export const readFile = jest.fn<typeof fs.readFile>()
export const writeFile = jest.fn<typeof fs.writeFile>()
export const mkdir = jest.fn<typeof fs.mkdir>()
