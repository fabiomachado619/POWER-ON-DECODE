import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const MAX_SIZE = 2 * 1024 * 1024;

export async function saveToolCoverImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Formato inválido. Use JPG, PNG ou WEBP.");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("Imagem excede o tamanho máximo de 2MB.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "tools");

  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/tools/${filename}`;
}

export async function saveManufacturerLogo(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Formato inválido. Use JPG, PNG ou WEBP.");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("Imagem excede o tamanho máximo de 2MB.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "manufacturers");

  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/manufacturers/${filename}`;
}
