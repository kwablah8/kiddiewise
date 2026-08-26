import { describe, expect, it } from "vitest";
import {
  canTransitionInquiry,
  nextInquiryStatuses,
  inquiryActionsFor,
  splitApplicantName,
  matchClassByName,
  inquiryToStudentPrefill,
} from "@/lib/inquiries";
import type { InquiryVM } from "@/lib/validators/inquiries";
import type { ClassOptionVM } from "@/lib/validators/people";

describe("inquiry transitions", () => {
  it("allows review/accept/reject from new", () => {
    expect(canTransitionInquiry("new", "reviewing")).toBe(true);
    expect(canTransitionInquiry("new", "accepted")).toBe(true);
    expect(canTransitionInquiry("new", "rejected")).toBe(true);
  });
  it("only allows convert or reject from accepted", () => {
    expect(nextInquiryStatuses("accepted")).toEqual(["converted", "rejected"]);
  });
  it("treats only converted as terminal", () => {
    expect(nextInquiryStatuses("converted")).toEqual([]);
    expect(canTransitionInquiry("converted", "reviewing")).toBe(false);
  });
  it("lets a rejected application be reconsidered", () => {
    // Admissions decisions get reversed: a place frees up, a document arrives, or the wrong row was
    // rejected in a busy list. Without this the only way back was re-keying the whole application.
    expect(canTransitionInquiry("rejected", "accepted")).toBe(true);
    expect(canTransitionInquiry("rejected", "reviewing")).toBe(true);
    // Still not a shortcut into the student roster, that has to go through accepted.
    expect(canTransitionInquiry("rejected", "converted")).toBe(false);
  });
  it("forbids skipping straight from new to converted", () => {
    expect(canTransitionInquiry("new", "converted")).toBe(false);
  });
  it("labels the accepted-state actions", () => {
    expect(inquiryActionsFor("accepted")).toEqual([
      { status: "converted", label: "Convert to student", variant: "default" },
      { status: "rejected", label: "Reject", variant: "destructive" },
    ]);
  });
});

describe("splitApplicantName", () => {
  it("splits on the first space", () => {
    expect(splitApplicantName("Ama Owusu")).toEqual({ first_name: "Ama", last_name: "Owusu" });
  });
  it("keeps multi-word surnames together", () => {
    expect(splitApplicantName("Nana Kwame Mensah")).toEqual({
      first_name: "Nana",
      last_name: "Kwame Mensah",
    });
  });
  it("handles a single name", () => {
    expect(splitApplicantName("Kwame")).toEqual({ first_name: "Kwame", last_name: "" });
  });
});

const CLASS_OPTIONS: ClassOptionVM[] = [
  { id: "cls-1", name: "Basic 1", level: "Primary" },
  { id: "cls-4", name: "JHS 1", level: "JHS" },
];

describe("matchClassByName", () => {
  it("matches case- and space-insensitively", () => {
    expect(matchClassByName("basic 1", CLASS_OPTIONS)).toBe("cls-1");
    expect(matchClassByName("  JHS 1 ", CLASS_OPTIONS)).toBe("cls-4");
  });
  it("returns null for no match or empty input", () => {
    expect(matchClassByName("KG 2", CLASS_OPTIONS)).toBeNull();
    expect(matchClassByName(null, CLASS_OPTIONS)).toBeNull();
    expect(matchClassByName("   ", CLASS_OPTIONS)).toBeNull();
  });
});

describe("inquiryToStudentPrefill", () => {
  const inquiry: InquiryVM = {
    id: "inq-1",
    applicant_name: "Ama Owusu",
    parent_name: "Kofi Owusu",
    parent_email: "kofi@example.com",
    parent_phone: "+233 24 000 0000",
    desired_class: "Basic 1",
    message: "Looking to enroll for next term.",
    status: "accepted",
    created_at: "2026-07-20T09:00:00Z",
  };
  it("maps name + matched class into student defaults and surfaces parent contact", () => {
    const { prefill, parentNote } = inquiryToStudentPrefill(inquiry, CLASS_OPTIONS);
    expect(prefill).toEqual({ first_name: "Ama", last_name: "Owusu", class_id: "cls-1" });
    expect(parentNote).toEqual({
      name: "Kofi Owusu",
      email: "kofi@example.com",
      phone: "+233 24 000 0000",
    });
  });
  it("leaves class unassigned when desired_class has no match", () => {
    const { prefill } = inquiryToStudentPrefill(
      { ...inquiry, desired_class: "KG 2" },
      CLASS_OPTIONS,
    );
    expect(prefill.class_id).toBeNull();
  });
});
