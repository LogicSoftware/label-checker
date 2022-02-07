import { expect, it, describe } from "@jest/globals";
import { checkLabels } from "../src/labels-checker";

describe("checkLabels", () => {
  it("should be success if pr has any_of label", () => {
    let config = { anyOfLabels: ["tested", "partial"], noneOfLabels: [] };
    const error = checkLabels(["tested"], config);

    expect(error).toBeNull();
  });

  it("should be success if pr has any_of label ignoring case", () => {
    let config = { anyOfLabels: ["tEsted", "partial"], noneOfLabels: [] };
    const error = checkLabels(["Tested"], config);

    expect(error).toBeNull();
  });

  it("should fail if pr has not any_of label", () => {
    let config = { anyOfLabels: ["tested", "partial"], noneOfLabels: [] };
    const error = checkLabels(["untested"], config);

    expect(error).toBe(
      "PR must be labeled with one or more of these required labels: **tested**, **partial**."
    );
  });

  it("should be success if pr has not denied labels", () => {
    let config = { anyOfLabels: [], noneOfLabels: ["untested"] };
    const error = checkLabels(["tested"], config);

    expect(error).toBeNull();
  });

  it("should fail if pr has one of denied labels", () => {
    let config = { anyOfLabels: [], noneOfLabels: ["untested"] };
    const error = checkLabels(["untested", "accumulative"], config);

    expect(error).toBe(
      "Deny merge pr until it's labeled with label(s): **untested**."
    );
  });

  it("should fail if pr has one of denied labels  ignoring case", () => {
    let config = { anyOfLabels: [], noneOfLabels: ["Untested"] };
    const error = checkLabels(["untesteD", "accumulative"], config);

    expect(error).toBe(
      "Deny merge pr until it's labeled with label(s): **Untested**."
    );
  });
});
