import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { prisma } from "../db";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
await mkdir(UPLOAD_DIR, { recursive: true });

// Only these image types are accepted, mapped to the file extension we save with
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function receiptRoutes(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: "Please log in" });
    }
  });

  app.post("/loans/:id/receipt", async (request, reply) => {
    const { id } = request.params as { id: string };

    // Make sure the loan exists AND belongs to this user
    const loan = await prisma.loan.findFirst({
      where: { id, userId: request.user.userId },
    });
    if (!loan) {
      return reply.code(404).send({ error: "Loan not found" });
    }

    const file = await request.file();
    if (!file) {
      return reply.code(400).send({ error: "No image uploaded" });
    }

    const ext = ALLOWED_TYPES[file.mimetype];
    if (!ext) {
      file.file.resume(); // throw away the incoming data
      return reply.code(400).send({ error: "Only JPG, PNG or WEBP images are allowed" });
    }

    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    try {
      await pipeline(file.file, createWriteStream(filepath));
    } catch {
      await unlink(filepath).catch(() => {});
      return reply.code(413).send({ error: "Image must be under 5 MB" });
    }

    const updated = await prisma.loan.update({
      where: { id: loan.id },
      data: { receiptUrl: `/uploads/${filename}` },
    });
    return updated;
  });
}