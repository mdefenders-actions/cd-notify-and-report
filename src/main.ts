import * as core from '@actions/core'
import { pushToLoki } from './pushToLoki.js'
import { sendToSlack } from './sendToSlack.js'

/**
 * Executes the main action logic.
 */
export async function run(): Promise<void> {
  for (const action of [pushToLoki, sendToSlack]) {
    try {
      await action()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      core.error(`Action failed with error: ${message}`)
    }
  }
}