import { DisclaimerBanner } from "@/components/legal/disclaimer-banner";
import { PRICING_DISCLAIMER, LIABILITY_DISCLAIMER } from "@/lib/constants";
import { MessageCircle, Search, Handshake, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Search locally",
    description:
      "Enter your zip code and browse walkers on a list or map. See who's actually near your neighborhood — not across the county.",
  },
  {
    icon: MessageCircle,
    title: "Send a message",
    description:
      "Reach out through in-app messaging. Walkers' phone and email stay hidden until you've initiated contact.",
  },
  {
    icon: Handshake,
    title: "Take it offline",
    description:
      "Schedule walks, agree on rates, and pay directly — Zelle, Venmo, cash, whatever works for both of you.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <div className="hero-band border-b border-sand-200/50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="section-label">How it works</p>
          <h1 className="headline-lg mt-3">How PawPath works</h1>
          <p className="body-lg mt-4 max-w-2xl">
            We&apos;re a connection platform — not a booking service. Here&apos;s
            the full flow, with no hidden steps.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={step.title} className="surface-card flex gap-5 p-6 sm:p-7">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-trail-100 text-trail-700 transition-colors group-hover:bg-trail-700">
                <step.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="section-label">Step {i + 1}</p>
                <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-trail-950">
                  {step.title}
                </h2>
                <p className="mt-2 leading-relaxed text-sand-600">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="surface-card mt-10 p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold text-trail-950">
            What PawPath does NOT do
          </h2>
          <ul className="mt-5 space-y-3 text-sand-700">
            {[
              "Process payments or take a percentage of walks",
              "Provide insurance or guarantee services",
              "Employ or manage walkers",
              "Mediate disputes between owners and walkers",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-trail-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 space-y-4">
          <DisclaimerBanner>{PRICING_DISCLAIMER}</DisclaimerBanner>
          <DisclaimerBanner>{LIABILITY_DISCLAIMER}</DisclaimerBanner>
        </div>
      </div>
    </>
  );
}
