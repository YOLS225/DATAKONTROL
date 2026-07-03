import { Injectable } from "@nestjs/common";
import { compare, hash } from "bcrypt";
import { PasswordHasher } from "../../domain/ports/services/password-hasher.js";

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  private static readonly SALT_ROUNDS = 12;

  hash(password: string): Promise<string> {
    return hash(password, BcryptPasswordHasher.SALT_ROUNDS);
  }

  match(password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword);
  }
}
