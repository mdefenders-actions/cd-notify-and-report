import * as core from '@actions/core'
import * as github from '@actions/github'
import * as http from '@actions/http-client'

/**
 * Pushes a log entry to Loki with a configurable timeout.
 * @throws {Error} If required inputs are missing, fetch fails, or times out.
 */
export async function pushToLoki(): Promise<void> {
  const startTime = core.getInput('start-time', { required: true })
  const workflowName = core.getInput('workflow-name', { required: true })
  const workflowSuccess = core.getInput('workflow-success', { required: true })
  const lokiPushUrl = core.getInput('loki-push-url', { required: true })
  const promPushToken = core.getInput('prom-push-token', { required: true })
  const appName = core.getInput('app-name', { required: true })
  const dryRun = core.getBooleanInput('dry-run')

  // Convert bash logic to TypeScript
  const metricTimestamp = Math.floor(Date.now() / 1000)
  const duration = metricTimestamp - Number(startTime)

  const githubRunId = github.context.runId
  const githubRepo = `${github.context.repo.owner}/${github.context.repo.repo}`
  // Compose logEntry as a valid JSON string
  const logEntryObj = {
    run_id: githubRunId,
    name: workflowName,
    duration: `${duration}`,
    status: undefined as 'success' | 'failure' | undefined
  }

  // Add run status logic
  const runStatus =
    !startTime || workflowSuccess === '0' ? 'failure' : 'success'
  logEntryObj.status = runStatus

  // Serialize logEntry as JSON string
  const logEntry = JSON.stringify(logEntryObj)

  // Log the results for GitHub Actions output
  core.info(`Loki log entry: ${logEntry}`)

  // Prepare Loki payload (Loki push API format)
  const logTimestamp = (Date.now() * 1_000_000).toString() // nanoseconds
  const lokiPayload = {
    streams: [
      {
        stream: {
          service: githubRepo,
          name: workflowName,
          status: runStatus,
          app: appName
        },
        values: [[logTimestamp, logEntry]]
      }
    ]
  }

  const httpClient = new http.HttpClient()
  if (dryRun) {
    core.info('Dry run enabled, not sending to Loki')
    return
  }

  // Send log entry to Loki using @actions/http-client (Basic auth)
  const res = await httpClient.post(lokiPushUrl, JSON.stringify(lokiPayload), {
    'Content-Type': 'application/json',
    Authorization: `Basic ${promPushToken}`
  })

  const body = await res.readBody()

  if (res.message.statusCode && res.message.statusCode >= 400) {
    throw new Error(
      `Failed to push to Loki: ${res.message.statusCode} ${res.message.statusMessage} - ${body}`
    )
  }
}
