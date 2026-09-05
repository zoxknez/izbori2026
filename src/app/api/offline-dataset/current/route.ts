import { GET as getVersion } from "../[version]/route";

export async function GET(request: Request) {
  return getVersion(request, { params: Promise.resolve({ version: "current" }) });
}
