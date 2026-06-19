import { ssangyongRexton25c320DecodeTool } from "@/tools/ssangyong-rexton-25c320-decode";
import type { RegisteredTool } from "@/tools/types";
import type { ToolConfig } from "@/tools/types";
import {
  assertToolRunnerViewModel,
  toToolRunnerViewModel,
  type ToolRunnerViewModel,
} from "@/tools/serializable";

export const toolRegistry: RegisteredTool[] = [
  ssangyongRexton25c320DecodeTool,
];

export function getRegisteredTool(slug: string): RegisteredTool | undefined {
  return toolRegistry.find((tool) => tool.config.slug === slug);
}

/**
 * Metadados seguros para Client Components (sem funções do registry).
 */
export function getToolRunnerViewModel(
  slug: string
): ToolRunnerViewModel | undefined {
  const tool = getRegisteredTool(slug);
  if (!tool) return undefined;
  return assertToolRunnerViewModel(toToolRunnerViewModel(tool.config));
}

export function getToolRunnerViewModelFromConfig(
  config: ToolConfig
): ToolRunnerViewModel {
  return assertToolRunnerViewModel(toToolRunnerViewModel(config));
}

export function isToolRegistered(slug: string): boolean {
  return toolRegistry.some((tool) => tool.config.slug === slug);
}

export function isToolImplementedInRegistry(slug: string): boolean {
  const tool = getRegisteredTool(slug);
  return Boolean(tool?.config.isImplemented);
}

export function listRegisteredTools(): RegisteredTool[] {
  return [...toolRegistry];
}

export function listImplementedTools(): RegisteredTool[] {
  return toolRegistry.filter((tool) => tool.config.isImplemented);
}
