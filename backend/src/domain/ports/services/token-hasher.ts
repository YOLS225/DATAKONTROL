export const TOKEN_HASHER = Symbol("TOKEN_HASHER");

export interface TokenHasher {
  hash(token: string): string;
  match(token: string, tokenHash: string): boolean;
}
