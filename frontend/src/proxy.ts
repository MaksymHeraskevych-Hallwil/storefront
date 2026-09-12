import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16: те, що раніше звалось Middleware, тепер Proxy —
// сама механіка не змінилась.
//
// Це навмисно ОПТИМІСТИЧНА перевірка: дивимось лише на наявність куки
// "token", не на її валідність (Proxy не мав би робити повільні речі
// на кшталт запиту до бекенду на кожен рендер). Прострочений чи
// підроблений токен однаково відхилить requireAuth на бекенді —
// сторінка отримає 401 і сама поведе на /login.
const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("token");
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!hasSession && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
