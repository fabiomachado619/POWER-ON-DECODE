import type { ToolConfig } from "@/tools/types";

export const __CAMELNAME__Config: ToolConfig = {
  slug: "__SLUG__",
  name: "__NAME__",
  category: "__CATEGORY__" as ToolConfig["category"],
  manufacturer: "__MANUFACTURER__",
  type: "__TYPE__",
  ecuName: "__NAME__",
  routePath: "/tools/__SLUG__",
  apiPath: "/api/tools/__SLUG__/process",
  purchaseUrl: "https://exemplo.com/comprar/__SLUG__",
  isImplemented: false,
  technicalVersion: "0.1.0",
  moduleSlug: "__MODULESLUG__",
  acceptedExtensions: [".bin"],
};
