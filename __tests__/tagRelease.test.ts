import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as fs from '../__fixtures__/fs.js'
import { exec } from '../__fixtures__/exec.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('fs/promises', () => fs)
jest.unstable_mockModule('@actions/exec', () => ({ exec }))

const { tagRelease } = await import('../src/tagRelease.js')

describe('tagRelease', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    core.getInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        'version-file': 'version.json',
        'dry-run': 'false'
      }
      return inputs[name] || ''
    })
    core.getBooleanInput.mockImplementation((name: string) =>
      name === 'dry-run' ? false : false
    )
    fs.readFile.mockResolvedValue('{"version":"1.2.3"}')
    exec.mockResolvedValue(0)
  })

  it('tags and pushes when version is valid and not dry run', async () => {
    await tagRelease()
    expect(exec).toHaveBeenCalledWith('git', [
      'config',
      '--global',
      'user.name',
      'github-actions[bot]'
    ])
    expect(exec).toHaveBeenCalledWith('git', [
      'config',
      '--global',
      'user.email',
      'github-actions[bot]@users.noreply.github.com'
    ])
    expect(exec).toHaveBeenCalledWith('git', ['tag', '1.2.3'])
    expect(exec).toHaveBeenCalledWith('git', ['push', 'origin', '1.2.3'])
    expect(core.info).toHaveBeenCalledWith(
      'Git repository tagged with 1.2.3 version'
    )
  })

  it('skips tag and push in dry run mode', async () => {
    core.getBooleanInput.mockImplementation((name: string) => {
      const inputs: Record<string, boolean> = {
        'dry-run': true
      }
      return inputs[name] ?? false
    })
    await tagRelease()
    expect(exec).not.toHaveBeenCalledWith('git', ['tag', '1.2.3'])
    expect(exec).not.toHaveBeenCalledWith('git', ['push', 'origin', '1.2.3'])
    expect(core.info).toHaveBeenCalledWith(
      'Dry run enabled, skipped git tag and push'
    )
  })

  it('throws error for invalid version', async () => {
    fs.readFile.mockResolvedValue('{"version":"not-semver"}')
    await tagRelease()
    expect(core.error).toHaveBeenCalledWith(
      'Tag release error: Invalid or missing version in version.json: must be a valid semver string (e.g., 1.2.3)'
    )
  })

  it('logs error if git tag fails and does not throw', async () => {
    exec.mockImplementationOnce(() => {
      throw new Error('git error')
    })
    await tagRelease()
    expect(core.error).toHaveBeenCalledWith('Tag release error: git error')
  })

  it('throws error if version is missing', async () => {
    fs.readFile.mockResolvedValue('{}')
    await tagRelease()
    expect(core.error).toHaveBeenCalledWith(
      'Tag release error: Invalid or missing version in version.json: must be a valid semver string (e.g., 1.2.3)'
    )
  })
})
