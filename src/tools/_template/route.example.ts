import { NextRequest } from "next/server";
import { createToolProcessHandler } from "@/lib/toolEngine";
import { __CAMELNAME__Tool } from "./index";

export const POST = (request: NextRequest) =>
  createToolProcessHandler(__CAMELNAME__Tool)(request);
