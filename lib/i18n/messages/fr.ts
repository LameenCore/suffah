// French (Quebec) message catalogue (T59). Must mirror every key in en.ts.

import type { Messages } from "./en";

export const fr: Messages = {
  common: {
    signIn: "Se connecter",
    signOut: "Se déconnecter",
    getHelp: "Obtenir de l'aide et signaler un bogue",
    back: "Retour",
    language: "Langue",
    switchAccount: "changer",
    loading: "Chargement...",
    menu: "Menu",
    close: "Fermer",
  },

  nav: {
    myCourses: "Mes cours",
    review: "Révision",
    thisWeek: "Cette semaine",
    evaluationStatus: "État de l'évaluation",
    consent: "Consentement",
    yourData: "Vos données",
    overview: "Aperçu",
    pods: "Groupes et affectation",
    volunteers: "Bénévoles",
    continuity: "Empreinte de continuité",
    handoff: "Simulation de relève",
    compliance: "Conformité",
    ledger: "Registre du waqf",
    aiSpend: "Dépenses IA",
    seerah: "Atelier Sîra",
    skillTree: "Arbre de compétences",
    audit: "Journal d'audit",
    analytics: "Analytique de l'apprentissage",
    helpRequests: "Demandes d'aide",
  },

  roleLabel: {
    admin: "Admin de la mosquée",
    parent: "Famille",
    student: "Aire d'apprentissage",
  },

  landing: {
    brand: "Suffa",
    familySignup: "Inscription des familles",
    kicker: "Groupes d'enseignement à domicile communautaires · Québec",
    heroTitle: "Un apprentissage qui ne s'arrête pas quand un bénévole s'en va",
    heroBody:
      "Suffa réunit les enfants en petits groupes et laisse une aire d'apprentissage autonome assurer l'enseignement, en continu. Les bénévoles de la communauté ajoutent l'enrichissement et la socialisation en personne. La mosquée gère les groupes et constitue le dossier de conformité. Financé par un fonds de dotation communautaire - gratuit pour les familles.",
    exploreDemo: "Explorer la démo",
    demoNote: "La démo vous connecte comme famille, élève ou admin de mosquée - aucune donnée réelle.",
    nameBody:
      "Les Ashab al-Suffa - les « Gens de la Plateforme » - étaient des compagnons qui vivaient à la mosquée de Médine et que la communauté soutenait pour qu'ils puissent se consacrer pleinement à l'apprentissage. Le modèle de financement de Suffa s'en inspire : un fonds de dotation waqf permanent, des frais familiaux fixes modestes et des bourses financées par la sadaqah - pas de frais de scolarité.",
    problemTitle: "Pourquoi les groupes s'effondrent d'habitude",
    problemBody:
      "Les groupes d'enseignement à domicile animés par des bénévoles dépendent entièrement de leurs bénévoles. Quand l'un d'eux part - un déménagement, un nouvel emploi, un bébé - les enfants perdent l'élan, le contexte et souvent une matière entière. Suffa est conçu pour que le programme soit la constante et le bénévole, l'enrichissement, et non l'inverse.",
    howTitle: "Comment fonctionne Suffa",
    step1Title: "Le logiciel porte le programme",
    step1Body:
      "Les leçons, points de contrôle et évaluations sont offerts par une aire d'apprentissage autonome, un cours à la fois. Un groupe progresse dans la matière qu'un bénévole soit présent cette semaine ou non.",
    step2Title: "Les bénévoles ajoutent l'enrichissement en personne",
    step2Body:
      "Les bénévoles de la communauté animent les discussions, les projets et la socialisation - ce que les gens font le mieux. Quand l'un s'en va, le suivant reçoit un compte rendu de la position du groupe et de sa façon d'apprendre, pas une page blanche.",
    step3Title: "La mosquée s'occupe du reste",
    step3Body:
      "Affectation des groupes (plafonnée à quatre, conformément au seuil d'enseignement à domicile du Québec), accueil des bénévoles et dossier de progression constitué à partir de résultats réels pour le dépôt de chaque famille.",
    viewsTitle: "Une plateforme, trois vues",
    viewStudents: "Élèves",
    viewStudentsBody:
      "Une aire d'apprentissage sereine : parcours, leçons et trois niveaux d'évaluation par cours, à leur rythme.",
    viewFamilies: "Familles",
    viewFamiliesBody:
      "Une vue en lecture seule des progrès de chaque enfant, l'état de l'évaluation du trimestre sans surprises et l'horaire du groupe.",
    viewAdmins: "Admins de mosquée",
    viewAdminsBody:
      "Les groupes et les bénévoles, le dossier de conformité et un registre transparent du waqf et des dons.",
    forFamiliesTitle: "Pour les familles",
    forFamiliesBody:
      "Suffa fonctionne par l'entremise de votre mosquée. Demandez au coordonnateur de l'éducation de votre mosquée si un groupe se forme, ou créez un compte familial pour voir comment ça marche. L'aire d'apprentissage de votre enfant reste verrouillée jusqu'à ce que vous complétiez une brève étape de consentement.",
    createFamilyAccount: "créez un compte familial",
    forMasjidsTitle: "Pour les mosquées",
    forMasjidsBody:
      "Si votre communauté souhaite gérer des groupes sur Suffa, écrivez à {email}. Vous administrez vos propres groupes, bénévoles et dossiers de conformité.",
    footerTerms: "Conditions",
    footerPrivacy: "Confidentialité",
    footerAup: "Utilisation acceptable",
    footerDisclaimer:
      "Les seuils d'exemption, formats d'évaluation et exigences de conformité affichés dans Suffa sont fournis à titre indicatif et doivent être vérifiés par rapport à la réglementation québécoise en vigueur sur l'enseignement à domicile. Suffa organise les preuves d'apprentissage; elle ne fait pas de dépôt auprès du ministère de l'Éducation au nom d'une famille.",
    footerTagline: "Suffa - enseignement à domicile communautaire soutenu par le waqf.",
  },

  student: {
    greeting: "As-salamu alaykum",
    welcomeBack: "Bon retour, {name}",
    inPod: "Tu apprends avec {pod}. Fais une leçon à ton rythme, puis un court point de contrôle avant que le parcours s'ouvre.",
    noPod: "Tu n'es pas encore dans un groupe. Demande à l'admin de la mosquée de t'en assigner un.",
    lessonsFinished: "{count} leçons terminées",
    checkpointsPassed: "{count} points de contrôle réussis",
    yourCourses: "Tes cours",
    coursePath: {
      notAssigned: "Non assigné",
      review: "Revoir cette leçon",
      takeCheckpoint: "Faire le point de contrôle",
      continueLesson: "Continuer la leçon",
      startLesson: "Commencer la leçon",
      stateDone: "Terminé",
      stateQuiz: "Quiz",
      stateReady: "Prêt",
      step: "Étape {n} sur {total}",
      noPath: "Pas encore de parcours",
      askPlacement: "Demande à la mosquée d'inscrire ton groupe à ce cours.",
    },
    consistencyTitle: "Régularité",
    consistencyEmpty: "Un peu chaque jour vaut mieux que beaucoup de temps en temps. Le premier jour compte.",
    consistencyYou: "Tu t'es présenté {days} la semaine dernière",
    consistencyThey: "Il ou elle s'est présenté {days} la semaine dernière",
    consistencyMonth: ", {days} ce mois-ci.",
    day: "jour",
    days: "jours",
    consistencyWindow: "28 derniers jours.",
    consistencyPrivateYou: "C'est seulement pour toi - ce n'est jamais comparé à quelqu'un d'autre.",
    consistencyPrivateFamily:
      "C'est seulement pour votre famille - ce n'est jamais comparé à quelqu'un d'autre.",
    nextStep: "Fais ceci ensuite",
    reviewReady: "La révision est prête",
    reviewReadyBody: "{count} questions rapides tirées de leçons déjà réussies.",
    startReview: "Commencer la révision",
    regulationNote:
      "Les formats d'évaluation et l'équivalence d'examen affichés ici sont pour la démo et doivent être vérifiés par rapport aux exigences d'évaluation québécoises en vigueur.",
  },

  auth: {
    signInTitle: "Se connecter",
    tagline:
      "Des groupes d'enseignement à domicile communautaires où le logiciel porte le programme, pour que l'apprentissage ne s'arrête pas quand un bénévole s'en va.",
    email: "Courriel",
    password: "Mot de passe",
    newHere: "Nouveau ici?",
    createAccount: "Créer un compte",
    tryDemo: "Essayer la démo",
    demoAccountsNote:
      "Ou connectez-vous avec les comptes de démonstration : admin@suffa.demo / parent@suffa.demo / student@suffa.demo.",
    roleAdmin: "admin",
    roleFamily: "famille",
    roleStudent: "élève",
    signUpTitle: "Créer un compte",
    name: "Nom",
    passwordMin: "Au moins 8 caractères.",
    role: "Je suis…",
    roleParentOpt: "Parent / tuteur",
    roleStudentOpt: "Élève",
    roleAdminOpt: "Admin de mosquée",
    signUpNote:
      "Démo : chaque compte rejoint la mosquée de démonstration. En production, un parent crée le compte de l'enfant et le consentement le verrouille.",
    haveAccount: "Vous avez déjà un compte?",
    createAccountCta: "Créer le compte",
    agreeIntro: "En créant un compte, vous acceptez les",
    agreeAnd: "et la",
  },

  footer: {
    terms: "Conditions",
    privacy: "Confidentialité",
    acceptableUse: "Utilisation acceptable",
  },

  admin: {
    overviewKicker: "Mosquée As-Suffa",
    overviewTitle: "Aperçu",
    overviewLede: "Tout ce que la mosquée gère et comment se porte la communauté ce trimestre.",
  },

  parent: {
    greeting: "As-salamu alaykum",
    lede: "Une vue sereine, en lecture seule, des progrès de votre enfant. Les résultats apparaissent ici dès qu'ils sont terminés.",
    fullEvaluation: "État complet de l'évaluation",
    transcriptPrintable: "Relevé de fin de trimestre (imprimable)",
    downloadCsv: "Télécharger en CSV",
  },
};
