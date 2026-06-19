import { __CAMELNAME__Config } from "@/tools/__SLUG__/tool.config";
import { toToolRunnerViewModel } from "@/tools/serializable";
import { ToolRunnerPage } from "@/components/tool-runner/ToolRunnerPage";

export function __PASCALNAME__Page() {
  return (
    <ToolRunnerPage
      config={toToolRunnerViewModel(__CAMELNAME__Config)}
    />
  );
}
