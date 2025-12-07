"use client";

import {
  ArrowDownUp,
  BadgeCheck,
  Banknote,
  ClipboardCheck,
  FileText,
  Gavel,
  Info,
  Landmark,
  ScrollText,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TermItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

interface TermSection {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  iconColor: string;
  items: TermItem[];
}

const termSections: TermSection[] = [
  {
    icon: Users,
    title: "Membership Regulations",
    iconColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    items: [
      {
        icon: BadgeCheck,
        title: "Equal Member Rights",
        description: "All members hold equal status and value within the club.",
      },
      {
        icon: Wallet,
        title: "Monthly Contributions",
        description:
          "Each member must contribute ₹2,000 per month. During the first three years, the contribution was ₹1,000 per month. Contribution amounts may be revised based on club discussions.",
      },
      {
        icon: Banknote,
        title: "New Member Offset",
        description:
          "New members must pay a monthly deposit as per the prevailing rate, along with an offset amount equivalent to existing member's profits up to the date of their admission.",
      },
      {
        icon: Info,
        title: "No Partial Withdrawals",
        description:
          "Partial withdrawals are not allowed. Members intending to withdraw their funds must resign from the club entirely.",
      },
      {
        icon: UserCheck,
        title: "New Member Rules",
        description:
          "New members cannot join mid-cycle during any financial process or event.",
      },
      {
        icon: ClipboardCheck,
        title: "Late Fee Policy",
        description:
          "Late payments resulting in balances exceeding ₹15,000 will incur an offset fine.",
      },
    ],
  },
  {
    icon: Landmark,
    title: "Club Loan Policies",
    iconColor: "bg-green-500/10 text-green-600 dark:text-green-400",
    items: [
      {
        icon: TrendingUp,
        title: "Loan Limit",
        description:
          "The maximum loan amount for any member is ₹2,00,000, subject to revision based on the club's funds.",
      },
      {
        icon: Banknote,
        title: "Repayment Minimum",
        description:
          "Loan repayments must be in round figures, with a minimum repayment of ₹50,000.",
      },
      {
        icon: ArrowDownUp,
        title: "5-Month Repayment Window",
        description:
          "Loans must be fully repaid within 5 months. Further terms apply for repayment failures (TBD).",
      },
      {
        icon: Info,
        title: "No Top-Ups Allowed",
        description:
          "Loan top-ups are not allowed. A new loan may be applied for only after a one-month gap following full repayment.",
      },
      {
        icon: Wallet,
        title: "Daily Interest Calculation",
        description: "Interest on loans is calculated daily.",
      },
      {
        icon: ClipboardCheck,
        title: "Must Clear Previous Loans",
        description:
          "Members must clear all outstanding loans and balances before applying for a new loan.",
      },
      {
        icon: UserCheck,
        title: "Priority for First-Time Borrowers",
        description:
          "Loan approvals prioritize members who have not previously taken a loan or have minimal borrowing history.",
      },
    ],
  },
  {
    icon: Gavel,
    title: "General Provisions",
    iconColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    items: [
      {
        icon: FileText,
        title: "Amendments",
        description:
          "Terms and conditions are subject to amendment based on majority consensus among members.",
      },
    ],
  },
];

export default function TermsAndConditionsPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-24">
      {/* Breadcrumb */}
      <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard"
          className="hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-foreground">Terms & Conditions</span>
      </div>

      {/* Header Section */}
      <div className="text-center space-y-4 py-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <ScrollText className="h-12 w-12 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Terms & Conditions
          </h1>
          <p className="mt-2 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Clear guidelines for all members of the Peacock Club
          </p>
        </div>
      </div>

      {/* Desktop: Card Layout */}
      <div className="hidden lg:block space-y-6">
        {termSections.map((section, sectionIndex) => (
          <Card
            key={sectionIndex}
            className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`rounded-lg p-3 ${section.iconColor} transition-colors`}
                >
                  <section.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  {section.title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile: Accordion Layout */}
      <div className="lg:hidden space-y-4 px-4">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {termSections.map((section, sectionIndex) => (
            <AccordionItem
              key={sectionIndex}
              value={`section-${sectionIndex}`}
              className="border border-border/50 rounded-xl bg-card shadow-sm overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-4 hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`rounded-lg p-2.5 ${section.iconColor} transition-colors`}
                  >
                    <section.icon className="h-5 w-5" />
                  </div>
                  <span className="text-base font-semibold text-foreground text-left">
                    {section.title}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="space-y-3 mt-2">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
