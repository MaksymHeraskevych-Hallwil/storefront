import { cookies } from "next/headers";

// Сервер (Server Components) б'є в бекенд напряму, в обхід nginx —
// швидше й простіше, ніж ганяти запит через проксі самого себе.
// Але це вже НЕ той самий запит, що прийшов від браузера, тож куку
// (а разом з нею — сесію користувача) треба передати вручну.
const INTERNAL_API_URL = process.env.BACKEND_INTERNAL_URL ?? "http://backend:5051";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export async function serverFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();

  const res = await fetch(`${INTERNAL_API_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      cookie: cookieStore.toString(),
    },
    // Адмінка авторизована й завжди динамічна — кешувати тут нічого:
    // список товарів чи його деталі мають бути свіжими щоразу.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `Запит не вдався (${res.status})`);
  }

  return res.json();
}
