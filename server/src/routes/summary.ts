import type { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { calculateSummary } from "../summary";

export async function summaryRoutes(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: "Please log in" });
    }
  });

  app.get("/summary", async (request) => {
    const loans = await prisma.loan.findMany({
      where: { userId: request.user.userId },
      select: { amountPaise: true, dueDate: true, repaidAt: true },
    });
    return calculateSummary(loans);
  });
}
