import { Config } from "./config";

type LabelsConfig = Pick<Config, "anyOfLabels" | "noneOfLabels">;

type Result = { success: boolean; errorMsg: string };

export const checkLabels = (
  prLabels: string[],
  { anyOfLabels = [], noneOfLabels = [] }: LabelsConfig
): Result => {
  prLabels = prLabels.map(x => x.toLowerCase());

  const deniedLabels = noneOfLabels.filter(x =>
    prLabels.includes(x.toLowerCase())
  );
  if (deniedLabels.length) {
    const labels = formatLabels(deniedLabels);
    return {
      success: false,
      errorMsg: `Deny merge pr until it's labeled with label(s): ${labels}.`
    };
  }

  if (
    anyOfLabels.length &&
    !anyOfLabels.some(x => prLabels.includes(x.toLowerCase()))
  ) {
    const labels = formatLabels(anyOfLabels);
    return {
      success: false,
      errorMsg: `PR must be labeled with one or more of these required labels: ${labels}.`
    };
  }

  return { success: true, errorMsg: "" };
};

const formatLabels = (labels: string[]) => labels.map(x => `${x}`).join(", ");
