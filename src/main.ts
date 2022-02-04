import * as core from "@actions/core";
import * as github from "@actions/github";
import { Config, getConfig } from "./config";
import { botName, GithubApi } from "./api";
import { checkLabels } from "./labels-checker";

async function run(): Promise<void> {
  if (!github.context.payload.pull_request) {
    return;
  }

  try {
    const config = getConfig();
    const client = new GithubApi({
      githubToken: config.githubToken,
      pull_number: github.context.payload.pull_request.number,
      repo: github.context.repo,
      sha: github.context.payload.pull_request.head.sha
    });

    const errors = [
      await getLabelsError(client, config),
      getTasksListError(github.context.payload.pull_request.body!)
    ].filter(x => !!x);

    const errorMsg = errors.length ? `${botName}:\n${errors.join("\n")}` : null;
    const isSuccessful = !errorMsg;

    const lastReview = await client.getLastChangesRequestedReview();

    if (isSuccessful) {
      // remove "changes requested" if labels are ok now.
      if (lastReview) {
        await client.dismissReview(lastReview);
      }
      return;
    }

    if (!lastReview) {
      await client.requestChanges(errorMsg);
      return;
    }

    if (lastReview.body_text !== errorMsg) {
      await client.updateReviewMessage(lastReview, errorMsg);
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

async function getLabelsError(client: GithubApi, config: Config) {
  const actualLabels = await client.getPullRequestLabels();
  return checkLabels(actualLabels, config);
}

function getTasksListError(prBody: string): string | null {
  const hasUncheckedTask = /-\s*\[\s\]/g.test(prBody);
  return hasUncheckedTask ? "Tasks list is not completed yet" : null;
}

run();
