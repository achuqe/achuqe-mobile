import { getApiBaseUrl } from "@/constants/oauth";

export function resolveAssetUrl(uri: string) {
  if (!uri.startsWith("/")) return uri;
  return `${getApiBaseUrl().replace(/\/$/, "")}${uri}`;
}
