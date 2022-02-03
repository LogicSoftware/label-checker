import { Config } from "./config";

type LabelsConfig = Pick<Config, "anyOfLabels" | "noneOfLabels">;

export const labelsCheckerName = "@label-checker";

export const checkLabels = (
  prLabels: string[],
  { anyOfLabels = [], noneOfLabels = [] }: LabelsConfig
) => {
  prLabels = prLabels.map(x => x.toLowerCase());
  let errors: string[] = [];

  if (
    anyOfLabels.length &&
    !anyOfLabels.some(x => prLabels.includes(x.toLowerCase()))
  ) {
    const requiredLabels = anyOfLabels.join(", ");
    errors.push(
      ` - it's not labeled with one or more of these required labels: ${requiredLabels}.`
    );
  }

  const deniedLabels = noneOfLabels.filter(x =>
    prLabels.includes(x.toLowerCase())
  );
  if (deniedLabels.length) {
    errors.push(` - it's labeled with label(s): ${deniedLabels.join(", ")}.`);
  }

  if (errors.length) {
    errors = [`${labelsCheckerName}: Deny merge pr until`, ...errors];
  }

  return { success: !errors.length, errorMsg: errors.join("\n") } as const;
};
