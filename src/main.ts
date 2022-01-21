import * as core from '@actions/core'
import * as github from '@actions/github'
// test5
async function run(): Promise<void> {
  if (!github.context.payload.pull_request) {
    return
  }

  try {
    const config = getConfig()
    const client = github.getOctokit(config.githubToken)

    const pullRequest = await client.rest.pulls.get({
      ...github.context.repo,
      pull_number: github.context.payload.pull_request.number
    })

    const reviews = await client.rest.pulls.listReviews({
      ...github.context.repo,
      pull_number: github.context.payload.pull_request.number
    })

    const lastReview = (reviews.data ?? [])
      .filter(x => x.body && x.body.startsWith('label-checker'))
      // todo: order
      .reverse()[0]

    const actualLabels = pullRequest.data.labels.map(x => x.name)
    const isOk = config.anyOfLabels.some(label => actualLabels.includes(label))
    const newStatus = isOk ? 'APPROVE' : 'REQUEST_CHANGES'

    if (newStatus !== lastReview?.state) {
      await client.rest.pulls.createReview({
        pull_number: github.context.payload.pull_request.number,
        ...github.context.repo,
        body: `label-checker: ${newStatus}`,
        event: newStatus
      })
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

interface Config {
  githubToken: string
  anyOfLabels: string[]
}

const getConfig = (): Config => {
  const githubToken = core.getInput('github-token')
  const anyOfLabelsText = core.getInput('any_of')
  const anyOfLabels = anyOfLabelsText.split(',').map(l => l.trim())

  return {
    githubToken,
    anyOfLabels
  } as const
}

run()
