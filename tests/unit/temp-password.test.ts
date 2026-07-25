import { describe, expect, it } from "vitest";
import {
  generateTempPassword,
  isTempPasswordExpired,
  tempPasswordExpiry,
  credentialsMessage,
  TEMP_PASSWORD_DAYS,
  TEMP_PASSWORD_COMBINATIONS,
} from "@/lib/temp-password";

describe("generateTempPassword", () => {
  it("produces the Word-5digits-Word shape", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateTempPassword()).toMatch(/^[A-Z][a-z]+-\d{5}-[A-Z][a-z]+$/);
    }
  });

  it("never uses characters that are misread when written down or dictated", () => {
    // 0/O and 1/l/I are the classic transcription failures, and these travel by handwriting.
    for (let i = 0; i < 100; i++) {
      const digits = generateTempPassword().split("-")[1]!;
      expect(digits).not.toMatch(/[01]/);
    }
  });

  it("never repeats the same word twice", () => {
    for (let i = 0; i < 100; i++) {
      const [first, , second] = generateTempPassword().split("-");
      expect(first).not.toBe(second);
    }
  });

  it("draws from a space large enough that two parents can't be issued the same password", () => {
    // Asserted against the space, not against a sample. An earlier version tried "300 draws produce
    // 300 unique values", which is a birthday-paradox coin flip — it flaked at ~2% and the flake was
    // the real signal: the space was only ~2 million. This assertion cannot flake and pins the
    // property that actually matters.
    expect(TEMP_PASSWORD_COMBINATIONS).toBeGreaterThan(50_000_000);
  });

  it("produces unique values over a school-year intake", () => {
    // With a ~74M space, the chance of a duplicate in 300 draws is ~0.06% — small enough to assert.
    const seen = new Set(Array.from({ length: 300 }, generateTempPassword));
    expect(seen.size).toBe(300);
  });

  it("satisfies the 8-character minimum the app enforces elsewhere", () => {
    // updatePasswordSchema requires >= 8; a temp password that couldn't be re-entered would be a trap.
    expect(generateTempPassword().length).toBeGreaterThanOrEqual(8);
  });
});

describe("isTempPasswordExpired", () => {
  const now = Date.parse("2026-07-25T12:00:00Z");

  it("is not expired before the deadline", () => {
    expect(isTempPasswordExpired("2026-07-26T12:00:00Z", now)).toBe(false);
  });

  it("is expired after the deadline", () => {
    expect(isTempPasswordExpired("2026-07-24T12:00:00Z", now)).toBe(true);
  });

  it("treats a missing deadline as NOT expired", () => {
    // Accounts predating this feature have no expiry; locking them out would be a regression.
    expect(isTempPasswordExpired(null, now)).toBe(false);
  });
});

describe("tempPasswordExpiry", () => {
  it("is TEMP_PASSWORD_DAYS ahead of the issue date", () => {
    const from = new Date("2026-07-25T12:00:00Z");
    const expiry = Date.parse(tempPasswordExpiry(from));
    const days = (expiry - from.getTime()) / 86_400_000;
    expect(Math.round(days)).toBe(TEMP_PASSWORD_DAYS);
  });

  it("produces a value the expiry check agrees is still valid", () => {
    expect(isTempPasswordExpired(tempPasswordExpiry(new Date()))).toBe(false);
  });
});

describe("credentialsMessage", () => {
  const message = credentialsMessage({
    schoolName: "Kiddiewise School Complex",
    personName: "Yaw Mensah",
    email: "yaw@example.com",
    tempPassword: "Cocoa-4172-River",
    loginUrl: "https://school.test/login",
  });

  it("carries everything the recipient needs to sign in", () => {
    expect(message).toContain("Yaw Mensah");
    expect(message).toContain("yaw@example.com");
    expect(message).toContain("Cocoa-4172-River");
    expect(message).toContain("https://school.test/login");
  });

  it("tells them they'll be asked to change it, and that it expires", () => {
    // Without this, a parent reasonably assumes the school's password is permanently theirs.
    expect(message.toLowerCase()).toContain("choose your own password");
    expect(message).toContain(`${TEMP_PASSWORD_DAYS} days`);
  });
});
