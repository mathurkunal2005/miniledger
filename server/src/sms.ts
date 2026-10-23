import type { FastifyBaseLogger } from "fastify";

// Anything that can send an OTP. Swap the implementation, keep the login code the same.
export interface SmsSender {
  sendOtp(phone: string, code: string): Promise<void>;
}

// Mock sender: prints the OTP to the server log (as the assignment asks)
export class ConsoleSmsSender implements SmsSender {
  constructor(private log: FastifyBaseLogger) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    this.log.info(`OTP for ${phone}: ${code}`);
  }
}

// A real one would look like this:
// export class Msg91SmsSender implements SmsSender {
//   async sendOtp(phone: string, code: string) {
//     await fetch("https://api.msg91.com/...", { ... });
//   }
// }
