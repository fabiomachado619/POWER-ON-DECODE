import { NextRequest } from "next/server";
import { getRegisteredTool } from "@/tools/registry";

interface RouteParams {
  params: { slug: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const tool = getRegisteredTool(params.slug);

  if (!tool) {
    return Response.json(
      { error: "Ferramenta não encontrada no registry." },
      { status: 404 }
    );
  }

  const { createToolProcessHandler } = await import("@/lib/toolEngine");
  return createToolProcessHandler(tool)(request);
}
