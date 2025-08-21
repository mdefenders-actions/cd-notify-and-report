import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as github from '../__fixtures__/github.js'
import { fetch } from '../__fixtures__/fetch.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)
jest.unstable_mockModule('node-fetch', () => fetch)

const { pushToLoki } = await import('../src/pushToLoki.js')

/**
 * Integration tests for src/pushToLoki.ts
 */
describe('pushToLoki', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
    core.getInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        'start-time': '1000',
        'workflow-name': 'TestWorkflow',
        'workflow-success': '1',
        'loki-push-url': 'https://loki.example.com',
        'prom-push-token': 'token',
        'app-name': 'TestApp'
      }
      return inputs[name] || ''
    })
    github.context.runId = 12345
    github.context.repo = { owner: 'octocat', repo: 'hello-world' }
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = OLD_ENV
  })

  it('should push log entry to Loki successfully', async () => {
    fetch.mockResolvedValue(new Response(null, { status: 200 }))
    await expect(pushToLoki()).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalled()
  })

  it('should throw if Loki returns error', async () => {
    fetch.mockResolvedValue(
      new Response(null, { status: 500, statusText: 'Internal Server Error' })
    )
    await expect(pushToLoki()).rejects.toThrow(
      'Failed to push to Loki: 500 Internal Server Error'
    )
  })

  it('should set status to failure if workflowSuccess is 0', async () => {
    core.getInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        'start-time': '1000',
        'workflow-name': 'TestWorkflow',
        'workflow-success': '0',
        'loki-push-url': 'https://loki.example.com',
        'prom-push-token': 'token',
        'app-name': 'TestApp'
      }
      return inputs[name] || ''
    })
    fetch.mockResolvedValue(new Response(null, { status: 200 }))
    await pushToLoki()
    const body = fetch.mock.calls[0][1]?.body
    if (typeof body !== 'string')
      throw new Error('Loki request body is not a string')
    const payload = JSON.parse(body)
    expect(payload.streams[0].stream.status).toBe('failure')
  })

  it('should throw if required input is missing', async () => {
    core.getInput.mockImplementation(
      (name: string, options?: { required?: boolean }) => {
        if (name === 'start-time') {
          if (options?.required)
            throw new Error(`Input required and not supplied: ${name}`)
          return ''
        }
        const inputs: Record<string, string> = {
          'workflow-name': 'TestWorkflow',
          'workflow-success': '1',
          'loki-push-url': 'https://loki.example.com',
          'prom-push-token': 'token',
          'app-name': 'TestApp'
        }
        const value = inputs[name] || ''
        if (options?.required && !value) {
          throw new Error(`Input required and not supplied: ${name}`)
        }
        return value
      }
    )
    fetch.mockResolvedValue(new Response(null, { status: 200 }))
    await expect(pushToLoki()).rejects.toThrow()
  })
})
