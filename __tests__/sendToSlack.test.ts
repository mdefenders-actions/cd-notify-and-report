import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as github from '../__fixtures__/github.js'
import { HttpClient, createHttpResponse } from '../__fixtures__/http-client.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)
jest.unstable_mockModule('@actions/http-client', () => ({ HttpClient }))

const { sendToSlack } = await import('../src/sendToSlack.js')

describe('sendToSlack', () => {
  let mockPost: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    core.getInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        'start-time': '1000',
        'workflow-name': 'TestWorkflow',
        'workflow-success': '1',
        'app-name': 'TestApp',
        'github-url': 'https://github.com/octocat/hello-world',
        'service-url': 'https://service.example.com',
        'image-name': 'octocat/hello-world',
        'image-tag': 'latest',
        'cicd-slack-webhook': 'https://hooks.slack.com/services/test/webhook'
      }
      return inputs[name] || ''
    })
    core.getBooleanInput.mockReturnValue(false)
    github.context.runId = 12345
    github.context.repo = { owner: 'octocat', repo: 'hello-world' }
    mockPost = jest.fn()
    ;(HttpClient as jest.Mock).mockImplementation(() => ({ post: mockPost }))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should send message to Slack and succeed if response is ok', async () => {
    // @ts-expect-error mocjing only post method
    mockPost.mockResolvedValue(createHttpResponse(200, 'ok'))
    await expect(sendToSlack()).resolves.toBeUndefined()
  })

  it('should throw if required input is missing', async () => {
    core.getInput.mockImplementation(
      (name: string, options?: { required?: boolean }) => {
        if (name === 'start-time' && options?.required) {
          throw new Error(`Input required and not supplied: ${name}`)
        }
        return ''
      }
    )
    // @ts-expect-error mocjing only post method
    mockPost.mockResolvedValue(createHttpResponse(200, 'ok'))
    await expect(sendToSlack()).rejects.toThrow(
      'Input required and not supplied: start-time'
    )
  })

  it('should throw if Slack returns status >= 400', async () => {
    mockPost.mockResolvedValue(
      // @ts-expect-error mocjing only post method
      createHttpResponse(404, 'Not Found', 'Not Found')
    )
    await expect(sendToSlack()).rejects.toThrow(
      'Failed to push to Slack: 404 Not Found - Not Found'
    )
  })

  it('should throw if Slack response body is not ok', async () => {
    // @ts-expect-error mocjing only post method
    mockPost.mockResolvedValue(createHttpResponse(200, 'error'))
    await expect(sendToSlack()).rejects.toThrow(
      'Unexpected Slack response: error'
    )
  })

  it('should handle dry-run and not send to Slack', async () => {
    core.getBooleanInput.mockReturnValue(true)
    const infoSpy = jest.spyOn(core, 'info')
    await expect(sendToSlack()).resolves.toBeUndefined()
    expect(infoSpy).toHaveBeenCalledWith(
      'Dry run enabled, not sending to Slack'
    )
    expect(mockPost).not.toHaveBeenCalled()
  })
})
