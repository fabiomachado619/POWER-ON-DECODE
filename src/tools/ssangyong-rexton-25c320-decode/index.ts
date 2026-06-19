import type { RegisteredTool } from "@/tools/types";
import { processSsangyongRexton25c320Decode } from "./processor";
import { runSsangyongRexton25c320DecodeTests } from "./tests";
import { ssangyongRexton25c320DecodeConfig } from "./tool.config";
import { validateSsangyongRexton25c320Decode } from "./validator";

export const ssangyongRexton25c320DecodeTool: RegisteredTool = {
  config: ssangyongRexton25c320DecodeConfig,
  validate: validateSsangyongRexton25c320Decode,
  process: processSsangyongRexton25c320Decode,
  runTests: runSsangyongRexton25c320DecodeTests,
};

export {
  ssangyongRexton25c320DecodeConfig,
  validateSsangyongRexton25c320Decode,
  processSsangyongRexton25c320Decode,
  runSsangyongRexton25c320DecodeTests,
};
