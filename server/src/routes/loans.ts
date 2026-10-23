import type { FastifyInstance } from "fastify";
import type { Loan } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db";

const createLoanSchema = z.object({
  friendName: z.string().trim().min(1, "Friend name is required").max(100),
  amountPaise: z
    .number()
    .int("Amount must be in whole paise")
    .positive("Amount must be more than 0"),
  dueDate: z.coerce.date(),
});

const idParamSchema = z.object({ id: z.string().min(1) });

// Overdue is calculated, never stored
function withStatus(loan: Loan) {
  const isOverdue = loan.repaidAt === null && loan.dueDate < new Date();
  return { ...loan, isOverdue };
}

export async function loanRoutes(app: FastifyInstance) {
  // Guard: every route in this file needs a valid token
  app.addHook("onRequest", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: "Please log in" });
    }
  });

  // Add a loan
  app.post("/loans", async (request, reply) => {
    const parsed = createLoanSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0].message });
    }

    const loan = await prisma.loan.create({
      data: { ...parsed.data, userId: request.user.userId },
    });
    return reply.code(201).send(withStatus(loan));
  });

  // List my loans
  app.get("/loans", async (request) => {
    const loans = await prisma.loan.findMany({
      where: { userId: request.user.userId },
      orderBy: { dueDate: "asc" },
    });
    return loans.map(withStatus);
  });

  // Mark a loan as repaid
  app.patch("/loans/:id/repay", async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid loan id" });
    }

    const loan = await prisma.loan.findFirst({
      where: { id: parsed.data.id, userId: request.user.userId },
    });
    if (!loan) {
      return reply.code(404).send({ error: "Loan not found" });
    }
    if (loan.repaidAt) {
      return reply.code(409).send({ error: "Loan is already repaid" });
    }

    const updated = await prisma.loan.update({
      where: { id: loan.id },
      data: { repaidAt: new Date() },
    });
    return withStatus(updated);
  });
}
