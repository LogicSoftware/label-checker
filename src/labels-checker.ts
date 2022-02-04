import { Config } from "./config";

type LabelsConfig = Pick<Config, "anyOfLabels" | "noneOfLabels">;

export const checkLabels = (
  prLabels: string[],
  { anyOfLabels = [], noneOfLabels = [] }: LabelsConfig
): string | null => {
  prLabels = prLabels.map(x => x.toLowerCase());

  const deniedLabels = noneOfLabels.filter(x =>
    prLabels.includes(x.toLowerCase())
  );
  if (deniedLabels.length) {
    const labels = formatLabels(deniedLabels);
    return `Deny merge pr until it's labeled with label(s): ${labels}.`;
  }

  if (
    anyOfLabels.length &&
    !anyOfLabels.some(x => prLabels.includes(x.toLowerCase()))
  ) {
    const labels = formatLabels(anyOfLabels);
    return `PR must be labeled with one or more of these required labels: ${labels}.`;
  }

  return null;
};

const formatLabels = (labels: string[]) =>
  labels.map(x => `**${x}**`).join(", ");
