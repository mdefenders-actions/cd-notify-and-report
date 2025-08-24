/**
 * Unit tests for the action's main functionality, src/main.ts
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import { pushToLoki } from '../__fixtures__/pushToLoki.js'
import { sendToSlack } from '../__fixtures__/sendToSlack.js'
import { tagRelease } from '../__fixtures__/tagRelease.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('../src/pushToLoki.js', () => ({ pushToLoki }))
jest.unstable_mockModule('../src/sendToSlack.js', () => ({ sendToSlack }))
jest.unstable_mockModule('../src/tagRelease.js', () => ({ tagRelease }))

const { run } = await import('../src/main.js')

describe('main.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    core.getInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        environment: 'dev'
      }
      return inputs[name] || ''
    })
  })

  it('calls pushToLoki and sendToSlack during run', async () => {
    await run()
    expect(pushToLoki).toHaveBeenCalled()
    expect(sendToSlack).toHaveBeenCalled()
  })

  it('logs error if pushToLoki throws', async () => {
    ;(pushToLoki as jest.Mock).mockImplementationOnce(() => {
      throw new Error('loki error')
    })
    await run()
    expect(core.error).toHaveBeenCalledWith(
      'Action failed with error: loki error'
    )
    expect(sendToSlack).toHaveBeenCalled()
  })

  it('logs error if sendToSlack throws', async () => {
    ;(sendToSlack as jest.Mock).mockImplementationOnce(() => {
      throw new Error('slack error')
    })
    await run()
    expect(core.error).toHaveBeenCalledWith(
      'Action failed with error: slack error'
    )
    expect(pushToLoki).toHaveBeenCalled()
  })

  it('logs error for unknown error type', async () => {
    ;(pushToLoki as jest.Mock).mockImplementationOnce(() => {
      throw 'some string error'
    })
    await run()
    expect(core.error).toHaveBeenCalledWith(
      'Action failed with error: unknown error'
    )
  })

  it('calls tagRelease, pushToLoki, and sendToSlack if environment is staging', async () => {
    core.getInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        environment: 'staging'
      }
      return inputs[name] || ''
    })
    tagRelease.mockClear()
    await run()
    expect(tagRelease).toHaveBeenCalled()
    expect(pushToLoki).toHaveBeenCalled()
    expect(sendToSlack).toHaveBeenCalled()
  })
})
