import { LegalDoc } from "@/components/LegalDoc";
import { getT } from "@/lib/i18n";

export const metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const { locale, t } = await getT();
  return (
    <LegalDoc title={t("legal.privacyTitle")}>
      {locale === "fr" ? <PrivacyFr /> : <PrivacyEn />}
    </LegalDoc>
  );
}

function PrivacyEn() {
  return (
    <>
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
    </>
  );
}

function PrivacyFr() {
  return (
    <>
      <p>
        Suffa traite des renseignements personnels concernant des enfants et leurs tuteurs.
        Au Québec, cela est encadré par la <em>Loi sur la protection des renseignements
        personnels dans le secteur privé</em>, telle que modernisée par la Loi 25. Cette
        politique décrit ce que nous recueillons, pourquoi, où cela se trouve et quels sont
        vos droits. Le détail technique se trouve dans le fichier
        <code> docs/data-map.md</code> du projet. (à valider avec un conseiller juridique)
      </p>

      <h2>Ce que nous recueillons</h2>
      <ul>
        <li><strong>Compte</strong> : nom, courriel, rôle et un mot de passe (stocké haché
          par Supabase Auth).</li>
        <li><strong>Lien familial</strong> : quel tuteur est rattaché à quel enfant.</li>
        <li><strong>Apprentissage</strong> : dans quel groupe et quel cours se trouve un
          enfant, ainsi que ses résultats aux points de contrôle / évaluations d&apos;unité
          / examens de fin de trimestre et sa progression dans les leçons.</li>
        <li><strong>Communauté</strong> : de courtes observations de bénévoles sur un groupe
          ou un enfant (présence, coopération, réflexion, adab) et des notes de séance.</li>
        <li><strong>Enregistrements de consentement</strong> : ce à quoi un tuteur a
          consenti, et quand.</li>
        <li>Nous ne recueillons délibérément <strong>pas</strong> d&apos;adresse, de numéro
          de téléphone, de date de naissance ni aucun renseignement de santé.</li>
      </ul>

      <h2>Pourquoi nous l&apos;utilisons</h2>
      <ul>
        <li>Pour offrir le programme et consigner la progression.</li>
        <li>Pour constituer le dossier de progression / d&apos;évaluation dont une famille a
          besoin pour l&apos;enseignement à la maison au Québec — c&apos;est la famille, et
          non Suffa, qui le dépose.</li>
        <li>Pour informer un bénévole entrant lorsqu&apos;un autre s&apos;en va (la fonction
          de « continuité »).</li>
        <li>Nous ne vendons <strong>pas</strong> de renseignements personnels, ne les
          utilisons pas à des fins publicitaires et n&apos;exécutons <strong>aucun outil
          d&apos;analyse ni traceur tiers</strong>.</li>
      </ul>

      <h2>Où cela se trouve et qui le traite</h2>
      <ul>
        <li><strong>Base de données et authentification</strong> : Supabase (PostgreSQL).
          Pendant le projet pilote, le projet s&apos;exécute dans une région des
          États-Unis ; son déplacement vers une région canadienne
          (<code>ca-central-1</code>) est une étape requise avant le lancement. (à valider
          avec un conseiller juridique)</li>
        <li><strong>Génération par IA</strong> : Anthropic (Claude), aux États-Unis. La
          plupart des appels n&apos;envoient que du texte de cours ou de leçon. Un appel —
          le briefing de transfert au bénévole — envoie actuellement le prénom d&apos;un
          enfant et des indicateurs de progression ; avant un véritable lancement, cela est
          pseudonymisé et couvert par une évaluation des facteurs relatifs à la vie
          privée.</li>
        <li><strong>Hébergement</strong> : Vercel.</li>
        <li>Aucun fournisseur de courriel n&apos;est encore connecté ; lorsqu&apos;il y en
          aura un, il sera indiqué ici.</li>
      </ul>

      <h2>Combien de temps nous le conservons</h2>
      <p>
        Les données de compte et d&apos;apprentissage sont conservées pendant que la
        famille est inscrite et pour une période limitée par la suite (à fixer avec
        l&apos;exploitant — un choix courant est une année scolaire après la dernière
        activité), puis supprimées ou anonymisées. Les notes de séance de bénévoles qui
        peuvent nommer un enfant sont conservées moins longtemps. Les enregistrements de
        consentement sont conservés aussi longtemps que la loi l&apos;exige. (à valider avec
        un conseiller juridique)
      </p>

      <h2>Vos droits</h2>
      <ul>
        <li><strong>Accès</strong> — demander une copie des renseignements personnels que
          Suffa détient sur vous et votre enfant.</li>
        <li><strong>Rectification</strong> — nous demander de corriger des renseignements
          inexacts.</li>
        <li><strong>Retrait du consentement</strong> — retirer le consentement à
          l&apos;instruction assistée par IA ou à la constitution du dossier de conformité ;
          nous vous en expliquerons l&apos;effet (certaines fonctions cessent de
          fonctionner) et, lorsque le retrait rend le service inutilisable, nous vous
          aiderons à fermer le compte.</li>
        <li><strong>Suppression</strong> — demander la suppression de vos données. Nous les
          supprimerons, sauf lorsqu&apos;une loi nous oblige à en conserver une trace.</li>
        <li><strong>Portabilité</strong> — demander le dossier d&apos;apprentissage de votre
          enfant dans un format lisible par machine.</li>
      </ul>
      <p>
        Pour exercer un droit, communiquez avec l&apos;administrateur de votre mosquée ou
        avec le responsable de la protection des renseignements personnels ci-dessous. Nous
        répondons dans le délai qu&apos;exige la Loi 25.
      </p>

      <h2>Consentement pour les enfants</h2>
      <p>
        Un compte enfant n&apos;est pas activé tant qu&apos;un tuteur n&apos;a pas donné un
        consentement explicite et versionné portant sur : le programme, l&apos;instruction
        assistée par IA, l&apos;utilisation des résultats pour constituer un dossier de
        conformité, et la période de conservation des données. Si nous modifions
        substantiellement nos pratiques, nous le redemandons.
      </p>

      <h2>Sécurité</h2>
      <p>
        L&apos;accès est limité par rôle et isolé par locataire : une famille ne peut voir
        que son propre enfant ; les données d&apos;une mosquée sont séparées de celles de
        toute autre mosquée. Les mots de passe sont hachés. Des sauvegardes de base de
        données à un instant précis sont en place. Les lacunes connues (p. ex. l&apos;ajout
        d&apos;une sécurité au niveau des lignes de la base de données) sont suivies et en
        voie d&apos;être corrigées.
      </p>

      <h2>Réponse aux atteintes</h2>
      <p>
        Si un incident de confidentialité présente un risque de préjudice sérieux, nous
        aviserons sans délai la <em>Commission d&apos;accès à l&apos;information</em> et les
        personnes concernées, tiendrons un registre des incidents et prendrons des mesures
        raisonnables pour réduire le risque et prévenir toute récurrence. (à valider avec un
        conseiller juridique)
      </p>

      <h2>Responsable de la protection des renseignements personnels</h2>
      <p>
        La personne responsable de la protection des renseignements personnels est le
        responsable désigné par l&apos;exploitant. <em>[Nom et courriel à remplir par la
        mosquée exploitante avant le lancement.]</em>
      </p>
    </>
  );
}
