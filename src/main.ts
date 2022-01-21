import * as core from '@actions/core'
import * as github from '@actions/github'

// test
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

    const actualLabels = pullRequest.data.labels.map(x => x.name)
    const isOk = config.anyOfLabels.some(label => actualLabels.includes(label))
    const review = await client.rest.pulls.createReview({
      pull_number: github.context.payload.pull_request.number,
      ...github.context.repo
    })

    await client.rest.pulls.submitReview({
      review_id: review.data.id,
      pull_number: github.context.payload.pull_request.number,
      ...github.context.repo,
      event: isOk ? 'APPROVE' : 'REQUEST_CHANGES'
    })
    if (!isOk) {
      core.warning("didn't find label tested")
    }

    core.exportVariable('labels_check_passed', isOk)
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
