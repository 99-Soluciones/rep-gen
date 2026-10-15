import { act, renderHook } from "@testing-library/react";
import { usePreferenciaLocal } from "./usePreferenciaLocal";

describe("usePreferenciaLocal", () => {
  beforeEach(() => localStorage.clear());

  it("arranca en el predeterminado y recuerda el cambio", () => {
    const { result, unmount } = renderHook(() => usePreferenciaLocal("panel", true));
    expect(result.current[0]).toBe(true);
    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);
    unmount();

    const otra = renderHook(() => usePreferenciaLocal("panel", true));
    expect(otra.result.current[0]).toBe(false);
  });
});
