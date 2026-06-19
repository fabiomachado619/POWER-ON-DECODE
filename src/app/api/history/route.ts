import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const logs = await prisma.decodeLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      procedure: {
        include: {
          module: true,
        },
      },
    },
  });

  return NextResponse.json({
    logs: logs.map((log) => ({
      id: log.id,
      originalFilename: log.originalFilename,
      fileSize: log.fileSize,
      offsetApplied: log.offsetApplied,
      status: log.status,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt.toISOString(),
      procedureName: log.procedure?.name ?? log.toolSlug ?? "Ferramenta",
      moduleName: log.procedure?.module?.name ?? log.category ?? "—",
    })),
  });
}
