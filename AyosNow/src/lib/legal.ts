import type { Metadata } from "next";

import { contactConfig } from "@/lib/contact-config";
import { legalLastUpdated, type LegalSlug } from "@/lib/legal-shared";

export interface LegalSection {
  id: string;
  title: string;
  body: string[];
}

export interface LegalDocument {
  slug: LegalSlug;
  title: string;
  description: string;
  sections: LegalSection[];
}

export const contactEmails = contactConfig;

const platformSummary =
  "PuntaGo is a technology platform that helps customers discover, request, compare, book, and communicate with independent home service professionals. PuntaGo is not the employer, agent, or direct service provider of independent professionals.";

export const legalDocuments: Record<LegalSlug, LegalDocument> = {
  terms: {
    slug: "terms",
    title: "Terms of Service",
    description: "The main rules for using PuntaGo as a customer, professional, or visitor.",
    sections: [
      {
        id: "acceptance",
        title: "1. Acceptance of These Terms",
        body: [
          `These Terms of Service govern your access to and use of PuntaGo. ${platformSummary}`,
          "By creating an account, signing in with Google OAuth, browsing services, sending messages, uploading files, requesting quotes, booking services, using wallet credits, or otherwise using PuntaGo, you agree to these Terms and the policies linked from this page.",
          "If you do not agree, do not use PuntaGo. If you use PuntaGo on behalf of a business, you confirm that you are authorized to accept these Terms for that business.",
        ],
      },
      {
        id: "eligibility",
        title: "2. Eligibility and Account Responsibility",
        body: [
          "You must be at least 18 years old to use PuntaGo. You must provide accurate account information and keep your login credentials secure.",
          "You are responsible for activity under your account, including actions taken through Google OAuth, email login, chat, bookings, uploaded files, wallet credits, and professional service listings.",
          "PuntaGo may suspend or restrict accounts that appear fraudulent, unsafe, abusive, unlawful, or in violation of these Terms.",
        ],
      },
      {
        id: "platform-role",
        title: "3. PuntaGo's Platform Role",
        body: [
          "PuntaGo provides software tools for discovery, quote requests, bookings, chat, notifications, wallet credits, and operational support.",
          "Independent professionals decide whether to accept work, quote prices, schedule visits, perform services, and resolve service-specific issues with customers.",
          "Unless expressly stated in writing, PuntaGo does not guarantee a professional's availability, licensing, quality of work, arrival time, price, or outcome.",
        ],
      },
      {
        id: "bookings",
        title: "4. Quotes, Bookings, Wallet, and Credits",
        body: [
          "Customers may request quotes or book listed services. Professionals may submit quotes and manage bookings through PuntaGo.",
          "Professional credits may be required for selected actions, such as submitting quotes. Credits are platform units and are not bank deposits, stored-value money, or legal tender.",
          "Wallet balances, credit charges, top-ups, manual adjustments, and refunds are recorded in PuntaGo systems. Any payment or refund process is also subject to the Payment & Refund Policy.",
        ],
      },
      {
        id: "communications",
        title: "5. Communications, Notifications, and Web Push",
        body: [
          "PuntaGo may send account, booking, quote, wallet, safety, and support messages through in-app notifications, email, SMS, and Web Push where enabled.",
          "Marketing messages are optional where required by law or platform settings. Operational messages may still be sent because they are needed to provide the service.",
          "You are responsible for checking messages related to bookings, disputes, payments, account status, and professional requirements.",
        ],
      },
      {
        id: "uploads",
        title: "6. Uploaded Files and Content",
        body: [
          "You may upload text, images, documents, and other files for service communication, profile setup, portfolio evidence, reviews, reports, and support requests.",
          "You must not upload illegal, unsafe, abusive, misleading, infringing, private, or sensitive content unless you have the right and a valid service reason to do so.",
          "PuntaGo stores uploaded files using Cloudflare R2 or similar infrastructure. PuntaGo may remove content that violates these Terms, the Community Guidelines, or applicable law.",
        ],
      },
      {
        id: "responsibilities",
        title: "7. User and Professional Responsibilities",
        body: [
          "Customers must provide accurate job details, location information, access instructions, payment information, and timely communication.",
          "Professionals must provide truthful profiles, fair quotes, appropriate qualifications, safe work practices, punctual communication, and service consistent with their listing and quote.",
          "Both customers and professionals must treat each other respectfully and follow the Community Guidelines.",
        ],
      },
      {
        id: "third-party",
        title: "8. Third-Party Services",
        body: [
          "PuntaGo may use third-party services such as Google OAuth, Cloudflare infrastructure, payment processors, email providers, SMS providers, analytics, and security tools.",
          "Your use of those services may also be subject to their own terms and privacy notices.",
          "PuntaGo is not responsible for outages, delays, or restrictions caused by third-party providers, but will use reasonable efforts to maintain platform availability.",
        ],
      },
      {
        id: "ip",
        title: "9. Intellectual Property",
        body: [
          "PuntaGo, its brand, interface, software, designs, text, and platform materials are owned by PuntaGo or its licensors.",
          "You keep ownership of content you upload, but grant PuntaGo a limited license to host, process, display, transmit, and store that content as needed to provide and improve the platform.",
          "You must not copy, scrape, reverse engineer, misuse, or commercially exploit PuntaGo except as allowed by law or written permission.",
        ],
      },
      {
        id: "liability",
        title: "10. Disclaimers and Limitation of Liability",
        body: [
          "PuntaGo is provided on an \"as available\" basis. We aim to operate reliably, but we do not promise uninterrupted, error-free, or risk-free service.",
          "To the maximum extent permitted by applicable law, PuntaGo is not liable for indirect, incidental, special, consequential, punitive, or lost-profit damages.",
          "Nothing in these Terms limits rights that cannot be limited under applicable consumer, data protection, or safety laws.",
        ],
      },
      {
        id: "deletion",
        title: "11. Account Deletion and Termination",
        body: [
          `You may request account deletion by contacting ${contactEmails.supportEmail}. PuntaGo may need to retain limited records where required for legal, tax, fraud prevention, payment, dispute, safety, or legitimate business reasons.`,
          "PuntaGo may terminate or restrict access if you violate these Terms, create risk, misuse the platform, or fail to meet professional requirements.",
        ],
      },
      {
        id: "law",
        title: "12. Future Local Law Adaptation",
        body: [
          "These Terms are structured so they can be adapted for Philippine legal requirements, consumer protection rules, data privacy guidance, and marketplace regulations as PuntaGo grows.",
          "If any provision is invalid or unenforceable, the rest of the Terms remains effective to the extent permitted by law.",
        ],
      },
      {
        id: "contact",
        title: "13. Contact",
        body: [
          `For support questions, contact ${contactEmails.supportEmail}. For privacy questions, contact ${contactEmails.privacyEmail}. For business inquiries, contact ${contactEmails.businessEmail}. For abuse reports, contact ${contactEmails.abuseEmail}.`,
        ],
      },
    ],
  },
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    description: "How PuntaGo collects, uses, stores, shares, and protects personal information.",
    sections: [
      {
        id: "overview",
        title: "1. Overview",
        body: [
          "This Privacy Policy explains how PuntaGo handles personal information when you use our website, account system, Google OAuth login, quote requests, bookings, wallet features, chat, uploaded files, notifications, and support channels.",
          "We design this Policy so it can be adapted to Philippine data privacy requirements, including principles of transparency, legitimate purpose, and proportionality.",
        ],
      },
      {
        id: "data-collected",
        title: "2. Information We Collect",
        body: [
          "Account data: name, email, phone number, role, city, profile details, login method, avatar, account status, and referral information.",
          "Service data: quote requests, service listings, bookings, schedules, reviews, ratings, wallet credits, payment records, disputes, and professional approval information.",
          "Communication data: chat messages, read status, typing status, notifications, uploaded files, support messages, reports, and abuse submissions.",
          "Technical data: IP address, user agent, cookies, device/browser details, security logs, approximate location signals, and consent records.",
        ],
      },
      {
        id: "sources",
        title: "3. Sources of Information",
        body: [
          "We collect information directly from you, from your use of PuntaGo, from Google OAuth when you choose Google sign-in, from payment and messaging providers, from other users you interact with, and from security or infrastructure systems.",
          "When you upload files or send messages about another person, you are responsible for having a valid reason and any required permission.",
        ],
      },
      {
        id: "use",
        title: "4. How We Use Information",
        body: [
          "We use information to create accounts, verify login, support Google OAuth, route quote requests, manage bookings, enable chat, store uploaded files, maintain wallet credits, process payments, send notifications, prevent fraud, resolve disputes, improve the platform, and comply with legal obligations.",
          "We may use consent records to prove which policy version you accepted and to ask for re-acceptance when policies materially change.",
        ],
      },
      {
        id: "sharing",
        title: "5. Sharing and Disclosure",
        body: [
          "We share necessary information between customers and professionals to complete service requests, quotes, bookings, messages, reviews, and dispute handling.",
          "We may share data with service providers that support hosting, storage, Cloudflare infrastructure, Google OAuth, payments, email, SMS, Web Push, analytics, fraud prevention, and customer support.",
          "We may disclose information when required by law, to protect users, to investigate abuse, to enforce policies, or in connection with a business transaction such as merger, financing, or acquisition.",
        ],
      },
      {
        id: "storage",
        title: "6. Storage, Security, and Cloudflare Infrastructure",
        body: [
          "PuntaGo uses Cloudflare Workers, D1, R2, and related infrastructure to operate the platform. Uploaded files are stored in object storage, while the database stores references and metadata.",
          "We use reasonable technical and organizational measures to protect information. No internet service can be guaranteed completely secure.",
          "You should use a strong password, protect your email account, and report suspicious account activity promptly.",
        ],
      },
      {
        id: "notifications",
        title: "7. Cookies, Web Push, and Communications",
        body: [
          "We use cookies and similar technologies for authentication, security, preferences, performance, and analytics as described in the Cookie Policy.",
          "If you enable Web Push, your browser provides a push subscription endpoint that lets PuntaGo send notifications. You can disable browser notifications in your browser settings.",
          "You may opt out of marketing communications where supported, but we may still send service, safety, account, booking, payment, or legal notices.",
        ],
      },
      {
        id: "rights",
        title: "8. Privacy Rights and Account Deletion",
        body: [
          `You may request access, correction, deletion, restriction, or other privacy assistance by contacting ${contactEmails.privacyEmail}.`,
          `You may request account deletion through ${contactEmails.supportEmail}. We may retain limited records where needed for legal, tax, payment, dispute, fraud prevention, safety, backup, or legitimate business purposes.`,
          "We may need to verify your identity before acting on privacy or deletion requests.",
        ],
      },
      {
        id: "retention",
        title: "9. Retention",
        body: [
          "We keep information as long as needed to provide the platform, maintain security, handle disputes, meet legal obligations, support audits, prevent abuse, and enforce our policies.",
          "Uploaded files and messages may be retained as part of booking, support, safety, or dispute records unless deleted under an applicable retention process.",
        ],
      },
      {
        id: "children",
        title: "10. Age Requirement",
        body: [
          "PuntaGo is for users who are at least 18 years old. We do not knowingly allow minors to create accounts.",
        ],
      },
      {
        id: "changes",
        title: "11. Changes to This Policy",
        body: [
          "We may update this Privacy Policy. If changes are material, we may notify users, update the Last Updated date, and require re-acceptance before continued use of important account features.",
        ],
      },
    ],
  },
  "payment-refund": {
    slug: "payment-refund",
    title: "Payment & Refund Policy",
    description: "Rules for payments, wallet credits, professional credits, refunds, disputes, and failed transactions.",
    sections: [
      {
        id: "scope",
        title: "1. Scope",
        body: [
          "This Payment & Refund Policy applies to payments, wallet credits, professional credits, manual admin top-ups, PayMongo or other payment processor transactions, refunds, chargebacks, and booking-related financial records on PuntaGo.",
          "You do not need to accept this policy just to create an account. PuntaGo asks you to accept it immediately before wallet top-ups, credit purchases, payments, or other financial transactions.",
          "PuntaGo may store the accepted payment policy version, acceptance time, IP address, user agent, and related payment record so we can prove which rules applied to a transaction.",
          "This policy is designed to be adapted to Philippine payment, consumer, and tax requirements as the platform matures.",
        ],
      },
      {
        id: "payments",
        title: "2. Payment Processing",
        body: [
          "PuntaGo may use third-party payment processors such as PayMongo. Payment pages, card processing, e-wallets, bank transfer methods, fraud checks, and payment authentication may be handled by the payment processor.",
          "A payment may be marked pending, paid, failed, expired, refunded, or disputed depending on processor confirmation and PuntaGo records.",
          "You must provide accurate payment details and use only payment methods you are authorized to use.",
        ],
      },
      {
        id: "wallet",
        title: "3. Wallet and Credits",
        body: [
          "PuntaGo may provide wallet credits or professional credits for platform actions such as quote submission, promotions, adjustments, or refunds.",
          "Credits are not cash, bank deposits, stored-value money, or legal tender. Credits may be limited to specific platform uses and may not be transferable unless PuntaGo expressly allows it.",
          "Professional quote fees, currently including the standard quote credit deduction, are charged according to the active platform rules shown in the product or admin settings.",
        ],
      },
      {
        id: "refunds",
        title: "4. Refund Eligibility",
        body: [
          "Refund eligibility depends on the transaction type, booking status, payment processor status, service progress, professional actions, customer cancellation, duplicate payment, failed service, or administrative decision.",
          "PuntaGo may issue refunds to the original payment method, wallet credits, platform credits, or another method allowed by the payment provider and applicable law.",
          "Processor fees, promotional credits, already-consumed quote credits, completed service fees, or amounts paid directly outside PuntaGo may not be refundable unless required by law or approved by PuntaGo.",
        ],
      },
      {
        id: "cancellations",
        title: "5. Cancellations and Booking Issues",
        body: [
          "Customers and professionals should use PuntaGo messages and booking tools to document schedule changes, cancellations, no-shows, incomplete work, or service quality issues.",
          "PuntaGo may review chat history, booking status, payment records, uploaded files, and user reports when deciding whether to reverse credits, issue refunds, or restrict accounts.",
        ],
      },
      {
        id: "chargebacks",
        title: "6. Chargebacks, Fraud, and Abuse",
        body: [
          "If a payment is disputed or charged back, PuntaGo may suspend wallet use, reverse credits, request information, restrict account access, or cooperate with payment processors and authorities.",
          "Fraudulent payments, fake bookings, off-platform payment pressure, refund abuse, or misuse of credits may result in account suspension.",
        ],
      },
      {
        id: "requests",
        title: "7. How to Request Payment Help",
        body: [
          `For payment or refund questions, contact ${contactEmails.supportEmail} with your account email, booking ID, payment reference, amount, date, and a clear explanation.`,
          "We may ask for additional documents, screenshots, or communication records before completing a review.",
          "Users must be at least 18 years old to make payments or use financial features on PuntaGo. You may also request account deletion or personal data removal, subject to legal, tax, payment, fraud-prevention, dispute, and safety retention requirements.",
        ],
      },
    ],
  },
  "pro-policy": {
    slug: "pro-policy",
    title: "Professional Policy",
    description: "Additional rules for independent professionals using PuntaGo to offer services.",
    sections: [
      {
        id: "status",
        title: "1. Independent Professional Status",
        body: [
          "Professionals on PuntaGo are independent service providers. They are not employees, agents, franchisees, partners, or representatives of PuntaGo unless a separate written agreement says otherwise.",
          "Professionals control how they perform their services, subject to customer agreements, platform rules, safety requirements, and applicable law.",
          "PuntaGo may provide software, discovery, wallet, chat, booking, support, review, and dispute tools, but the professional remains responsible for the quality, safety, legality, and completion of the service they agree to perform.",
        ],
      },
      {
        id: "eligibility",
        title: "2. Eligibility, Identity, and Approval",
        body: [
          "Professionals must be at least 18 years old and legally able to offer the services they list. PuntaGo may require identity verification, contact verification, business information, photos, certificates, permits, licenses, references, or other evidence before or after approval.",
          "Where a service requires a license, permit, certification, trade qualification, insurance, or legal authorization, the professional must hold and maintain it. PuntaGo may remove or limit listings if required proof is missing, expired, misleading, or not applicable to the listed service.",
          "Approval to use PuntaGo is not a permanent guarantee. PuntaGo may re-check professional accounts, request updated documents, pause listings, or limit features if risk, complaints, fraud signals, or policy concerns appear.",
        ],
      },
      {
        id: "profile-accuracy",
        title: "3. Accurate Profiles and Honest Advertising",
        body: [
          "Professional profiles must be truthful and current. Names, service areas, experience, skills, photos, prices, response times, portfolio examples, certificates, and availability must not mislead customers.",
          "Professionals must not create fake profiles, duplicate profiles, fake ratings, fake reviews, misleading advertisements, copied portfolios, inflated credentials, or false claims about being endorsed by PuntaGo.",
          "If information changes, the professional must update the profile promptly. PuntaGo may edit, hide, or remove inaccurate content to protect customers and platform trust.",
        ],
      },
      {
        id: "quotes-pricing",
        title: "4. Quotations, Pricing, and Platform Fees",
        body: [
          "No fake quotations are allowed. Professionals must send honest quotes based on the job details, expected labor, materials, travel, urgency, risk, and any clearly stated limitations.",
          "Professionals must not intentionally increase the quoted price after a booking has been accepted unless the customer requests extra work, the job scope clearly changes, or a hidden issue is discovered and explained before additional work begins.",
          "Professionals must not use bait-and-switch pricing, irrelevant spam quotes, fake discounts, hidden fees, or misleading urgency claims. Any inspection fee, travel fee, materials estimate, cancellation fee, or extra charge should be explained before the customer accepts.",
          "Professionals must not ask customers to pay outside PuntaGo to avoid platform fees, credits, records, or dispute rules. Professionals must not ask customers to cancel bookings in order to bypass PuntaGo.",
        ],
      },
      {
        id: "communication",
        title: "5. Communication and Customer Respect",
        body: [
          "Professionals must communicate clearly, politely, and professionally before, during, and after a booking. Messages should stay related to the service and should not pressure, insult, shame, threaten, or confuse the customer.",
          "Harassment, discrimination, threats, intimidation, abusive behavior, sexual comments, hateful language, retaliation, or unsafe pressure are prohibited.",
          "Professionals must not misuse customer personal information. Customer phone numbers, addresses, photos, chat messages, job details, and payment-related information may only be used for the accepted service and support needs.",
        ],
      },
      {
        id: "booked-services",
        title: "6. Booked Services, Arrival, and Completion",
        body: [
          "Professionals should arrive on time or notify the customer as early as possible if delayed. Repeated lateness, no-shows, or poor communication can lead to warnings, reduced visibility, suspension, or removal.",
          "Professionals must complete booked services properly, safely, and according to the accepted scope. A service must not be marked complete unless the work was actually performed or the customer and PuntaGo process support that status.",
          "False completion of services, fake progress updates, refusal to finish agreed work without valid reason, or charging for work not performed are serious violations.",
          "If a professional needs to cancel, they should do so promptly through PuntaGo where possible and explain the reason. Repeated cancellations or no-shows may affect account standing.",
        ],
      },
      {
        id: "safety-law",
        title: "7. Safety, Legal Compliance, and Prohibited Services",
        body: [
          "Professionals must use safe methods, suitable tools, appropriate protective equipment, and reasonable care for the customer, property, neighbors, assistants, and the public.",
          "Professionals must comply with applicable laws, permits, safety rules, consumer rules, tax obligations, business requirements, and industry standards that apply to their services.",
          "Illegal, unsafe, deceptive, fraudulent, harmful, discriminatory, or prohibited services are not allowed. Professionals must refuse work they are not qualified or legally allowed to perform.",
          "Professionals are responsible for their tools, transportation, materials, assistants, subcontractors, licenses, insurance, taxes, and permits unless a written arrangement says otherwise.",
        ],
      },
      {
        id: "content-reviews",
        title: "8. Portfolio Content, Uploaded Photos, and Reviews",
        body: [
          "Portfolio images, certificates, work photos, service descriptions, and uploaded files must be truthful, lawful, safe, and owned by the professional or used with permission.",
          "Professionals must not upload customer photos, addresses, private details, IDs, documents, interiors, before/after images, or job evidence unless there is a valid service reason and proper permission.",
          "No fake reviews, fake ratings, paid reviews, review swaps, threats for good reviews, retaliation for bad reviews, or review manipulation are allowed.",
          "PuntaGo may remove misleading content, hide unsafe uploads, reject portfolio items, or investigate suspicious review behavior.",
        ],
      },
      {
        id: "fraud-bypass",
        title: "9. Fraud, Bypass, and Platform Abuse",
        body: [
          "Professionals must not engage in fraudulent or deceptive practices, including fake bookings, fake quotes, fake completion, fake identities, fake ratings, stolen photos, or false customer complaints.",
          "Professionals must not pressure customers to move communication, payment, booking, refunds, or disputes outside PuntaGo in order to avoid platform fees, credits, safety records, or enforcement.",
          "Professionals must not request passwords, payment credentials, unrelated IDs, private documents, or unnecessary sensitive information from customers.",
          "Repeated poor ratings, repeated verified complaints, chargeback abuse, harassment reports, safety reports, or failure to cooperate with reviews may result in temporary suspension or permanent removal.",
        ],
      },
      {
        id: "disputes-enforcement",
        title: "10. Disputes, Evidence, and Enforcement",
        body: [
          "PuntaGo reserves the right to investigate complaints, request evidence, review chat records, inspect uploaded files, verify payment records, compare booking timelines, and enforce platform policies.",
          "Possible enforcement actions include education, warning, required profile changes, content removal, quote limits, reduced visibility, temporary suspension, wallet or payout holds where lawful, permanent account termination, and legal or safety reporting where appropriate.",
          "Serious issues such as fraud, threats, illegal services, identity misuse, off-platform payment scams, customer data misuse, or repeated verified complaints may lead to immediate suspension or permanent termination.",
          "Professionals may appeal enforcement decisions by contacting support with account details, booking IDs, evidence, and a clear explanation. PuntaGo may uphold, modify, or reverse a decision after review.",
          `Professional questions can be sent to ${contactEmails.businessEmail}. Abuse or safety reports can be sent to ${contactEmails.abuseEmail}.`,
        ],
      },
    ],
  },
  "community-guidelines": {
    slug: "community-guidelines",
    title: "Community Guidelines",
    description: "Safety, respect, and trust rules for everyone using PuntaGo.",
    sections: [
      {
        id: "purpose",
        title: "1. Purpose",
        body: [
          "PuntaGo connects people who need home services with independent professionals. These Guidelines help keep the marketplace safe, respectful, and useful.",
          "They apply to profiles, listings, quotes, bookings, chat, reviews, uploaded files, support requests, and off-platform conduct related to PuntaGo interactions.",
        ],
      },
      {
        id: "respect",
        title: "2. Respectful Conduct",
        body: [
          "Do not harass, threaten, shame, exploit, stalk, discriminate, or use abusive language toward customers, professionals, staff, or other users.",
          "Do not pressure users to share unnecessary personal information, make unsafe decisions, or move transactions off-platform to avoid records or rules.",
        ],
      },
      {
        id: "truth",
        title: "3. Honest Information",
        body: [
          "Use accurate names, service descriptions, prices, schedules, locations, qualifications, photos, and reviews.",
          "Do not create fake accounts, fake reviews, fake bookings, misleading portfolios, duplicate listings, or manipulated ratings.",
        ],
      },
      {
        id: "safety",
        title: "4. Safety and Property",
        body: [
          "Customers should provide accurate access instructions and disclose safety concerns. Professionals should use safe methods and appropriate tools.",
          "Do not bring unauthorized people to a job, enter restricted areas, damage property, misuse keys, or perform work beyond agreed scope without consent.",
        ],
      },
      {
        id: "content",
        title: "5. Content and Uploaded Files",
        body: [
          "Do not upload illegal, sexual, violent, hateful, fraudulent, malware-related, infringing, or unrelated content.",
          "Do not publish private addresses, identification documents, payment details, passwords, or private communications unless required for support and handled through appropriate channels.",
        ],
      },
      {
        id: "reviews",
        title: "6. Reviews and Feedback",
        body: [
          "Reviews should describe real experiences honestly. Do not post fake, retaliatory, paid, coerced, or irrelevant reviews.",
          "PuntaGo may remove reviews that violate these Guidelines, contain private information, or are not tied to a real platform interaction.",
        ],
      },
      {
        id: "reporting",
        title: "7. Reporting and Enforcement",
        body: [
          `Report abuse, safety issues, fraud, or harmful content to ${contactEmails.abuseEmail}.`,
          "PuntaGo may warn users, remove content, restrict features, pause listings, suspend accounts, or cooperate with authorities where appropriate.",
          "Users must be at least 18 years old to use PuntaGo. Users may request account deletion or personal data removal through support or privacy contact channels, subject to records PuntaGo must keep for safety, payment, dispute, legal, or fraud-prevention reasons.",
        ],
      },
    ],
  },
  "cookie-policy": {
    slug: "cookie-policy",
    title: "Cookie Policy",
    description: "How PuntaGo uses cookies and similar technologies for login, security, preferences, and analytics.",
    sections: [
      {
        id: "what",
        title: "1. What Cookies Are",
        body: [
          "Cookies are small files stored by your browser. Similar technologies include local storage, session storage, pixels, SDKs, device identifiers, and browser push subscription data.",
          "PuntaGo uses these technologies to operate accounts, protect sessions, remember preferences, measure performance, improve the platform, and support notifications.",
        ],
      },
      {
        id: "types",
        title: "2. Types of Cookies We Use",
        body: [
          "Essential cookies: required for login, security, session management, CSRF protection, language preferences, and account navigation.",
          "Functional cookies: help remember choices such as language, UI state, and notification preferences.",
          "Analytics and performance cookies: help us understand page performance, feature use, errors, and reliability.",
          "Marketing cookies: may be used only where enabled and lawful, and may support campaign measurement or optional communications.",
        ],
      },
      {
        id: "third-party",
        title: "3. Third-Party Technologies",
        body: [
          "Google OAuth, Cloudflare, payment processors, email/SMS providers, Web Push services, analytics, and security tools may set or read cookies or similar identifiers when needed for their services.",
          "Those providers may process data according to their own privacy notices and security practices.",
        ],
      },
      {
        id: "web-push",
        title: "4. Web Push",
        body: [
          "If you enable Web Push, your browser creates a push subscription endpoint. PuntaGo stores that endpoint so it can send notifications about account, booking, quote, message, wallet, and safety activity.",
          "You can disable notifications through your browser or device settings. Turning off push does not delete your account.",
        ],
      },
      {
        id: "choices",
        title: "5. Your Choices",
        body: [
          "Most browsers let you block, delete, or limit cookies. If you block essential cookies, PuntaGo login, booking, chat, wallet, and security features may not work correctly.",
          "Users must be at least 18 years old to use PuntaGo. You may request account deletion or personal data removal, and PuntaGo will handle cookie-related records according to the Privacy Policy and retention needs.",
          `For privacy questions about cookies or tracking, contact ${contactEmails.privacyEmail}.`,
        ],
      },
      {
        id: "updates",
        title: "6. Updates",
        body: [
          "We may update this Cookie Policy as technologies, providers, and legal requirements change.",
        ],
      },
    ],
  },
};

export function getLegalDocument(slug: LegalSlug) {
  return legalDocuments[slug];
}

export function createLegalMetadata(document: LegalDocument): Metadata {
  const appUrl = (process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "https://puntago.net").replace(/\/$/, "");
  const url = `${appUrl}/${document.slug}`;

  return {
    title: `${document.title} | PuntaGo`,
    description: document.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${document.title} | PuntaGo`,
      description: document.description,
      url,
      siteName: "PuntaGo",
      type: "article",
      locale: "en_US",
    },
    twitter: {
      card: "summary",
      title: `${document.title} | PuntaGo`,
      description: document.description,
    },
  };
}

export { legalLastUpdated };
