import * as github from "@actions/github";
import { GitHub } from "@actions/github/lib/utils";

type Options = {
  githubToken: string;
  repo: typeof github.context.repo;
  pull_number: number;
  sha: string;
};

type StatusState = "error" | "failure" | "pending" | "success";

export class GithubApi {
  private _options: Options;
  private _client: InstanceType<typeof GitHub>;
  private _basePayload: { owner: string; pull_number: number; repo: string };

  constructor(options: Options) {
    this._options = options;
    this._client = github.getOctokit(options.githubToken);

    const { repo, pull_number } = this._options;
    this._basePayload = { ...repo, pull_number } as const;
  }

  async getPullRequestLabels() {
    const pullRequest = await this._client.rest.pulls.get(this._basePayload);
    return (
      (pullRequest.data.labels ?? [])
        .filter(x => x.name != null)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .map(x => x.name!)
    );
  }

  async setPrStatus(state: StatusState, context: string, description?: string) {
    description = description ?? "Ok";
    await this._client.rest.repos.createCommitStatus({
      ...this._options.repo,
      sha: this._options.sha,
      state,
      context,
      target_url: "https://github.com/LogicSoftware/label-checker",
      description
    });
  }
}
