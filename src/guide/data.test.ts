import { describe, expect, it } from "vitest";
import { GuideValidationError, loadGuide } from "./loadGuide";

const files = Object.entries(import.meta.glob("../../data/*.json", { eager: true, import: "default" }));

describe.skipIf(files.length === 0)("data/*.json", () => {
  it("loads as one valid guide (all files merged)", () => {
    try {
      loadGuide(files.map(([, f]) => f));
    } catch (e) {
      if (e instanceof GuideValidationError) expect.fail(e.message);
      throw e;
    }
  });
});
