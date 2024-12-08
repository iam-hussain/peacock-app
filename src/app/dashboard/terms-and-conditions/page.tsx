"use client";

import Box from "@/components/ui/box";
import { Separator } from "@/components/ui/separator";

export default function Login() {
  return (
    <Box preset={"stack-start"} className="md:px-4 py-10 bg-background">
      <div className="mx-auto p-6 md:p-8 text-base flex flex-col gap-8">
        <h1 className="md:text-3xl text-2xl font-bold text-center mb-4 text-foreground">
          Terms and Conditions
        </h1>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4 text-center md:text-left">
            Membership Regulations
          </h2>
          <ul className="list-disc list-inside text-foreground space-y-2 text-md">
            <li>All members hold equal status and value within the club.</li>
            <li>
              New members must pay a monthly deposit as per the prevailing rate,
              along with an offset amount equivalent to existing member&apos;s
              profits up to the date of their admission.
            </li>
            <li>
              Partial withdrawals are not allowed. Members intending to withdraw
              their funds must resign from the club entirely.
            </li>
            <li>
              Each member must contribute ₹2,000 per month. During the first
              three years, the contribution was ₹1,000 per month. Contribution
              amounts may be revised based on club discussions.
            </li>
            <li>
              New members cannot join mid-cycle during any financial process or
              event.
            </li>
            <li>
              Late payments resulting in balances exceeding ₹15,000 will incur
              an offset fine.
            </li>
          </ul>
        </section>

        <Separator />

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4 text-center md:text-left">
            Club Loan Policies
          </h2>
          <ul className="list-disc list-inside text-foreground space-y-2">
            <li>
              The maximum loan amount for any member is ₹2,00,000, subject to
              revision based on the club&apos;s funds.
            </li>
            <li>
              Loan repayments must be in round figures, with a minimum repayment
              of ₹50,000.
            </li>
            <li>
              Loans must be fully repaid within 5 months. Further terms apply
              for repayment failures (TBD).
            </li>
            <li>
              Loan top-ups are not allowed. A new loan may be applied for only
              after a one-month gap following full repayment.
            </li>
            <li>Interest on loans is calculated daily.</li>
            <li>
              Members must clear all outstanding loans and balances before
              applying for a new loan.
            </li>
            <li>
              Loan approvals prioritize members who have not previously taken a
              loan or have minimal borrowing history.
            </li>
          </ul>
        </section>
        <Separator />

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4 text-center md:text-left">
            General Provisions
          </h2>
          <ul className="list-disc list-inside text-foreground space-y-2">
            <li>
              Terms and conditions are subject to amendment based on majority
              consensus among members.
            </li>
            {/* <li>
              Violations of these terms may result in penalties or membership
              revocation.
            </li>
            <li>
              Members should stay updated with club announcements regarding
              policy changes.
            </li> */}
          </ul>
        </section>
      </div>
    </Box>
  );
}
