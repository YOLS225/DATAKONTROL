import { describe, expect, it } from "@jest/globals";
import { Sha256TokenHasher } from "../src/infrastructure/security/sha256-token-hasher.js";

describe("Sha256TokenHasher", () => {
  it("matches only the complete original token", () => {
    const hasher = new Sha256TokenHasher();
    const sharedPrefix = "x".repeat(100);
    const token = `${sharedPrefix}-first-token`;
    const hash = hasher.hash(token);

    expect(hasher.match(token, hash)).toBe(true);
    expect(hasher.match(`${sharedPrefix}-second-token`, hash)).toBe(false);
  });
});
