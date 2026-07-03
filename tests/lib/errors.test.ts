import { describe, it, expect } from "vitest";
import { getErrorMessage, hasErrorCode } from "@/lib/errors";

describe("Errors Utils", () => {
  describe("getErrorMessage", () => {
    it("should return message if error is an instance of Error", () => {
      const error = new Error("test error");
      expect(getErrorMessage(error)).toBe("test error");
    });

    it("should return fallback if error is not an Error instance", () => {
      expect(getErrorMessage("just a string")).toBe("Unknown error");
      expect(getErrorMessage(null)).toBe("Unknown error");
      expect(getErrorMessage(undefined)).toBe("Unknown error");
    });

    it("should return custom fallback", () => {
      expect(getErrorMessage(123, "Custom fallback")).toBe("Custom fallback");
    });
  });

  describe("hasErrorCode", () => {
    it("should return true if error has the specified code", () => {
      const error = { code: "23505" };
      expect(hasErrorCode(error, "23505")).toBe(true);
    });

    it("should return false if error does not have the specified code", () => {
      const error = { code: "123" };
      expect(hasErrorCode(error, "23505")).toBe(false);
    });

    it("should return false if error is null or undefined", () => {
      expect(hasErrorCode(null, "23505")).toBe(false);
      expect(hasErrorCode(undefined, "23505")).toBe(false);
    });

    it("should return false if error is primitive", () => {
      expect(hasErrorCode("23505", "23505")).toBe(false);
    });
  });
});
