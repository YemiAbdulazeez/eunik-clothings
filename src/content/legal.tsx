import type { ReactNode } from "react";

export type LegalKind = "terms" | "privacy" | "ndpr" | "order" | "jobs";

type Section = { heading: string; body: ReactNode };

export type LegalDoc = {
  title: string;
  crumb: string;
  updated: string;
  intro: string;
  sections: Section[];
};

const HOUSE = "Eunik Impeccable Outfits";
const SHORT = "EUNIK";
const EMAIL = "info@eunikclothings.com";
const PHONE = "08167073585";
const ADDRESS = "Ibadan, Oyo State, Nigeria";

function P({ children }: { children: ReactNode }) {
  return <p className="mb-4 text-[16px] leading-7 text-muted">{children}</p>;
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="mb-4 list-disc space-y-2 pl-5 text-[16px] leading-7 text-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export const LEGAL_DOCS: Record<LegalKind, LegalDoc> = {
  terms: {
    title: "Terms & Conditions",
    crumb: "Legal",
    updated: "23 August 2026",
    intro: `These Terms & Conditions (“Terms”) govern your access to and use of the ${SHORT} website, client book, studio tools, and any purchase, quotation, fitting, or custom work with ${HOUSE} (“we”, “us”, “our”). By browsing, creating an account, placing an order (including as a guest), requesting a quote, or continuing checkout, you agree to these Terms, our Order Policy, Job Taking Policy, Privacy Policy, and NDPR notice.`,
    sections: [
      {
        heading: "1. Who we are",
        body: (
          <>
            <P>
              {HOUSE} is a fashion house based in {ADDRESS}. We design and sell ready-to-wear and made-to-measure
              garments, host fittings and appointments, and publish editorial content. Contact:{" "}
              <a className="text-ink underline" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>{" "}
              · {PHONE}.
            </P>
            <P>
              References to “you” include registered clients, guests who check out without a prior account, and
              visitors who submit forms or leads.
            </P>
          </>
        ),
      },
      {
        heading: "2. Eligibility and accounts",
        body: (
          <>
            <P>
              You must be at least 18 years old (or the age of majority in your place of residence) to place a paid
              order. Guest checkout may open a client book using the email you provide; temporary credentials may be
              emailed so you can track orders and change your password. You are responsible for keeping login details
              confidential and for activity under your account.
            </P>
            <Ul
              items={[
                "Provide accurate name, email, phone, and delivery details.",
                "Do not share studio or client credentials with unauthorised persons.",
                "Tell us promptly if you suspect unauthorised use of your account.",
              ]}
            />
          </>
        ),
      },
      {
        heading: "3. Orders, order numbers, and contract formation",
        body: (
          <>
            <P>
              Every paid or pending order receives a unique order number (for example ORD-000123), whether you are a
              registered client or a guest. Displaying items online is an invitation to treat, not a binding offer.
              A contract forms when we accept your order (typically after successful Paystack payment, approved bank
              transfer, or written confirmation from the house).
            </P>
            <P>
              We may refuse or cancel an order for stock issues, pricing errors, suspected fraud, incomplete
              measurements, or failure to meet deposit requirements. If we cancel after you paid, we will refund the
              amount paid by the original method where practicable, less non-recoverable payment fees where permitted
              by law.
            </P>
          </>
        ),
      },
      {
        heading: "4. Pricing, currency, and taxes",
        body: (
          <>
            <P>
              Prices are shown in Nigerian Naira (₦) unless stated otherwise. Ready-to-wear prices include the
              catalogue amount displayed at checkout. Made-to-measure and bespoke work may require deposits,
              balances, and revised quotes after fitting. Coupons apply only while active and may exclude certain
              categories. Shipping, rush fees, alterations after approval, and third-party courier charges may be
              extra.
            </P>
            <P>
              We reserve the right to correct obvious pricing or description errors. If the corrected price is higher,
              we will ask you to confirm before proceeding; if lower, we may charge the lower amount.
            </P>
          </>
        ),
      },
      {
        heading: "5. Payment",
        body: (
          <>
            <P>
              Accepted methods include Paystack (cards and supported channels) and bank transfer to the account we
              publish in settings or checkout. For made-to-measure, a deposit (often a stated percentage of the
              merchandise total) is due to start production; the balance is due before collection or dispatch unless
              we agree otherwise in writing.
            </P>
            <Ul
              items={[
                "Bank transfers must include your order number as the narration where possible.",
                "Upload or send a clear receipt when paying by transfer; verification may take business hours.",
                "Chargebacks or false dispute claims may result in account suspension and recovery action.",
              ]}
            />
          </>
        ),
      },
      {
        heading: "6. Ready-to-wear, stock, and sizing",
        body: (
          <>
            <P>
              Ready-to-wear availability depends on size stock at the time of payment confirmation. Size charts and
              product photos are guides; slight dye, weave, and finish variations are normal in fashion production.
              Try-on and exchange rules follow our Order Policy.
            </P>
          </>
        ),
      },
      {
        heading: "7. Made-to-measure, bespoke, and fittings",
        body: (
          <>
            <P>
              Custom work depends on accurate measurements, fabric availability, and agreed timelines. Approving a
              quote, mood board, or fitting means you accept the design direction for production. Changes after
              cut/sew may incur fees or delay. Job acceptance and scheduling are also governed by our Job Taking
              Policy.
            </P>
            <Ul
              items={[
                "Missed fittings without notice may be rescheduled subject to studio capacity.",
                "Client-supplied fabrics or trims are accepted at your risk of suitability and quantity.",
                "Rush jobs are only binding when confirmed in writing with any rush fee paid.",
              ]}
            />
          </>
        ),
      },
      {
        heading: "8. Delivery, pickup, and risk",
        body: (
          <>
            <P>
              Pickup is available at our Ibadan location during published hours. Delivery within Nigeria uses
              couriers we select or that you approve. Title and risk pass on pickup hand-over or when the parcel is
              handed to the courier, except where consumer law requires otherwise. Provide a reachable phone number;
              failed deliveries due to unreachable recipients may incur re-dispatch fees.
            </P>
          </>
        ),
      },
      {
        heading: "9. Cancellations, returns, and complaints",
        body: (
          <>
            <P>
              Detailed rules appear in the Order Policy (including hygiene, custom-item limits, and timelines). In
              summary: unused ready-to-wear in saleable condition may be eligible for exchange or store credit within
              the stated window; made-to-measure and altered pieces are generally non-returnable once production has
              started, except for proven manufacturing defects. Contact us promptly with photos and your order number.
            </P>
          </>
        ),
      },
      {
        heading: "10. Intellectual property and content",
        body: (
          <>
            <P>
              Site design, logos, lookbook imagery, patterns, and copy belong to {SHORT} or our licensors. You may not
              copy, scrape, or commercially reuse them without written permission. User-submitted reviews or images
              grant us a non-exclusive licence to display them in connection with our brand.
            </P>
          </>
        ),
      },
      {
        heading: "11. Acceptable use",
        body: (
          <>
            <Ul
              items={[
                "Do not attempt to disrupt, probe, or overload our systems.",
                "Do not upload malware, illegal content, or content that infringes others’ rights.",
                "Do not use automated bots to create accounts, scrape prices, or place abusive orders.",
                "Do not impersonate staff or other clients.",
              ]}
            />
          </>
        ),
      },
      {
        heading: "12. Limitation of liability",
        body: (
          <>
            <P>
              To the fullest extent permitted by Nigerian law, we are not liable for indirect, incidental, or
              consequential loss (including lost profits or data) arising from use of the site or delay in delivery
              caused by couriers, force majeure, or fabric supplier failure. Our aggregate liability for a given
              order is limited to the amount you paid us for that order. Nothing in these Terms excludes liability
              for fraud or death/personal injury caused by negligence where such exclusion is unlawful.
            </P>
          </>
        ),
      },
      {
        heading: "13. Force majeure",
        body: (
          <>
            <P>
              We are not in breach for delays or failures caused by events beyond reasonable control, including
              natural disasters, industrial action, power or network outages, epidemic restrictions, or government
              action. We will take reasonable steps to notify you and resume performance.
            </P>
          </>
        ),
      },
      {
        heading: "14. Governing law and disputes",
        body: (
          <>
            <P>
              These Terms are governed by the laws of the Federal Republic of Nigeria. Courts in Oyo State (or such
              other competent Nigerian court as applicable) have jurisdiction, without prejudice to mandatory
              consumer protections. We encourage good-faith negotiation before formal proceedings.
            </P>
          </>
        ),
      },
      {
        heading: "15. Changes",
        body: (
          <>
            <P>
              We may update these Terms by posting a revised version with a new “Last updated” date. Continued use
              after posting constitutes acceptance of material changes for future orders. For significant changes
              affecting ongoing custom jobs, we will honour the terms in force when that job was accepted unless you
              agree otherwise.
            </P>
          </>
        ),
      },
      {
        heading: "16. Contact",
        body: (
          <>
            <P>
              Questions about these Terms: {EMAIL} · {PHONE} · {ADDRESS}.
            </P>
          </>
        ),
      },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    crumb: "Legal",
    updated: "23 August 2026",
    intro: `This Privacy Policy explains how ${HOUSE} (“${SHORT}”, “we”, “us”) collects, uses, stores, and shares personal data when you use our website, client book, checkout (including guest checkout), appointments, newsletter, WhatsApp leads, and studio systems. It should be read with our NDPR notice, which describes your rights under Nigeria’s data protection framework.`,
    sections: [
      {
        heading: "1. Scope and controllers",
        body: (
          <>
            <P>
              {HOUSE}, {ADDRESS}, is the organisation responsible for personal data processed for fashion retail,
              custom tailoring, and related customer service. Contact the house on {EMAIL} or {PHONE} for privacy
              requests.
            </P>
          </>
        ),
      },
      {
        heading: "2. Data we collect",
        body: (
          <>
            <P>Depending on how you interact with us, we may process:</P>
            <Ul
              items={[
                "Identity and contact: name, email, phone, delivery address.",
                "Account and security: password hashes, session cookies, must-change-password flags, role (client or staff).",
                "Order and payment metadata: order numbers, line items, amounts, fulfillment choice, Paystack references, transfer receipt images, deposit/balance status. We do not store full card numbers; card data is handled by Paystack.",
                "Measurements and style notes for made-to-measure and fittings.",
                "Communications: messages, tickets, appointment requests, WhatsApp lead product interest.",
                "Marketing preferences: newsletter email and unsubscribe status.",
                "Technical and traffic data after cookie consent: visitor ID, pages viewed, device/browser type, approximate traffic funnels.",
                "Studio operational data for staff (attendance, audit logs) under employment or contractor arrangements.",
              ]}
            />
          </>
        ),
      },
      {
        heading: "3. How we collect data",
        body: (
          <>
            <Ul
              items={[
                "Directly from you via forms, checkout, uploads, email, or phone.",
                "Automatically via cookies and similar technologies after you allow cookies.",
                "From payment providers (e.g. Paystack) confirming success or failure.",
                "From you when staff record fittings or claims WhatsApp leads in the studio OS.",
              ]}
            />
          </>
        ),
      },
      {
        heading: "4. Purposes and legal bases",
        body: (
          <>
            <P>We process personal data to:</P>
            <Ul
              items={[
                "Perform contracts: place and fulfil orders, open guest client books, schedule fittings, send order updates.",
                "Pursue legitimate interests: improve the site, prevent fraud and abuse, secure systems, analyse aggregated traffic.",
                "Comply with law: tax, accounting, and regulatory record-keeping.",
                "Send marketing only where you subscribed or where soft opt-in rules allow, with a clear unsubscribe.",
                "Obtain and record consent where required (cookies, certain marketing).",
              ]}
            />
          </>
        ),
      },
      {
        heading: "5. Cookies and similar technologies",
        body: (
          <>
            <P>
              Essential cookies keep you signed in and protect checkout sessions. Preference and analytics cookies
              (including a visitor ID used for traffic measurement) are set after you accept our cookie banner. You
              can clear cookies in your browser; doing so may sign you out or reset analytics identity. See also the
              cookie notice on the banner and this Policy.
            </P>
          </>
        ),
      },
      {
        heading: "6. Sharing and processors",
        body: (
          <>
            <P>We do not sell your personal data. We share data only as needed with:</P>
            <Ul
              items={[
                "Payment processors (e.g. Paystack) to take and verify payment.",
                "Hosting, database, email (transactional mail), and image CDN providers under contracts that require appropriate security.",
                "Couriers for delivery labels and contact for hand-over.",
                "Professional advisers (legal, accounting) under confidentiality.",
                "Authorities when required by law or to protect rights, safety, or property.",
              ]}
            />
            <P>
              Some processors may process data outside Nigeria. Where we transfer data internationally, we take
              steps consistent with NDPR expectations (contracts, careful vendor selection, and minimisation).
            </P>
          </>
        ),
      },
      {
        heading: "7. Retention",
        body: (
          <>
            <P>
              Order, payment, and invoice-related records are kept for as long as needed for fulfilment, dispute
              handling, and statutory retention (often several years for commercial and tax records). Measurement
              profiles remain while your client book is active or until you ask us to delete them where no overriding
              need exists. Marketing lists are kept until you unsubscribe. Traffic logs are aggregated or pruned on a
              rolling basis. Security and audit logs are retained for investigation windows.
            </P>
          </>
        ),
      },
      {
        heading: "8. Security",
        body: (
          <>
            <P>
              We use HTTPS, access controls by role, password hashing, rate limiting, CSRF protections on
              state-changing requests, and other operational measures. No method of transmission or storage is
              perfectly secure; please use a strong unique password and report suspected incidents to {EMAIL}.
            </P>
          </>
        ),
      },
      {
        heading: "9. Children",
        body: (
          <>
            <P>
              Our services are not directed at children under 18. We do not knowingly collect children’s data for
              accounts. If you believe a minor provided data, contact us so we can delete it where appropriate.
            </P>
          </>
        ),
      },
      {
        heading: "10. Your choices and rights",
        body: (
          <>
            <P>
              You may access, correct, or request deletion of certain data, object to some processing, withdraw
              consent for cookies/marketing, and lodge a complaint with the Nigeria Data Protection Commission
              (NDPC). Our NDPR page explains these rights in more detail. Email {EMAIL} with the subject “Privacy
              request” and enough information for us to verify you.
            </P>
          </>
        ),
      },
      {
        heading: "11. Updates",
        body: (
          <>
            <P>
              We may update this Policy and will change the “Last updated” date. Material changes may also be
              highlighted on the site or by email where appropriate.
            </P>
          </>
        ),
      },
      {
        heading: "12. Contact",
        body: (
          <>
            <P>
              Privacy enquiries: {EMAIL} · {PHONE} · {ADDRESS}.
            </P>
          </>
        ),
      },
    ],
  },

  ndpr: {
    title: "NDPR Notice",
    crumb: "Legal",
    updated: "23 August 2026",
    intro: `This notice summarises how ${HOUSE} complies with the Nigeria Data Protection Act 2023 (NDPA), the Nigeria Data Protection Regulation 2019 (NDPR) principles that continue to inform good practice, and guidance from the Nigeria Data Protection Commission (NDPC). It complements our Privacy Policy.`,
    sections: [
      {
        heading: "1. Lawful processing",
        body: (
          <>
            <P>
              We process personal data only when at least one lawful basis applies: performance of a contract with
              you (orders, fittings, accounts); compliance with a legal obligation; vital interests (rare emergency
              safety cases); our legitimate interests (security, fraud prevention, service improvement) balanced
              against your rights; or consent (non-essential cookies, optional marketing where consent is required).
            </P>
          </>
        ),
      },
      {
        heading: "2. Principles we follow",
        body: (
          <>
            <Ul
              items={[
                "Lawfulness, fairness, and transparency — clear notices and honest purposes.",
                "Purpose limitation — we do not reuse checkout data for unrelated profiling without a proper basis.",
                "Data minimisation — we ask only for what fulfilment and service need.",
                "Accuracy — you can update profile details; we correct errors when notified.",
                "Storage limitation — retention aligned to purpose and law.",
                "Integrity and confidentiality — technical and organisational security measures.",
                "Accountability — policies, access roles, vendor diligence, and audit trails for sensitive studio actions.",
              ]}
            />
          </>
        ),
      },
      {
        heading: "3. Categories of data subjects and data",
        body: (
          <>
            <P>
              Data subjects include website visitors, newsletter subscribers, guests and registered clients, WhatsApp
              lead enquirers, and authorised staff. Data categories include contact details, order history,
              measurements, payment status metadata, communications, and limited technical identifiers. Special
              categories of data are not sought; please do not upload sensitive health or biometric information
              unless we expressly request it for a fitting and agree a basis.
            </P>
          </>
        ),
      },
      {
        heading: "4. Your rights under Nigerian data protection law",
        body: (
          <>
            <P>Subject to exceptions in the NDPA/NDPR framework, you may request to:</P>
            <Ul
              items={[
                "Be informed about processing (this notice and the Privacy Policy).",
                "Access personal data we hold about you.",
                "Rectify inaccurate or incomplete data.",
                "Erase data where processing is no longer necessary or consent is withdrawn and no other basis applies.",
                "Restrict or object to certain processing, including direct marketing.",
                "Data portability for data you provided, where technically feasible and legally required.",
                "Withdraw consent without affecting prior lawful processing.",
                "Lodge a complaint with the NDPC if you believe your rights were infringed.",
              ]}
            />
            <P>
              To exercise rights, email {EMAIL} with “NDPR / data rights” in the subject line. We may need to verify
              your identity (for example matching the email on the client book or order). We aim to respond within
              the timelines expected under applicable law; complex requests may take longer, and we will explain if
              so.
            </P>
          </>
        ),
      },
      {
        heading: "5. Data Protection Officer / contact point",
        body: (
          <>
            <P>
              Privacy and NDPR requests are handled by the house administration. Contact {EMAIL} or {PHONE}. If we
              appoint a formal Data Protection Officer or designate as required by scale of processing, we will
              update this notice with that person’s contact details.
            </P>
          </>
        ),
      },
      {
        heading: "6. Security and breach notification",
        body: (
          <>
            <P>
              We implement appropriate technical and organisational measures against unauthorised access, loss, or
              destruction. In the event of a personal data breach likely to result in a risk to your rights, we will
              assess and, where required, notify the NDPC and affected individuals without undue delay, describing
              the nature of the breach and measures taken.
            </P>
          </>
        ),
      },
      {
        heading: "7. Cross-border transfers",
        body: (
          <>
            <P>
              Hosting, email, payments, or media infrastructure may involve processing outside Nigeria. We select
              reputable providers and use contractual and organisational safeguards consistent with Nigerian
              requirements for transfer of personal data abroad.
            </P>
          </>
        ),
      },
      {
        heading: "8. Automated decision-making",
        body: (
          <>
            <P>
              We do not use solely automated decision-making that produces legal or similarly significant effects
              about you (for example automated credit scoring). Order fraud checks may use risk signals reviewed with
              human oversight where needed.
            </P>
          </>
        ),
      },
      {
        heading: "9. Children’s data",
        body: (
          <>
            <P>
              We do not intentionally offer accounts to children. Parental or guardian contact for gift orders should
              use adult details. See also the Privacy Policy.
            </P>
          </>
        ),
      },
      {
        heading: "10. Relationship to other policies",
        body: (
          <>
            <P>
              Cookie use is described in the Privacy Policy and cookie banner. Order handling and custom jobs remain
              subject to the Terms & Conditions, Order Policy, and Job Taking Policy. If there is a conflict on a
              privacy point, this NDPR Notice and the Privacy Policy prevail for data protection matters.
            </P>
          </>
        ),
      },
      {
        heading: "11. Updates and regulator",
        body: (
          <>
            <P>
              We may revise this notice as the NDPA, NDPC guidance, or our processing changes. Regulator: Nigeria
              Data Protection Commission (NDPC) — refer to official NDPC channels for current complaint procedures.
            </P>
            <P>
              House contact: {EMAIL} · {PHONE} · {ADDRESS}.
            </P>
          </>
        ),
      },
    ],
  },

  order: {
    title: "Order Policy",
    crumb: "Policy",
    updated: "23 August 2026",
    intro: `This Order Policy explains how ${SHORT} accepts, produces, delivers, and handles changes to ready-to-wear and made-to-measure orders. Placing or continuing an order means you also agree to our Terms & Conditions and Job Taking Policy.`,
    sections: [
      {
        heading: "Policy document",
        body: (
          <>
            <P>The house order policy poster is shown below. The text that follows summarises key points in accessible form.</P>
            <img
              src="/images/job-order-policy.png"
              alt="EUNIK Order Policy"
              className="mb-8 w-full border border-line"
            />
          </>
        ),
      },
      {
        heading: "Order acceptance and unique numbers",
        body: (
          <>
            <P>
              Each order is assigned a unique order number shared across guest and registered checkouts. Keep your
              number for tracking, transfer narrations, and support. We may decline orders that cannot be fulfilled
              fairly or safely.
            </P>
          </>
        ),
      },
      {
        heading: "Payment, deposits, and balances",
        body: (
          <>
            <Ul
              items={[
                "Ready-to-wear: full payment is typically due at checkout unless we state otherwise.",
                "Made-to-measure: deposit starts the job; balance before collection or dispatch.",
                "Unverified transfers do not confirm an order until the house matches the receipt.",
              ]}
            />
          </>
        ),
      },
      {
        heading: "Changes, cancellations, and custom work",
        body: (
          <>
            <P>
              Cancel before production cut where possible. Custom garments cut or sewn to your measurements are not
              returnable except for proven house defects. Design changes after approval may reset timelines and fees.
            </P>
          </>
        ),
      },
      {
        heading: "Pickup, delivery, and inspection",
        body: (
          <>
            <P>
              Inspect garments at pickup or within a short window after delivery for transit damage. Report issues
              with photos and your order number. Hygiene and wear rules apply to exchanges.
            </P>
          </>
        ),
      },
      {
        heading: "Contact",
        body: (
          <>
            <P>
              Order support: {EMAIL} · {PHONE}.
            </P>
          </>
        ),
      },
    ],
  },

  jobs: {
    title: "Job Taking Policy",
    crumb: "Policy",
    updated: "23 August 2026",
    intro: `This Job Taking Policy covers how ${SHORT} accepts, schedules, and prioritises custom and studio jobs. Continuing with a custom order or fitting means you agree to this policy together with our Terms and Order Policy.`,
    sections: [
      {
        heading: "Policy document",
        body: (
          <>
            <P>The house job-taking policy poster is shown below, followed by a plain-language summary.</P>
            <img
              src="/images/job-order-policy.png"
              alt="EUNIK Job Taking Policy"
              className="mb-8 w-full border border-line"
            />
          </>
        ),
      },
      {
        heading: "When a job is accepted",
        body: (
          <>
            <P>
              A job is accepted when deposit (where required) is confirmed, measurements or size are recorded, and
              the studio confirms capacity. Verbal WhatsApp chats are helpful but written confirmation in the client
              book, quote, or email controls the brief.
            </P>
          </>
        ),
      },
      {
        heading: "Timelines and rush work",
        body: (
          <>
            <Ul
              items={[
                "Quoted timelines are estimates and depend on fittings, fabric, and queue.",
                "Rush requests need explicit house confirmation and any rush fee paid.",
                "Event dates must be disclosed early; last-minute briefs may be declined.",
              ]}
            />
          </>
        ),
      },
      {
        heading: "Client responsibilities",
        body: (
          <>
            <Ul
              items={[
                "Attend fittings or send a proxy with authority to approve.",
                "Provide truthful measurements and reachable contact details.",
                "Respond to approval requests within a reasonable time to avoid delay.",
              ]}
            />
          </>
        ),
      },
      {
        heading: "Studio capacity and refusal",
        body: (
          <>
            <P>
              We may pause intake, refuse unsafe or unethical briefs, or reschedule when capacity, equipment, or
              supply is constrained. Already-accepted jobs remain subject to force majeure and fabric availability.
            </P>
          </>
        ),
      },
      {
        heading: "Contact",
        body: (
          <>
            <P>
              Studio desk: {EMAIL} · {PHONE}.
            </P>
          </>
        ),
      },
    ],
  },
};

export function isLegalKind(value: string | undefined): value is LegalKind {
  return value === "terms" || value === "privacy" || value === "ndpr" || value === "order" || value === "jobs";
}
