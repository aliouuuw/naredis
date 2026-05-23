export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export function actionError<T = void>(message: string): ActionResult<T> {
  return { ok: false, error: message };
}

export function actionOk<T>(data?: T): ActionResult<T> {
  return { ok: true, data };
}
