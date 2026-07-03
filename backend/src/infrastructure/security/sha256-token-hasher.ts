import { createHash, timingSafeEqual } from "node:crypto";
import { TokenHasher } from "../../domain/ports/services/token-hasher.js";

export class Sha256TokenHasher implements TokenHasher {
  hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  match(token: string, tokenHash: string): boolean {
    const actual = Buffer.from(this.hash(token), "hex");
    const expected = Buffer.from(tokenHash, "hex");
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }
}
