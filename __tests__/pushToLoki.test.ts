import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as github from '../__fixtures__/github.js'
import { HttpClient, createHttpResponse } from '../__fixtures__/http-client.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)
jest.unstable_mockModule('@actions/http-client', () => ({ HttpClient }))

const { pushToLoki } = await import('../src/pushToLoki.js')

describe('pushToLoki', () => {
  const OLD_ENV = process.env
  let mockPost: jest.Mock

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
        'app-name': 'TestApp',
        'loki-timeout': '10000'
      }
      return inputs[name] || ''
    })
    github.context.runId = 12345
    github.context.repo = { owner: 'octocat', repo: 'hello-world' }

    // fresh client each test
    mockPost = jest.fn()
    ;(HttpClient as jest.Mock).mockImplementation(() => ({
      post: mockPost
    }))
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = OLD_ENV
  })

  it('should push log entry to Loki successfully', async () => {
    // @ts-expect-error mocking post method
    mockPost.mockResolvedValue(createHttpResponse(200, ''))
    await expect(pushToLoki()).resolves.toBeUndefined()
    expect(mockPost).toHaveBeenCalled()
  })

  it('should throw if Loki returns error', async () => {
    mockPost.mockResolvedValue(
      // @ts-expect-error mocking post method
      createHttpResponse(500, '', 'Internal Server Error')
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
    // @ts-expect-error mocking post method
    mockPost.mockResolvedValue(createHttpResponse(200, ''))

    await pushToLoki()

    const body = mockPost.mock.calls[0][1] // 2nd arg is body
    const payload = JSON.parse(body as string)
    expect(payload.streams[0].stream.status).toBe('failure')
  })

  it('should throw if required input is missing', async () => {
    core.getInput.mockImplementation(
      (name: string, options?: { required?: boolean }) => {
        if (name === 'start-time') {
          if (options?.required) {
            throw new Error(`Input required and not supplied: ${name}`)
          }
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
    // @ts-expect-error mocking post method
    mockPost.mockResolvedValue(createHttpResponse(200, ''))
    await expect(pushToLoki()).rejects.toThrow()
  })

  it('should throw if Loki returns 404 Not Found', async () => {
    // @ts-expect-error mocking post method
    mockPost.mockResolvedValue(createHttpResponse(404, '', 'Not Found'))
    await expect(pushToLoki()).rejects.toThrow(
      'Failed to push to Loki: 404 Not Found'
    )
  })
})
