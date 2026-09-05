export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly errors: unknown[];

  constructor(code: string, message: string, statusCode = 500, errors: unknown[] = []) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
