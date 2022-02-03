import { expect, it, describe } from "@jest/globals";
import { checkLabels } from "../src/labels-checker";

describe("checkLabels", () => {
  it("should be success if pr has any_of label", () => {
    let config = { anyOfLabels: ["tested", "partial"], noneOfLabels: [] };
    const result = checkLabels(["tested"], config);

    expect(result.success).toBe(true);
  });

  it("should be success if pr has any_of label ignoring case", () => {
    let config = { anyOfLabels: ["tEsted", "partial"], noneOfLabels: [] };
    const result = checkLabels(["Tested"], config);

    expect(result.success).toBe(true);
  });

  it("should fail if pr has not any_of label", () => {
    let config = { anyOfLabels: ["tested", "partial"], noneOfLabels: [] };
    const result = checkLabels(["untested"], config);

    expect(result).toEqual({
      success: false,
      errorMsg:
        "@label-checker: Deny merge pr until\n" +
        " - it's not labeled with one or more of these required labels: tested, partial."
    });
  });

  it("should be success if pr has not denied labels", () => {
    let config = { anyOfLabels: [], noneOfLabels: ["untested"] };
    const result = checkLabels(["tested"], config);

    expect(result.success).toBe(true);
  });

  it("should fail if pr has one of denied labels", () => {
    let config = { anyOfLabels: [], noneOfLabels: ["untested"] };
    const result = checkLabels(["untested", "accumulative"], config);

    expect(result).toEqual({
      success: false,
      errorMsg:
        "@label-checker: Deny merge pr until\n" +
        " - it's labeled with label(s): untested."
    });
  });

  it("should fail if pr has one of denied labels  ignoring case", () => {
    let config = { anyOfLabels: [], noneOfLabels: ["Untested"] };
    const result = checkLabels(["untesteD", "accumulative"], config);

    expect(result).toEqual({
      success: false,
      errorMsg:
        "@label-checker: Deny merge pr until\n" +
        " - it's labeled with label(s): Untested."
    });
  });
});
