import * as core from '@actions/core'
import { pushToLoki } from './pushToLoki.js'
import { sendToSlack } from './sendToSlack.js'
import { tagRelease } from './tagRelease.js'

/**
 * Executes the main action logic.
 */
export async function run(): Promise<void> {
  const actions: Array<() => Promise<void>> = []

  // Add tagRelease if environment is staging  and workflow succeeded
  if (
    core.getInput('environment', { required: true }) === 'staging' &&
    core.getInput('workflow-success', { required: true }) === '1'
  ) {
    actions.push(tagRelease)
  }

  // Add pushToLoki and sendToSlack
  actions.push(pushToLoki, sendToSlack)

  // Execute actions sequentially with error logging
  for (const action of actions) {
    try {
      await action()
    } catch (error) {
      core.error(
        `Action failed with error: ${error instanceof Error ? error.message : 'unknown error'}`
      )
    }
  }
}
