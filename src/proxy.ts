export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    "/squads/:path*",
    "/splits/:path*",
    "/evidence/:path*",
    "/payouts/:path*",
    "/ledger/:path*",
    "/statements/:path*",
    "/runs/:path*",
  ],
};
