import * as core from "@actions/core";
import * as github from "@actions/github";
import { Config, getConfig } from "./config";
import { GithubApi } from "./api";
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

    const { success, errorMsg } = [
      await runLabelsCheck(client, config),
      runTasksListCheck(github.context.payload.pull_request.body!)
    ].reduce((acc, res) => ({
      success: acc.success && res.success,
      errorMsg: [acc.errorMsg, res.errorMsg].filter(x => x).join("\n")
    }));

    const lastReview = await client.getLastChangesRequestedReview();

    if (success) {
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

async function runLabelsCheck(client: GithubApi, config: Config) {
  const actualLabels = await client.getPullRequestLabels();
  return checkLabels(actualLabels, config);
}

function runTasksListCheck(prBody: string) {
  const hasUncheckedTask = /-\s*\[\s\]/g.test(prBody);
  return {
    success: !hasUncheckedTask,
    errorMsg: hasUncheckedTask ? "Task list not completed yet" : ""
  };
}

run();
