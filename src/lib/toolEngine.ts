import { NextRequest, NextResponse } from "next/server";
import { AccessDeniedError, requireModuleAccess } from "@/lib/accessControl";
import { getSessionFromRequest } from "@/lib/auth";
import {
  buildDecodedFilename,
  readRequestFileToBuffer,
} from "@/lib/binaryFile";
import { prisma } from "@/lib/prisma";
import type { RegisteredTool } from "@/tools/types";
import type { SessionUser } from "@/types";

export interface ToolProcessRequest {
  userId: string;
  originalFilename: string;
  fileBuffer: Buffer;
  backupAccepted: boolean;
  responsibilityAccepted: boolean;
}

export async function executeToolProcess(
  tool: RegisteredTool,
  request: ToolProcessRequest
) {
  if (!tool.config.isImplemented) {
    return {
      ok: false as const,
      status: 503,
      body: { error: "Ferramenta ainda não implementada tecnicamente." },
    };
  }

  if (!request.backupAccepted || !request.responsibilityAccepted) {
    return {
      ok: false as const,
      status: 400,
      body: {
        error:
          "É obrigatório aceitar o backup do arquivo original e o termo de responsabilidade.",
      },
    };
  }

  const validation = tool.validate({
    originalFilename: request.originalFilename,
    fileBuffer: request.fileBuffer,
  });

  if (!validation.valid) {
    await createToolLog(tool, request, {
      status: "error",
      errorMessage: validation.errors.join(" "),
      offsetApplied: "",
    });

    return {
      ok: false as const,
      status: 400,
      body: { error: "Falha na validação do arquivo.", details: validation.errors },
    };
  }

  const result = tool.process({
    originalFilename: request.originalFilename,
    fileBuffer: request.fileBuffer,
  });

  if (!result.success || !result.buffer) {
    await createToolLog(tool, request, {
      status: "error",
      errorMessage: result.errors?.join(" ") ?? "Erro desconhecido.",
      offsetApplied: result.offsetApplied ?? "",
    });

    return {
      ok: false as const,
      status: 400,
      body: { error: "Falha no processamento.", details: result.errors },
    };
  }

  await createToolLog(tool, request, {
    status: "success",
    offsetApplied: result.offsetApplied ?? "",
  });

  const downloadName = buildDecodedFilename(request.originalFilename);

  return {
    ok: true as const,
    buffer: result.buffer,
    downloadName,
  };
}

async function createToolLog(
  tool: RegisteredTool,
  request: ToolProcessRequest,
  data: { status: string; errorMessage?: string; offsetApplied: string }
) {
  let procedureId: string | null = null;

  if (tool.config.decodeProcedureSlug) {
    const procedure = await prisma.decodeProcedure.findFirst({
      where: {
        slug: tool.config.decodeProcedureSlug,
        module: { slug: tool.config.moduleSlug },
      },
      select: { id: true },
    });
    procedureId = procedure?.id ?? null;
  }

  await prisma.decodeLog.create({
    data: {
      userId: request.userId,
      procedureId,
      toolSlug: tool.config.slug,
      technicalVersion: tool.config.technicalVersion,
      category: tool.config.category,
      originalFilename: request.originalFilename,
      fileSize: request.fileBuffer.length,
      offsetApplied: data.offsetApplied,
      status: data.status,
      errorMessage: data.errorMessage,
    },
  });
}

export function createToolProcessHandler(tool: RegisteredTool) {
  return async function handleToolProcess(request: NextRequest) {
    const user = await getSessionFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    try {
      await requireModuleAccess(user, tool.config.moduleSlug);
    } catch (error) {
      if (error instanceof AccessDeniedError) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      throw error;
    }

    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const backupAccepted = formData.get("backupAccepted") === "true";
      const responsibilityAccepted =
        formData.get("responsibilityAccepted") === "true";
      const originalFilename = file?.name ?? "arquivo.bin";
      const fileBuffer = await readRequestFileToBuffer(file);

      const outcome = await executeToolProcess(tool, {
        userId: user.id,
        originalFilename,
        fileBuffer,
        backupAccepted,
        responsibilityAccepted,
      });

      if (!outcome.ok) {
        return NextResponse.json(outcome.body, { status: outcome.status });
      }

      return new NextResponse(new Uint8Array(outcome.buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${outcome.downloadName}"`,
          "X-Decode-Status": "success",
          "X-Original-Filename": originalFilename,
          "X-Download-Filename": outcome.downloadName,
          "X-Tool-Slug": tool.config.slug,
          "X-Technical-Version": tool.config.technicalVersion,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro interno no processamento.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

export async function assertToolAccess(
  user: SessionUser,
  tool: RegisteredTool
): Promise<{ allowed: boolean; reason?: string }> {
  if (!tool.config.isImplemented) {
    return { allowed: false, reason: "Ferramenta ainda não implementada." };
  }

  try {
    await requireModuleAccess(user, tool.config.moduleSlug);
    return { allowed: true };
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return { allowed: false, reason: error.message };
    }
    throw error;
  }
}
