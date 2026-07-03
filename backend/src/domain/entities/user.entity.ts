export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly passwordHash: string,
    public readonly createdAt: Date = new Date(),
    public readonly refreshTokenHash: string | null = null,
  ) {}
}
