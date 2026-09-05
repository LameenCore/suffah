import { LegalDoc } from "@/components/LegalDoc";

export const metadata = { title: "Terms of Service — Suffa" };

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of Service" updated="September 2026">
      <p>
        Suffa is a platform that helps Quebec Muslim families run community homeschool
        pods: the software delivers curriculum and assessment, community volunteers run
        in-person enrichment, and the masjid administers pods and compliance records. It
        is operated by a masjid or community organisation (&ldquo;the operator&rdquo;),
        not by a for-profit company.
      </p>

      <h2>Who can use Suffa</h2>
      <ul>
        <li>A <strong>parent or legal guardian</strong> may create an account and link a
          child. A child account is only activated once guardian consent is on file (see
          the <a href="/privacy">Privacy Policy</a>).</li>
        <li>A <strong>student</strong> uses the learning playground under their guardian&apos;s
          account and consent.</li>
        <li>A <strong>volunteer</strong> and a <strong>masjid administrator</strong> are
          added by the operator.</li>
        <li>You must provide accurate information and keep your password confidential.</li>
      </ul>

      <h2>What Suffa is and is not</h2>
      <ul>
        <li>Suffa organises evidence of a child&apos;s learning. <strong>It does not file
          anything with the ministère de l&apos;Éducation on your behalf</strong> and does
          not replace the parent&apos;s legal obligations for home instruction, including
          the ministerial examinations. The parent remains responsible for every filing.
          (verify with counsel)</li>
        <li>The compliance status shown in the app is an internal early-warning aid. Its
          thresholds are illustrative and must be confirmed against current Quebec
          regulation before being relied on. (verify with counsel)</li>
        <li>Lessons and assessments are generated with AI and, for Seerah, reviewed by the
          masjid&apos;s scholars. They may contain errors; the operator and volunteers are
          expected to review them.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>
        You agree to the <a href="/acceptable-use">Acceptable Use Policy</a>. In short: use
        Suffa for its purpose, don&apos;t attempt to access other families&apos; data,
        don&apos;t upload unlawful or harmful content, and don&apos;t misuse the AI
        features.
      </p>

      <h2>Fees</h2>
      <p>
        Where the operator charges a flat family fee, it is disclosed before you enrol. The
        service is sustained by a community endowment (waqf) and donations; there is no
        per-lesson or per-seat charge. Scholarships cover the fee for families who cannot
        pay it.
      </p>

      <h2>Availability, changes, termination</h2>
      <ul>
        <li>Suffa is provided &ldquo;as is&rdquo; during the pilot. The operator may change
          or suspend features.</li>
        <li>You may stop using Suffa at any time and request deletion of your data (see the
          Privacy Policy). The operator may suspend an account that violates these terms or
          the Acceptable Use Policy.</li>
        <li>Material changes to these terms will be notified in the app; continued use after
          the effective date means you accept them.</li>
      </ul>

      <h2>Liability</h2>
      <p>
        To the extent permitted by Quebec law, the operator is not liable for indirect or
        consequential loss arising from use of the pilot service. Nothing here limits
        liability that cannot be limited by law. (verify with counsel)</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of Quebec and Canada. (verify with counsel)</p>

      <h2>Contact</h2>
      <p>Questions about these terms: your masjid administrator, or the operator&apos;s
        privacy contact listed in the <a href="/privacy">Privacy Policy</a>.</p>
    </LegalDoc>
  );
}
