import { LegalDoc } from "@/components/LegalDoc";
import { getT } from "@/lib/i18n";

export const metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const { locale, t } = await getT();
  return (
    <LegalDoc title={t("legal.termsTitle")}>
      {locale === "fr" ? <TermsFr /> : <TermsEn />}
    </LegalDoc>
  );
}

function TermsEn() {
  return (
    <>
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
    </>
  );
}

function TermsFr() {
  return (
    <>
      <p>
        Suffa est une plateforme qui aide les familles musulmanes du Québec à faire
        fonctionner des groupes d&apos;enseignement à la maison communautaires : le
        logiciel offre le programme et l&apos;évaluation, des bénévoles de la communauté
        animent l&apos;enrichissement en personne, et la mosquée administre les groupes et
        les dossiers de conformité. Elle est exploitée par une mosquée ou un organisme
        communautaire (« l&apos;exploitant »), et non par une entreprise à but lucratif.
      </p>

      <h2>Qui peut utiliser Suffa</h2>
      <ul>
        <li>Un <strong>parent ou tuteur légal</strong> peut créer un compte et y rattacher
          un enfant. Un compte enfant n&apos;est activé qu&apos;une fois le consentement du
          tuteur au dossier (voir la <a href="/privacy">politique de confidentialité</a>).</li>
        <li>Un <strong>élève</strong> utilise le parcours d&apos;apprentissage sous le
          compte et le consentement de son tuteur.</li>
        <li>Un <strong>bénévole</strong> et un <strong>administrateur de mosquée</strong>
          sont ajoutés par l&apos;exploitant.</li>
        <li>Vous devez fournir des renseignements exacts et garder votre mot de passe
          confidentiel.</li>
      </ul>

      <h2>Ce que Suffa est et n&apos;est pas</h2>
      <ul>
        <li>Suffa organise les preuves de l&apos;apprentissage d&apos;un enfant.
          <strong> Elle ne dépose rien auprès du ministère de l&apos;Éducation en votre
          nom</strong> et ne remplace pas les obligations légales du parent en matière
          d&apos;enseignement à la maison, y compris les épreuves ministérielles. Le parent
          demeure responsable de chaque dépôt. (à valider avec un conseiller juridique)</li>
        <li>Le statut de conformité affiché dans l&apos;application est un outil interne
          d&apos;alerte précoce. Ses seuils sont donnés à titre indicatif et doivent être
          confirmés auprès de la réglementation québécoise en vigueur avant qu&apos;on
          s&apos;y fie. (à valider avec un conseiller juridique)</li>
        <li>Les leçons et les évaluations sont générées par IA et, pour la Sīra, révisées
          par les savants de la mosquée. Elles peuvent contenir des erreurs ;
          l&apos;exploitant et les bénévoles sont censés les réviser.</li>
      </ul>

      <h2>Utilisation acceptable</h2>
      <p>
        Vous acceptez la <a href="/acceptable-use">politique d&apos;utilisation
        acceptable</a>. En bref : utilisez Suffa pour sa finalité, n&apos;essayez pas
        d&apos;accéder aux données d&apos;autres familles, ne téléversez pas de contenu
        illégal ou nuisible, et ne détournez pas les fonctions d&apos;IA.
      </p>

      <h2>Frais</h2>
      <p>
        Lorsque l&apos;exploitant demande des frais familiaux forfaitaires, ceux-ci sont
        divulgués avant l&apos;inscription. Le service est soutenu par un fonds de dotation
        communautaire (waqf) et des dons ; il n&apos;y a pas de frais par leçon ni par
        place. Des bourses couvrent les frais des familles qui ne peuvent les payer.
      </p>

      <h2>Disponibilité, modifications, résiliation</h2>
      <ul>
        <li>Suffa est fourni « tel quel » pendant le projet pilote. L&apos;exploitant peut
          modifier ou suspendre des fonctions.</li>
        <li>Vous pouvez cesser d&apos;utiliser Suffa à tout moment et demander la
          suppression de vos données (voir la politique de confidentialité).
          L&apos;exploitant peut suspendre un compte qui enfreint ces conditions ou la
          politique d&apos;utilisation acceptable.</li>
        <li>Les modifications importantes de ces conditions seront signalées dans
          l&apos;application ; toute utilisation continue après la date d&apos;entrée en
          vigueur vaut acceptation.</li>
      </ul>

      <h2>Responsabilité</h2>
      <p>
        Dans la mesure permise par le droit québécois, l&apos;exploitant n&apos;est pas
        responsable des pertes indirectes ou consécutives découlant de l&apos;utilisation
        du service pilote. Rien ici ne limite une responsabilité qui ne peut être limitée
        par la loi. (à valider avec un conseiller juridique)</p>

      <h2>Droit applicable</h2>
      <p>Ces conditions sont régies par les lois du Québec et du Canada. (à valider avec un
        conseiller juridique)</p>

      <h2>Contact</h2>
      <p>Questions au sujet de ces conditions : l&apos;administrateur de votre mosquée, ou
        la personne-ressource en matière de confidentialité de l&apos;exploitant indiquée
        dans la <a href="/privacy">politique de confidentialité</a>.</p>
    </>
  );
}
