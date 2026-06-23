/**
 * Typed application errors. Routes/services throw these; the error middleware
 * (see error-middleware.ts) maps them to the uniform API error envelope.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly issues?: unknown[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (msg: string, issues?: unknown[]) =>
  new AppError(400, 'bad_request', msg, issues);

export const unauthorized = (msg = 'Authentication required') =>
  new AppError(401, 'unauthorized', msg);

export const forbidden = (msg = 'You do not have access to this resource') =>
  new AppError(403, 'forbidden', msg);

export const notFound = (msg = 'Resource not found') =>
  new AppError(404, 'not_found', msg);

export const conflict = (msg: string) => new AppError(409, 'conflict', msg);

export const payloadTooLarge = (msg: string) =>
  new AppError(413, 'payload_too_large', msg);

/**
 * For seams that are intentionally out of MVP scope. Stub, don't fake — expose
 * the interface and throw this. (§0.7)
 */
export class NotImplementedError extends AppError {
  constructor(feature: string) {
    super(501, 'not_implemented', `${feature} is not implemented in the MVP`);
    this.name = 'NotImplementedError';
  }
}
