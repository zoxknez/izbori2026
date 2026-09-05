import { auth } from "../auth";

export const proxy = auth((request) => {
  if (request.nextUrl.pathname.startsWith("/admin") && request.nextUrl.pathname !== "/admin/login" && !request.auth) {
    return Response.redirect(new URL("/admin/login", request.url));
  }
});

export default proxy;
export const config = { matcher: ["/admin/:path*"] };
