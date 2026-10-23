import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { authRoutes } from "./routes/auth";
import { loanRoutes } from "./routes/loans";
import { summaryRoutes } from "./routes/summary";
import { receiptRoutes, UPLOAD_DIR } from "./routes/receipts";

process.loadEnvFile(); // reads .env into process.env

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET is missing in .env");

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(jwt, { secret });
await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
await app.register(fastifyStatic, { root: UPLOAD_DIR, prefix: "/uploads/" });

app.get("/health", async () => ({ ok: true }));
await app.register(authRoutes);
await app.register(loanRoutes);
await app.register(summaryRoutes);
await app.register(receiptRoutes);

app.listen({ port: 3000, host: "0.0.0.0" });