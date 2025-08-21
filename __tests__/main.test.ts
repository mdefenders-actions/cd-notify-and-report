/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import { pushToLoki } from '../__fixtures__/pushToLoki.js'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('../src/pushToLoki.js', () => ({ pushToLoki }))

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

describe('main.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    core.getInput.mockImplementation((name: string) => {
      if (name === 'milliseconds') return '1000'
      return 'test-value'
    })
  })

  it('calls pushToLoki during run', async () => {
    await run()
    expect(pushToLoki).toHaveBeenCalled()
  })

  it('sets the time output after run', async () => {
    await run()
    expect(core.setOutput).toHaveBeenCalledWith(
      'time',
      expect.stringMatching(/\d{2}:\d{2}:\d{2}/)
    )
  })

  it('sets the report output after run', async () => {
    await run()
    expect(core.setOutput).toHaveBeenCalledWith('report', '')
  })

  it('logs debug messages for waiting and timestamps', async () => {
    await run()
    expect(core.debug).toHaveBeenCalledWith('Waiting 1000 milliseconds ...')
    expect(core.debug).toHaveBeenCalledWith(
      expect.stringMatching(/\d{2}:\d{2}:\d{2}/)
    )
  })

  it('handles errors from pushToLoki and sets failed status', async () => {
    pushToLoki.mockImplementationOnce(() =>
      Promise.reject(new Error('Loki error'))
    )
    await run()
    expect(core.error).toHaveBeenCalledWith(
      'Action failed with error: Loki error'
    )
    expect(core.setFailed).toHaveBeenCalledWith('Loki error')
    expect(core.setOutput).toHaveBeenCalledWith('report', '')
  })

  it('handles unknown errors and sets failed status', async () => {
    pushToLoki.mockImplementationOnce(() => {
      throw 'unknown'
    })
    await run()
    expect(core.error).toHaveBeenCalledWith(
      'Action failed with an unknown error'
    )
    expect(core.setFailed).toHaveBeenCalledWith('Unknown error occurred')
    expect(core.setOutput).toHaveBeenCalledWith('report', '')
  })
})
