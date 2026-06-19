import { prisma } from "@/lib/prisma";

export const DEFAULT_PWA_SETTINGS = {
  id: "default",
  appName: "Power On Decode",
  shortName: "Decode",
  description:
    "Ferramentas técnicas automotivas para decode, reset, odômetro e checksum.",
  themeColor: "#10B981",
  backgroundColor: "#F5F7FA",
  promptText:
    "Instale o Power On Decode no seu computador para acessar suas ferramentas com mais facilidade.",
  active: true,
} as const;

export async function getPwaSettings() {
  const settings = await prisma.pwaSettings.findUnique({
    where: { id: "default" },
  });

  if (settings) return settings;

  return {
    ...DEFAULT_PWA_SETTINGS,
    updatedAt: new Date(),
  };
}
