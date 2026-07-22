import { InquiryForm } from "@/components/marketing/admissions/inquiry-form";

/**
 * Contact page form — the same inquiry seam as Admissions (`useSubmitInquiry`), re-skinned with
 * contact-appropriate copy. No new fields or validation: one inquiry contract, two entry points.
 */
export function ContactForm() {
  return (
    <InquiryForm
      submitLabel="Send message"
      successHeading="Message sent — we'll be in touch."
      successBody="Thanks for reaching out. A member of our team will reply within two working days."
      className="reveal d1"
    />
  );
}
