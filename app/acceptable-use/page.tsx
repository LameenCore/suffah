import { LegalDoc } from "@/components/LegalDoc";
import { getT } from "@/lib/i18n";

export const metadata = { title: "Acceptable Use" };

export default async function AcceptableUsePage() {
  const { locale, t } = await getT();
  return (
    <LegalDoc title={t("legal.acceptableUseTitle")}>
      {locale === "fr" ? <AcceptableUseFr /> : <AcceptableUseEn />}
    </LegalDoc>
  );
}

function AcceptableUseEn() {
  return (
    <>
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
    </>
  );
}

function AcceptableUseFr() {
  return (
    <>
      <p>
        Suffa est utilisé par des enfants, leurs familles, des bénévoles de la communauté
        et le personnel de la mosquée. Cette politique en fait un lieu d&apos;apprentissage
        sûr. Elle s&apos;applique à toute personne titulaire d&apos;un compte et fait
        partie des <a href="/terms">conditions d&apos;utilisation</a>.
      </p>

      <h2>Utilisez Suffa pour sa finalité</h2>
      <ul>
        <li>Offrir et suivre le programme, consigner la progression, animer
          l&apos;enrichissement des groupes, et administrer les groupes et les dossiers de
          conformité.</li>
        <li>Pas pour la publicité, la sollicitation, la collecte de fonds en dehors du
          modèle communautaire, ni la collecte des renseignements d&apos;autres membres.</li>
      </ul>

      <h2>Respectez la vie privée des autres familles</h2>
      <ul>
        <li>N&apos;essayez pas d&apos;accéder à des données appartenant à un enfant, une
          famille, un groupe ou une mosquée qui ne sont pas les vôtres — y compris en
          devinant des URL ou des identifiants, ou en sondant l&apos;API.</li>
        <li>Signalez à l&apos;administrateur de votre mosquée tout accès obtenu par erreur
          et ne partagez pas ce que vous avez vu.</li>
        <li>N&apos;exportez ni ne redistribuez les dossiers de progression d&apos;autrui.</li>
      </ul>

      <h2>Gardez le contenu licite et approprié</h2>
      <ul>
        <li>Ne soumettez pas de contenu illicite, haineux, harcelant, sexuel, violent ou
          autrement inapproprié pour un espace d&apos;apprentissage destiné aux enfants.</li>
        <li>Les notes de bénévoles au sujet d&apos;un enfant doivent être factuelles,
          respectueuses et pertinentes pour l&apos;apprentissage et le bien-être.</li>
      </ul>

      <h2>Utilisez les leçons générées de façon responsable</h2>
      <ul>
        <li>Les leçons, points de contrôle et évaluations sont générés par machine.
          Traitez-les comme un point de départ : un bénévole ou un parent devrait les
          réviser, et les erreurs devraient être signalées afin que le contenu puisse être
          corrigé.</li>
        <li>N&apos;utilisez pas de requêtes ou de réponses pour tenter de faire produire au
          système du contenu hors programme, d&apos;extraire les données d&apos;un autre
          utilisateur ou de révéler le fonctionnement interne du système.</li>
        <li>N&apos;automatisez ni ne scriptez un grand nombre de requêtes de génération.
          L&apos;économie du modèle repose sur un contenu généré une seule fois par
          unité.</li>
      </ul>

      <h2>Protégez votre compte</h2>
      <ul>
        <li>Un compte par personne. Gardez votre mot de passe confidentiel. Le compte
          d&apos;un tuteur est destiné à ce tuteur ; un enfant utilise le parcours sous le
          consentement de ce tuteur.</li>
        <li>Prévenez rapidement l&apos;administrateur de votre mosquée si vous pensez
          qu&apos;un compte a été compromis.</li>
      </ul>

      <h2>N&apos;attaquez pas le service</h2>
      <ul>
        <li>Aucune tentative de perturber, de surcharger, de faire de l&apos;ingénierie
          inverse à des fins d&apos;abus, ou de contourner les contrôles d&apos;accès, les
          limites de débit ou l&apos;isolation entre locataires.</li>
        <li>La recherche en sécurité est la bienvenue — communiquez d&apos;abord avec
          l&apos;administrateur de la mosquée et laissez-nous un délai raisonnable pour
          corriger un problème avant de le divulguer.</li>
      </ul>

      <h2>En cas de non-respect de cette politique</h2>
      <p>
        L&apos;exploitant peut avertir un compte, le suspendre ou le fermer, et peut
        retirer du contenu. Les cas graves (protection de l&apos;enfance, contenu illicite)
        sont transmis à la direction de la mosquée et, au besoin, aux autorités.
      </p>
    </>
  );
}
