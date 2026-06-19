import { toToolRunnerViewModel } from "@/tools/serializable";
import { ssangyongRexton25c320DecodeConfig } from "@/tools/ssangyong-rexton-25c320-decode/tool.config";
import { ToolRunnerPage } from "@/components/tool-runner/ToolRunnerPage";

export function SsangyongRexton25c320DecodePage() {
  return (
    <ToolRunnerPage
      config={toToolRunnerViewModel(ssangyongRexton25c320DecodeConfig)}
    />
  );
}
