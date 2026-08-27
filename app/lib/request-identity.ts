function firstHop(value: string | null): string | null {
  const hop = value?.split(",")[0]?.trim();
  return hop || null;
}

function lastHop(value: string | null): string | null {
  const hops = value?.split(",").map((part) => part.trim()).filter(Boolean) ?? [];
  return hops[hops.length - 1] || null;
}

export function requestIdentity(request: { headers: { get(name: string): string | null } }): string {
  const onVercel = Boolean(request.headers.get("x-vercel-id"));
  if (onVercel) {
    return (
      firstHop(request.headers.get("x-vercel-forwarded-for")) ||
      request.headers.get("x-real-ip")?.trim() ||
      firstHop(request.headers.get("x-forwarded-for")) ||
      "anonymous"
    );
  }

  return (
    lastHop(request.headers.get("x-forwarded-for")) ||
    request.headers.get("x-real-ip")?.trim() ||
    "anonymous"
  );
}
