import * as core from "@actions/core";

export interface Config {
  githubToken: string;
  anyOfLabels: string[];
  noneOfLabels: string[];
}

export const getConfig = (): Config => {
  const githubToken = core.getInput("github-token");
  const anyOfLabels = parseLabels(core.getInput("any_of"));
  const noneOfLabels = parseLabels(core.getInput("none_of"));

  return {
    githubToken,
    anyOfLabels,
    noneOfLabels
  } as const;
};

const parseLabels = (text: string) => text.split(",").map(l => l.trim());
