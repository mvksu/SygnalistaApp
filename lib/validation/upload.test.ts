import { describe, expect, it } from "vitest"
import { isAllowedMimeType, getFileSizeLimit, ALLOWED_MIME_TYPES } from "./upload"

describe("upload validation", () => {
  it("allows known mime types", () => {
    for (const t of ALLOWED_MIME_TYPES as unknown as string[]) {
      expect(isAllowedMimeType(t)).toBe(true)
    }
  })

  it("returns a size limit for known types and default for unknown", () => {
    expect(getFileSizeLimit("image/png")).toBeGreaterThan(0)
    expect(getFileSizeLimit("application/unknown")).toBe(10 * 1024 * 1024)
  })
})


