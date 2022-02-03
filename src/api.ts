import * as github from "@actions/github";
import { GitHub } from "@actions/github/lib/utils";
import { labelsCheckerName } from "./labels-checker";

type Options = {
  githubToken: string;
  repo: typeof github.context.repo;
  pull_number: number;
};

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

  async getLastChangesRequestedReview() {
    const reviews = await this._client.rest.pulls.listReviews(
      this._basePayload
    );

    return (reviews.data ?? []).filter(
      x =>
        x.body &&
        x.body.startsWith(labelsCheckerName) &&
        x.state === "CHANGES_REQUESTED" &&
        x.user?.type === "Bot"
    )[0];
  }

  async requestChanges(message: string) {
    await this._client.rest.pulls.createReview({
      ...this._basePayload,
      body: message,
      event: "REQUEST_CHANGES"
    });
  }

  async updateReviewMessage(review: { id: number }, message: string) {
    await this._client.rest.pulls.updateReview({
      ...this._basePayload,
      review_id: review.id,
      body: message
    });
  }

  async dismissReview(review: { id: number }) {
    await this._client.rest.pulls.dismissReview({
      ...this._basePayload,
      review_id: review.id,
      message: "LGTM"
    });
  }
}
