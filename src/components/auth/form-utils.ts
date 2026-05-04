export const GENERIC_LOGIN_ERROR =
  "Unable to log in with that username and password.";

export type ApiErrorBody = {
  error?: string;
};

export async function readApiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return body.error?.trim() || "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

export function fieldId(name: string): string {
  return `${name}-field`;
}

export function errorId(name: string): string {
  return `${name}-error`;
}
