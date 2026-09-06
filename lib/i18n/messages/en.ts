// English message catalogue (T59). Keys are dotted; keep this file and fr.ts in
// lockstep - `npm run check:i18n` (scripts/check-i18n.ts) fails on a missing key.

export const en = {
  common: {
    signIn: "Sign in",
    signOut: "Sign out",
    getHelp: "Get help & report a bug",
    back: "Back",
    language: "Language",
    switchAccount: "switch",
    loading: "Loading...",
    menu: "Menu",
    close: "Close",
  },

  nav: {
    // student
    myCourses: "My courses",
    review: "Review",
    // parent
    thisWeek: "This week",
    evaluationStatus: "Evaluation status",
    consent: "Consent",
    yourData: "Your data",
    // admin
    overview: "Overview",
    pods: "Pods & assignment",
    volunteers: "Volunteers",
    continuity: "Continuity Fingerprint",
    handoff: "Handoff simulation",
    compliance: "Compliance",
    ledger: "Waqf ledger",
    aiSpend: "AI spend",
    seerah: "Seerah studio",
    skillTree: "Skill tree",
    audit: "Audit trail",
    analytics: "Learning analytics",
    helpRequests: "Help requests",
  },

  roleLabel: {
    admin: "Masjid Admin",
    parent: "Family",
    student: "Playground",
  },

  landing: {
    brand: "Suffa",
    familySignup: "Family sign-up",
    kicker: "Community homeschool pods · Quebec",
    heroTitle: "Learning that doesn't stop when a volunteer moves on",
    heroBody:
      "Suffa places children in small pods and lets a self-paced curriculum playground do the teaching, continuously. Community volunteers add live enrichment and socialisation. The masjid administers pods and assembles the compliance record. Sustained by a community endowment - free to families.",
    exploreDemo: "Explore the demo",
    demoNote: "The demo signs you in as a family, student, or masjid admin - no real data.",
    nameBody:
      "Ashab al-Suffa - the \"People of the Platform\" - were companions who lived at the mosque in Medina and were sustained by the community so they could devote themselves fully to learning. Suffa's funding model mirrors that: a permanent waqf endowment, a small flat family fee, and sadaqah-funded scholarships - not tuition.",
    problemTitle: "Why pods usually break",
    problemBody:
      "Volunteer-run homeschool groups live and die by their volunteers. When one leaves - a move, a new job, a baby - the children they taught lose momentum, context, and often a whole subject. Suffa is built so the curriculum is the constant and the volunteer is the enrichment, not the other way round.",
    howTitle: "How Suffa works",
    step1Title: "The software carries the curriculum",
    step1Body:
      "Lessons, checkpoints and assessments are delivered through a self-paced playground, one course at a time. A pod keeps moving through the material whether or not a volunteer is in the room this week.",
    step2Title: "Volunteers add live enrichment",
    step2Body:
      "Community volunteers run discussion, projects and socialisation - the part people are best at. When one moves on, the next gets a briefing of where the pod is and how it learns, not a blank slate.",
    step3Title: "The masjid handles the rest",
    step3Body:
      "Pod assignment (capped at four, matching Quebec's home-instruction threshold), volunteer onboarding, and a progress record assembled from real results for each family's filing.",
    viewsTitle: "One platform, three views",
    viewStudents: "Students",
    viewStudentsBody:
      "A calm playground: pathways, lessons, and three tiers of assessment per course, at their own pace.",
    viewFamilies: "Families",
    viewFamiliesBody:
      "A read-only view of how each child is doing, term evaluation status with no surprises, and pod schedule.",
    viewAdmins: "Masjid admins",
    viewAdminsBody:
      "Pods and volunteers, the compliance record, and a transparent waqf and donation ledger.",
    forFamiliesTitle: "For families",
    forFamiliesBody:
      "Suffa runs through your masjid. Ask your masjid's education coordinator whether a pod is forming, or create a family account to see how it works. Your child's playground stays locked until you complete a short consent step.",
    createFamilyAccount: "create a family account",
    forMasjidsTitle: "For masjids",
    forMasjidsBody:
      "If your community wants to run pods on Suffa, reach out at {email}. You administer your own pods, volunteers, and compliance records.",
    footerTerms: "Terms",
    footerPrivacy: "Privacy",
    footerAup: "Acceptable use",
    footerDisclaimer:
      "Exemption thresholds, evaluation formats, and compliance requirements shown anywhere in Suffa are illustrative and must be verified against current Quebec home-instruction regulation. Suffa organises evidence of learning; it does not file with the ministere de l'Education on a family's behalf.",
    footerTagline: "Suffa - waqf-sustained community homeschooling.",
  },

  student: {
    greeting: "As-salamu alaykum",
    welcomeBack: "Welcome back, {name}",
    inPod: "You're learning with {pod}. Work through a lesson at your own pace, then a short checkpoint before the path opens up.",
    noPod: "You're not in a pod yet. Ask the masjid admin to place you in one.",
    lessonsFinished: "{count} lessons finished",
    checkpointsPassed: "{count} checkpoints passed",
    yourCourses: "Your courses",
    coursePath: {
      notAssigned: "Not assigned",
      review: "Review this lesson",
      takeCheckpoint: "Take the checkpoint",
      continueLesson: "Continue the lesson",
      startLesson: "Start the lesson",
      stateDone: "Done",
      stateQuiz: "Quiz",
      stateReady: "Ready",
      step: "Step {n} of {total}",
      noPath: "No path yet",
      askPlacement: "Ask the masjid to place your pod on this course.",
    },
    consistencyTitle: "Consistency",
    consistencyEmpty: "A little each day beats a lot once in a while. The first day counts.",
    consistencyYou: "You've shown up {days} in the last week",
    consistencyThey: "They've shown up {days} in the last week",
    consistencyMonth: ", {days} this month.",
    day: "day",
    days: "days",
    consistencyWindow: "Last 28 days.",
    consistencyPrivateYou: "This is only for you - it is never compared with anyone else.",
    consistencyPrivateFamily:
      "This is only for your family - it is never compared with anyone else.",
    nextStep: "Do this next",
    reviewReady: "Review is ready",
    reviewReadyBody: "{count} quick questions from lessons you've already passed.",
    startReview: "Start review",
    regulationNote:
      "Assessment formats and exam equivalency shown here are for the demo and must be verified against current Quebec evaluation requirements.",
  },

  auth: {
    signInTitle: "Sign in",
    tagline:
      "Community-run homeschool pods where the software carries the curriculum, so learning doesn't stop when a volunteer moves on.",
    email: "Email",
    password: "Password",
    newHere: "New here?",
    createAccount: "Create an account",
    tryDemo: "Try the demo",
    demoAccountsNote:
      "Or sign in with the seeded accounts: admin@suffa.demo / parent@suffa.demo / student@suffa.demo.",
    roleAdmin: "admin",
    roleFamily: "family",
    roleStudent: "student",
    signUpTitle: "Create an account",
    name: "Name",
    passwordMin: "At least 8 characters.",
    role: "I am a…",
    roleParentOpt: "Parent / guardian",
    roleStudentOpt: "Student",
    roleAdminOpt: "Masjid admin",
    signUpNote:
      "Demo: every account joins the demo masjid. In production a parent creates the child's account and consent gates it.",
    haveAccount: "Already have an account?",
    createAccountCta: "Create account",
    agreeIntro: "By creating an account you agree to the",
    agreeAnd: "and",
  },

  footer: {
    terms: "Terms",
    privacy: "Privacy",
    acceptableUse: "Acceptable use",
  },

  admin: {
    overviewKicker: "Masjid As-Suffa",
    overviewTitle: "Overview",
    overviewLede: "Everything the masjid runs, and how the community is doing this term.",
  },

  parent: {
    greeting: "As-salamu alaykum",
    lede: "A calm, read-only view of how your child is doing. Results appear here the moment they finish.",
    fullEvaluation: "Full evaluation status",
    transcriptPrintable: "Term-completion record (printable)",
    downloadCsv: "Download as CSV",
  },

  platform: {
    kicker: "Platform",
    title: "Masjids on Suffa",
    lede: "Provision new masjids and watch cross-masjid operational health. No student data is shown here.",
    provisionCta: "New masjid",
    statMasjids: "Masjids",
    statStudents: "Students (all masjids)",
    statSpend: "AI spend this month",
    colMasjid: "Masjid",
    colStatus: "Status",
    colLocale: "Locale",
    colStudents: "Students",
    colPods: "Pods",
    colChurn: "Volunteer churn",
    colSpend: "AI / month",
    colCreated: "Created",
    suspended: "Suspended",
    active: "Active",
    noMasjids: "No masjids yet.",
    noPiiNote:
      "Operational figures only — counts and totals. No student names or results are accessible from this view.",
    provisionTitle: "Provision a masjid",
    provisionLede: "Creates the tenant, its first admin login, and a starter curriculum skeleton.",
    fieldMasjidName: "Masjid name",
    fieldDefaultLocale: "Default language",
    firstAdmin: "First admin",
    fieldAdminName: "Admin name",
    fieldAdminEmail: "Admin email",
    fieldAdminPassword: "Temporary password",
    passwordHint: "At least 8 characters. The admin can change it after signing in.",
    provisionSubmit: "Create masjid",
    provisionNote:
      "The admin gets Math, Seerah and AI Literacy with one starter unit each. Lessons generate on first use.",
    volunteersActive: "Volunteers (active)",
    volunteersDeparted: "Volunteers (departed)",
    waqfPrincipal: "Waqf principal",
    provisionedOk: "Masjid provisioned. The first admin can now sign in.",
    reactivateTitle: "Reactivate this masjid",
    suspendTitle: "Suspend this masjid",
    reactivateBody: "Its users can sign in again immediately.",
    suspendBody:
      "Every user of this masjid is paused at sign-in until it is reactivated. No data is deleted.",
    reactivateSubmit: "Reactivate",
    suspendSubmit: "Suspend masjid",
  },

  suspended: {
    title: "This account is paused",
    body: "Your masjid's access to Suffa has been paused by the platform team. Please contact your masjid administrator. Nothing has been lost.",
  },
};

export type Messages = typeof en;
