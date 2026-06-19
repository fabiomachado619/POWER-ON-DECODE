import type { RegisteredTool } from "@/tools/types";
import { process__PASCALNAME__ } from "./processor";
import { run__PASCALNAME__Tests } from "./tests";
import { __CAMELNAME__Config } from "./tool.config";
import { validate__PASCALNAME__ } from "./validator";

export const __camelName__Tool: RegisteredTool = {
  config: __CAMELNAME__Config,
  validate: validate__PASCALNAME__,
  process: process__PASCALNAME__,
  runTests: run__PASCALNAME__Tests,
};

export {
  __CAMELNAME__Config,
  validate__PASCALNAME__,
  process__PASCALNAME__,
  run__PASCALNAME__Tests,
};
