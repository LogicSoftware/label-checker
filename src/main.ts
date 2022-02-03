import * as core from "@actions/core";
import * as github from "@actions/github";
import { GithubApi } from "./api";
import { checkLabels } from "./labels-checker";
import { getConfig } from "./config";

async function run(): Promise<void> {
  if (!github.context.payload.pull_request) {
    return;
  }

  try {
    const config = getConfig();
    const client = new GithubApi({
      githubToken: config.githubToken,
      pull_number: github.context.payload.pull_request.number,
      repo: github.context.repo
    });

    const actualLabels = await client.getPullRequestLabels();
    const { success, errorMsg } = checkLabels(actualLabels, config);

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

run();
