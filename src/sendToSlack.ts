import * as core from '@actions/core'
import * as github from '@actions/github'
import * as http from '@actions/http-client'

export async function sendToSlack(): Promise<void> {
  const startTime = core.getInput('start-time', { required: true })
  const workflowName = core.getInput('workflow-name', { required: true })
  const workflowSuccess = core.getInput('workflow-success', { required: true })
  const appName = core.getInput('app-name', { required: true })
  const dryRun = core.getBooleanInput('dry-run')
  const githubUrl = core.getInput('github-url', { required: true })
  const serviceURL = core.getInput('service-url', { required: true })
  const imageName = core.getInput('image-name', { required: true })
  const imageTag = core.getInput('image-tag', { required: true })
  const cicdSlackWebHook = core.getInput('cicd-slack-webhook', {
    required: true
  })

  const metricTimestamp = Date.now()
  const durationMs = metricTimestamp - Number(startTime)
  const durationSec = Math.floor(durationMs / 1000)

  const githubRunId = github.context.runId
  const githubRepo = `${github.context.repo.owner}/${github.context.repo.repo}`

  const runStatus =
    !startTime || workflowSuccess === '0' ? 'failure' : 'success'

  let message = `*${workflowName}* workflow in *${appName}* has completed with status: *${runStatus.toUpperCase()}*\n`
  message += `*Duration:* ${durationSec} seconds\n`
  message += `*Details:* ${githubUrl}/${githubRepo}/actions/runs/${githubRunId}`
  message += `Service URL: ${serviceURL}\n`
  message += `Image: ${imageName}:${imageTag}\n`

  const slackPayload = {
    text: message
  }

  const httpClient = new http.HttpClient()
  if (dryRun) {
    core.info('Dry run enabled, not sending to Loki')
    return
  }

  const res = await httpClient.post(
    cicdSlackWebHook,
    JSON.stringify(slackPayload),
    {
      'Content-Type': 'application/json'
    }
  )

  const body = await res.readBody()

  if (res.message.statusCode && res.message.statusCode >= 400) {
    throw new Error(
      `Failed to push to Slack: ${res.message.statusCode} ${res.message.statusMessage} - ${body}`
    )
  }
}
