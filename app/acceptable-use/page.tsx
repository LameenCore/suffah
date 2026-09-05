import { LegalDoc } from "@/components/LegalDoc";

export const metadata = { title: "Acceptable Use — Suffa" };

export default function AcceptableUsePage() {
  return (
    <LegalDoc title="Acceptable Use Policy" updated="September 2026">
      <p>
        Suffa is used by children, their families, community volunteers, and masjid
        staff. This policy keeps it a safe place to learn. It applies to everyone with an
        account and forms part of the <a href="/terms">Terms of Service</a>.
      </p>

      <h2>Use Suffa for what it is for</h2>
      <ul>
        <li>Delivering and following the curriculum, recording progress, running pod
          enrichment, and administering pods and compliance records.</li>
        <li>Not for advertising, solicitation, fundraising outside the community model, or
          collecting other members&apos; information.</li>
      </ul>

      <h2>Respect other families&apos; privacy</h2>
      <ul>
        <li>Do not try to access data belonging to a child, family, pod, or masjid that is
          not yours — including by guessing URLs or identifiers, or by probing the API.</li>
        <li>Report any access you get by mistake to your masjid administrator and do not
          share what you saw.</li>
        <li>Do not export or redistribute another person&apos;s progress records.</li>
      </ul>

      <h2>Keep content lawful and appropriate</h2>
      <ul>
        <li>Do not submit content that is unlawful, hateful, harassing, sexual, violent, or
          otherwise inappropriate for a children&apos;s learning space.</li>
        <li>Volunteer notes about a child must be factual, respectful, and relevant to
          learning and wellbeing.</li>
      </ul>

      <h2>Use the generated lessons responsibly</h2>
      <ul>
        <li>Lessons, checkpoints, and assessments are machine-generated. Treat them as a
          starting point: a volunteer or parent should review them, and errors should be
          reported so the content can be corrected.</li>
        <li>Do not use prompts or answers to try to make the system produce content outside
          the curriculum, extract another user&apos;s data, or reveal system internals.</li>
        <li>Do not automate or script large numbers of generation requests. The economics of
          the model depend on content being generated once per unit.</li>
      </ul>

      <h2>Protect your account</h2>
      <ul>
        <li>One account per person. Keep your password private. A guardian&apos;s account is
          for that guardian; a child uses the playground under that guardian&apos;s consent.</li>
        <li>Tell your masjid administrator promptly if you think an account has been
          compromised.</li>
      </ul>

      <h2>Do not attack the service</h2>
      <ul>
        <li>No attempts to disrupt, overload, reverse-engineer for abuse, or circumvent
          access controls, rate limits, or tenant isolation.</li>
        <li>Security research is welcome — contact the masjid administrator first and give
          us reasonable time to fix an issue before disclosing it.</li>
      </ul>

      <h2>If this policy is broken</h2>
      <p>
        The operator may warn, suspend, or close an account, and may remove content. Serious
        cases (safeguarding, unlawful content) are escalated to the masjid leadership and,
        where required, to the authorities.
      </p>
    </LegalDoc>
  );
}
