export class NotFoundError extends Error {
  constructor(entity: string, key?: string) {
    super(
      key
        ? `${entity} avec la clé "${key}" est introuvable`
        : `${entity} est introuvable`,
    );

    this.name = NotFoundError.name;
  }
}
