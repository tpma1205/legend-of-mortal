import { loadGuide, type Guide } from "./loadGuide";
import { validFile } from "./fixtures";

const files = Object.values(import.meta.glob("../../data/*.json", { eager: true, import: "default" }));

export const isDemo = files.length === 0 && import.meta.env.DEV;

/** Real data from data/*.json; in dev with no data yet, falls back to the fixture so the UI can be built. */
export const guide: Guide = loadGuide(isDemo ? [validFile()] : files);
