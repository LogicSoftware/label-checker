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

    await runLabelsCheck(client, config);
    await runTasksListCheck(client, github.context.payload.pull_request.body!);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

async function runLabelsCheck(client: GithubApi, config: Config) {
  const actualLabels = await client.getPullRequestLabels();
  const { success, errorMsg } = checkLabels(actualLabels, config);

  const result = await client.setPrStatus(
    success ? "success" : "pending",
    "labels-checker",
    errorMsg
  );

  core.warning(JSON.stringify(result));
}

async function runTasksListCheck(client: GithubApi, prBody: string) {
  const hasUncheckedTask = /-\s*\[\s\]/g.test(prBody);
  await client.setPrStatus(
    hasUncheckedTask ? "pending" : "success",
    "Tasks List Checker",
    hasUncheckedTask ? "task list not completed yet" : ""
  );
}

run();
