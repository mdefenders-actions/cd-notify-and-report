import type * as core from '@actions/core'
import { jest } from '@jest/globals'

export const debug = jest.fn<typeof core.debug>()
export const error = jest.fn<typeof core.error>()
export const info = jest.fn<typeof core.info>()
export const setOutput = jest.fn<typeof core.setOutput>()
export const setFailed = jest.fn<typeof core.setFailed>()
export const warning = jest.fn<typeof core.warning>()
export const getBooleanInput = jest.fn<typeof core.getBooleanInput>()
export const startGroup = jest.fn<typeof core.startGroup>()
export const endGroup = jest.fn<typeof core.endGroup>()

export const summary = {
  addRaw: jest.fn().mockReturnThis(),
  write: jest.fn(async () => undefined)
}

export const getInput = jest.fn(
  (name: string, options?: { required?: boolean }) => {
    // Default test inputs
    const inputs: Record<string, string> = {
      'start-time': '1000',
      'workflow-name': 'TestWorkflow',
      'workflow-success': '1',
      'loki-push-url': 'https://loki.example.com',
      'prom-push-token': 'token',
      'app-name': 'TestApp',
      'loki-timeout': '10000' // Default timeout
    }
    const value = inputs[name] || ''
    if (options?.required && !value) {
      throw new Error(`Input required and not supplied: ${name}`)
    }
    return value
  }
)
