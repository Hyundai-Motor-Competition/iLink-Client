// 서버 오류 본문: { error: { code, message, retryAfterSeconds } }
export type ServerErrorBody = {
  error?: {
    code?: string;
    message?: string;
    retryAfterSeconds?: number | null;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterSeconds: number | null;

  constructor(status: number, body: ServerErrorBody | null) {
    super(body?.error?.message ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code =
      body?.error?.code ?? (status === 0 ? 'NETWORK' : `HTTP_${status}`);
    this.retryAfterSeconds = body?.error?.retryAfterSeconds ?? null;
  }

  /** 409: 최신 세션을 다시 불러온 뒤 판단해야 하는 경우 */
  get isConflict() {
    return this.status === 409;
  }

  get isNetwork() {
    return this.status === 0;
  }
}
