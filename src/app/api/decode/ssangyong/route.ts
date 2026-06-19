import { NextRequest } from "next/server";
import { getRegisteredTool } from "@/tools/registry";

export async function POST(request: NextRequest) {
  const tool = getRegisteredTool("ssangyong-rexton-25c320-decode");

  if (!tool) {
    return Response.json(
      { error: "Ferramenta SsangYong não registrada." },
      { status: 500 }
    );
  }

  const { createToolProcessHandler } = await import("@/lib/toolEngine");
  return createToolProcessHandler(tool)(request);
}

export async function GET() {
  const { listSsangyongProcedures, SSANGYONG_MODULE_SLUG } = await import(
    "@/modules/ssangyong/procedures"
  );

  return Response.json({
    moduleSlug: SSANGYONG_MODULE_SLUG,
    procedures: listSsangyongProcedures().map((procedure) => ({
      slug: procedure.slug,
      name: procedure.name,
      ecuName: procedure.ecuName,
      eepromType: procedure.eepromType,
      expectedSize: procedure.expectedSize,
    })),
  });
}
