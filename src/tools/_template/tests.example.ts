export async function run__PASCALNAME__Tests() {
  const original = Buffer.alloc(1024, 0xff);
  const { validate__PASCALNAME__ } = await import("./validator");
  const { process__PASCALNAME__ } = await import("./processor");

  const validation = validate__PASCALNAME__({
    originalFilename: "sample.bin",
    fileBuffer: original,
  });

  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  const result = process__PASCALNAME__({
    originalFilename: "sample.bin",
    fileBuffer: original,
  });

  if (!result.success || !result.buffer) {
    throw new Error(result.errors?.join(" ") ?? "Falha no processamento.");
  }

  if (result.buffer.length !== original.length) {
    throw new Error("Tamanho final diferente do original.");
  }
}
