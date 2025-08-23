import * as core from '@actions/core'
import * as github from '@actions/github'
import * as http from '@actions/http-client'

export async function sendToSlack(): Promise<void> {
  const inputs = {
    startTime: core.getInput('start-time', { required: true }),
    workflowName: core.getInput('workflow-name', { required: true }),
    workflowSuccess: core.getInput('workflow-success', { required: true }),
    appName: core.getInput('app-name', { required: true }),
    // dryRun: core.getBooleanInput('dry-run'),
    dryRun: false,
    githubUrl: core.getInput('github-url', { required: true }),
    serviceURL: core.getInput('service-url', { required: true }),
    imageName: core.getInput('image-name', { required: true }),
    imageTag: core.getInput('image-tag', { required: true }),
    slackWebHook: core.getInput('cicd-slack-webhook', { required: true })
  }

  const durationSec = Math.floor((Date.now() - Number(inputs.startTime)) / 1000)
  const runStatus = inputs.workflowSuccess === '0' ? 'failure' : 'success'
  const githubRepo = `${github.context.repo.owner}/${github.context.repo.repo}`

  const message = [
    `*${inputs.workflowName}* workflow in *${inputs.appName}* has completed with status: *${runStatus.toUpperCase()}*`,
    `*Duration:* ${durationSec} seconds`,
    `*Details:* ${inputs.githubUrl}/${githubRepo}/actions/runs/${github.context.runId}`,
    `Service URL: ${inputs.serviceURL}`,
    `Image: ${inputs.imageName}:${inputs.imageTag}`
  ].join('\n')

  if (inputs.dryRun) {
    core.info('Dry run enabled, not sending to Slack')
    return
  }

  const httpClient = new http.HttpClient()
  const res = await httpClient.post(
    inputs.slackWebHook,
    JSON.stringify({ text: message }),
    { 'Content-Type': 'application/json' }
  )

  if (res.message.statusCode && res.message.statusCode >= 400) {
    const body = await res.readBody()
    throw new Error(
      `Failed to push to Slack: ${res.message.statusCode} ${res.message.statusMessage} - ${body}`
    )
  }
}
