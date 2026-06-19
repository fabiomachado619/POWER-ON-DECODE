import { NextRequest } from "next/server";
import { createToolProcessHandler } from "@/lib/toolEngine";
import { ssangyongRexton25c320DecodeTool } from "./index";

export const POST = (request: NextRequest) =>
  createToolProcessHandler(ssangyongRexton25c320DecodeTool)(request);
