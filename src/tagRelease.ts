import * as fs from 'fs/promises'

import * as core from '@actions/core'
import { exec } from '@actions/exec'

export async function tagRelease(): Promise<void> {
  const versionFile = core.getInput('version-file', { required: true })
  const dryRun = core.getBooleanInput('dry-run')
  const data = JSON.parse(await fs.readFile(versionFile, 'utf-8'))
  if (
    typeof data.version !== 'string' ||
    !/^\d+\.\d+\.\d+$/.test(data.version)
  ) {
    throw new Error(
      `Invalid or missing version in ${versionFile}: must be a valid semver string (e.g., 1.2.3)`
    )
  }
  try {
    await exec('git', [
      'config',
      '--global',
      'user.name',
      'github-actions[bot]'
    ])
    await exec('git', [
      'config',
      '--global',
      'user.email',
      'github-actions[bot]@users.noreply.github.com'
    ])
    if (dryRun) {
      core.info('Dry run enabled, skipped git tag and push')
      return
    }
    await exec('git', ['tag', data.version])
    await exec('git', ['push', 'origin', data.version])
    core.info(`Git repository tagged with ${data.version} version`)
  } catch (error) {
    core.error(
      `Git tag error: ${error instanceof Error ? error.message : error}`
    )
  }
}
