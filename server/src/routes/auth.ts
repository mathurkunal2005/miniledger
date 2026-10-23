import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { ConsoleSmsSender, type SmsSender } from "../sms";

// Indian mobile: 10 digits, starting with 6-9
export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export async function authRoutes(app: FastifyInstance) {
  // Swap this for a real provider (e.g. MSG91, Twilio) to send real SMS
  const sms: SmsSender = new ConsoleSmsSender(app.log);

  // Step 1 of login: generate an OTP and send it
  app.post("/auth/send-otp", async (request, reply) => {
    const parsed = z.object({ phone: phoneSchema }).safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0].message });
    }
    const { phone } = parsed.data;

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.otp.create({
      data: { phone, code, expiresAt: new Date(Date.now() + OTP_EXPIRY_MS) },
    });

    await sms.sendOtp(phone, code);
    return { message: "OTP sent" };
  });

  // Step 2 of login: check the OTP, then give back a JWT token
  app.post("/auth/verify-otp", async (request, reply) => {
    const parsed = z
      .object({ phone: phoneSchema, code: z.string().length(6) })
      .safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0].message });
    }
    const { phone, code } = parsed.data;

    const otp = await prisma.otp.findFirst({
      where: { phone, code, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!otp) {
      return reply.code(401).send({ error: "Invalid or expired OTP" });
    }

    await prisma.otp.update({ where: { id: otp.id }, data: { used: true } });

    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    const token = app.jwt.sign({ userId: user.id }, { expiresIn: "7d" });
    return { token, user: { id: user.id, phone: user.phone } };
  });
}