import * as core from '@actions/core'
import { pushToLoki } from './pushToLoki.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    await pushToLoki()
  } catch (error: unknown) {
    if (error instanceof Error) {
      core.error(`Action failed with error: ${error.message}`)
    } else {
      core.error('Action failed with an unknown error')
    }
  }
  try {
    await pushToLoki()
  } catch (error: unknown) {
    if (error instanceof Error) {
      core.error(`Action failed with error: ${error.message}`)
    } else {
      core.error('Action failed with an unknown error')
    }
  }
}
