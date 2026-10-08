import { vi } from "vitest";

const toastMock = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: toastMock }));

import { ApiError, apiFetch } from "./http";

const respuesta = (status: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status });

describe("apiFetch", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envía la cookie de sesión y el cuerpo como JSON, y devuelve el JSON", async () => {
    fetchMock.mockResolvedValue(respuesta(200, { ok: true }));

    await expect(
      apiFetch("/reports/x", { method: "POST", body: { a: 1 } }),
    ).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/reports/x");
    expect(init).toMatchObject({
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: '{"a":1}',
    });
  });

  it("devuelve undefined en 204", async () => {
    fetchMock.mockResolvedValue(respuesta(204));
    await expect(apiFetch("/report-configs/1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("lanza ApiError con el mensaje del backend", async () => {
    fetchMock.mockResolvedValue(respuesta(400, { message: "Tenant inválido" }));

    const error = await apiFetch("/auth/login-token").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, message: "Tenant inválido" });
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it("avisa de sesión expirada en un 401", async () => {
    // jsdom no implementa location.reload y lo reporta por consola.
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(respuesta(401, { message: "Token inválido" }));

    await expect(apiFetch("/tenant/features")).rejects.toMatchObject({ status: 401 });
    expect(toastMock.error).toHaveBeenCalledWith(
      "Sesión expirada. Por favor, inicia sesión nuevamente.",
    );
  });

  it("no trata el 401 como sesión expirada cuando se desactiva (llamadas de auth)", async () => {
    fetchMock.mockResolvedValue(respuesta(401, { message: "Token inválido" }));

    await expect(
      apiFetch("/auth/me", {}, { manejarSesionExpirada: false }),
    ).rejects.toMatchObject({ status: 401 });
    expect(toastMock.error).not.toHaveBeenCalled();
  });
});
