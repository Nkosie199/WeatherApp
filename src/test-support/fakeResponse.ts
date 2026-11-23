// jsdom has no fetch Response, so tests answer fetch with the parts the app reads.
export function fakeResponse(body: string, status = 200, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers[name] ?? null },
    text: async () => body,
    json: async () => JSON.parse(body),
  } as unknown as Response
}
