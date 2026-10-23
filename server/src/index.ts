import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { authRoutes } from "./routes/auth";
import { loanRoutes } from "./routes/loans";
import { summaryRoutes } from "./routes/summary";

process.loadEnvFile(); // reads .env into process.env

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET is missing in .env");

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(jwt, { secret });

app.get("/health", async () => ({ ok: true }));
await app.register(authRoutes);
await app.register(loanRoutes);
await app.register(summaryRoutes);

app.listen({ port: 3000, host: "0.0.0.0" });
