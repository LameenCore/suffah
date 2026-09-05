import { LegalDoc } from "@/components/LegalDoc";

export const metadata = { title: "Privacy Policy — Suffa" };

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy" updated="September 2026">
      <p>
        Suffa handles personal information about children and their guardians. In Quebec
        this is governed by the <em>Act respecting the protection of personal information
        in the private sector</em> as modernised by Law 25. This policy describes what we
        collect, why, where it lives, and your rights. The technical detail is in the
        project&apos;s <code>docs/data-map.md</code>. (verify with counsel)
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account</strong>: name, email, role, and a password (stored hashed by
          Supabase Auth).</li>
        <li><strong>Family link</strong>: which guardian is linked to which child.</li>
        <li><strong>Learning</strong>: which pod and course a child is in, and their
          checkpoint / unit-assessment / term-exam results and lesson progress.</li>
        <li><strong>Community</strong>: short volunteer observations about a pod or child
          (attendance, cooperation, reflection, adab) and session notes.</li>
        <li><strong>Consent records</strong>: what a guardian consented to, and when.</li>
        <li>We deliberately do <strong>not</strong> collect address, phone number, date of
          birth, or any health information.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To deliver the curriculum and record progress.</li>
        <li>To assemble the progress/evaluation record a family needs for Quebec home
          instruction — the family, not Suffa, files it.</li>
        <li>To brief an incoming volunteer when one leaves (the &ldquo;continuity&rdquo;
          feature).</li>
        <li>We do <strong>not</strong> sell personal information, do not use it for
          advertising, and run <strong>no third-party analytics or trackers</strong>.</li>
      </ul>

      <h2>Where it lives and who processes it</h2>
      <ul>
        <li><strong>Database &amp; auth</strong>: Supabase (PostgreSQL). During the pilot
          the project runs in a US region; moving it to a Canadian region
          (<code>ca-central-1</code>) is a required pre-launch step. (verify with counsel)</li>
        <li><strong>AI generation</strong>: Anthropic (Claude) in the United States. Most
          calls send only course/lesson text. One call — the volunteer handoff briefing —
          currently sends a child&apos;s first name and progress signals; before a real
          launch this is pseudonymised and covered by a privacy impact assessment.</li>
        <li><strong>Hosting</strong>: Vercel.</li>
        <li>No email provider is connected yet; when one is, it will be listed here.</li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        Account and learning data are kept while the family is enrolled and for a limited
        period after (to be set with the operator — a common choice is one school year past
        the last activity), then deleted or anonymised. Volunteer session notes that can
        name a child are kept for a shorter window. Consent records are kept as long as
        legally required. (verify with counsel)
      </p>

      <h2>Your rights</h2>
      <ul>
        <li><strong>Access</strong> — request a copy of the personal information Suffa holds
          about you and your child.</li>
        <li><strong>Rectification</strong> — ask us to correct inaccurate information.</li>
        <li><strong>Withdrawal of consent</strong> — withdraw consent to AI-assisted
          instruction or to compliance-record assembly; we will explain the effect (some
          features stop working) and, where withdrawal makes the service unusable, help you
          close the account.</li>
        <li><strong>Erasure</strong> — request deletion of your data. We will delete it
          except where a law requires us to keep a record.</li>
        <li><strong>Portability</strong> — request your child&apos;s learning record in a
          machine-readable format.</li>
      </ul>
      <p>
        To exercise a right, contact your masjid administrator or the privacy officer
        below. We respond within the timeframe Law 25 requires.
      </p>

      <h2>Consent for children</h2>
      <p>
        A child account is not activated until a guardian has given explicit, versioned
        consent covering: the curriculum, AI-assisted instruction, results being used to
        assemble a compliance record, and the data-retention period. If we materially
        change what we do, we ask again.
      </p>

      <h2>Security</h2>
      <p>
        Access is role-scoped and tenant-isolated: a family can only see its own child; a
        masjid&apos;s data is separated from every other masjid&apos;s. Passwords are
        hashed. Database point-in-time backups are in place. Known gaps (e.g. adding
        database-level row security) are tracked and being closed.
      </p>

      <h2>Breach response</h2>
      <p>
        If a confidentiality incident poses a risk of serious injury, we will notify the
        <em> Commission d&apos;accès à l&apos;information</em> and affected people without
        delay, keep a register of incidents, and take reasonable steps to reduce the risk
        and prevent recurrence. (verify with counsel)
      </p>

      <h2>Privacy officer</h2>
      <p>
        The person responsible for the protection of personal information is the operator&apos;s
        designated privacy officer. <em>[Name and contact email to be filled in by the
        operating masjid before launch.]</em>
      </p>
    </LegalDoc>
  );
}
