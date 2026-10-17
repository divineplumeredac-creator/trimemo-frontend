import React, { useEffect, useMemo, useRef, useState } from "react";
import AdminDashboard from "./AdminDashboard";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  LockKeyhole,
  Menu,
  Paperclip,
  Search,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";

const API_BASE_URL = (import.meta.env.PROD ? "" : String(import.meta.env.VITE_API_BASE_URL || "https://trimemo-api.vercel.app")).replace(/\/$/, "");
const API_URL = `${API_BASE_URL}/api/academic`;
const PROBLEMATICS_API = `${API_BASE_URL}/api/generate-problematics`;
const PLANS_API = `${API_BASE_URL}/api/generate-plans`;
const FREE_PREVIEW_API = `${API_BASE_URL}/api/generate-free-preview`;
const ESTIMATE_API = `${API_BASE_URL}/api/estimate-project`;
const PROJECT_STATE_API = `${API_BASE_URL}/api/project-state`;
const BLOCK_API = `${API_BASE_URL}/api/generate-block`;
const WORDS_PER_PAGE = 320;
const LOGO_SRC = "/trimemo-logo.webp";
const OWNER_AUTH_API = `${API_BASE_URL}/api/owner-auth`;
const CLIENT_ACCOUNT_API = `${API_BASE_URL}/api/client-account`;
const EXPORT_API = `${API_BASE_URL}/api/export`;
// Adresse configurée dans Vercel avec VITE_CONTACT_EMAIL.
const CONTACT_EMAIL = String(import.meta.env.VITE_CONTACT_EMAIL || "").trim();

const formulaOptions = [
  {
    id: "LICENCE",
    title: "Licence",
    description: "Pour travaux de niveau Licence et formats équivalents.",
  },
  {
    id: "MASTER",
    title: "Master",
    description: "Pour mémoires, travaux de recherche et dossiers de niveau Master.",
  },
  {
    id: "DOCTORAT",
    title: "Doctorat",
    description: "Pour thèses et travaux de recherche de niveau doctoral.",
  },
  {
    id: "AUTRE",
    title: "Autre besoin",
    description: "Pour un document ou un niveau spécifique à vos consignes.",
  },
];

type FormulaId = (typeof formulaOptions)[number]["id"];

const domainOptions = ["Gestion","Management","Management stratégique","Management des ressources humaines","Finance","Comptabilité","Audit","Contrôle de gestion","Banque","Assurance","Économie","Marketing","Communication","Commerce","Entrepreneuriat","Gestion de projet","Logistique et supply chain","Achats","Management de la qualité","Management des organisations","Droit","Droit des affaires","Droit public","Sciences politiques","Relations internationales","Sociologie","Psychologie","Éducation et sciences de l’éducation","Sciences de l’information et de la communication","Informatique","Intelligence artificielle","Data science","Systèmes d’information","Génie industriel","Génie civil","Agronomie","Environnement","Santé","Sciences infirmières","Médecine","Pharmacie","Tourisme et hôtellerie","Transport","Immobilier","Développement durable","Sciences sociales","Sciences humaines","Autre"];


const pricing = {
  individual: [
    { id: "LICENCE", title: "Mémoire Licence", pages: "Volume au choix", eur: "Prix estimé après analyse", fcfa: "Prix estimé après analyse", badge: "Licence 3", details: "Tarif calculé selon le document, le volume, le niveau et le marché du client." },
    { id: "MASTER", title: "Mémoire Master", pages: "Volume au choix", eur: "Prix estimé après analyse", fcfa: "Prix estimé après analyse", badge: "Le plus choisi", details: "Tarif calculé selon le document, le volume, le niveau et le marché du client." },
    { id: "DOCTORAT", title: "Thèse", pages: "Volume au choix", eur: "Prix estimé après analyse", fcfa: "Prix estimé après analyse", badge: "Doctorat", details: "Tarif calculé selon le document, le volume, le niveau et le marché du client." },
  ],
};

const pricingInclusions = [
  "Jusqu’à 3 problématiques et jusqu’à 3 plans générés, améliorés et choisis avant paiement",
  "Sources bibliographiques contrôlées (DOI ou URL vérifiée lorsque disponible)",
  "Export Word",
  "Correction humaine disponible en option, avec devis séparé",
];


type FileCategory = "methodology" | "instructions" | "context" | "source" | "reference";

type FileInput = {
  name: string;
  type: string;
  content: string;
  category: FileCategory;
};

type ProjectData = {
  projectId: string;
  formula: FormulaId;
  sujet: string;
  domaine: string;
  contexte: string;
  problematiquePersonnelle: string;
  problematique?: string;
  planPersonnel: string;
  consignes: string;
  niveau: string;
  typeDoc: string;
  pages: number;
  email: string;
  files: FileInput[];
  country?: string;
  pricingQuoteToken?: string;
  paymentProblematicId?: string;
  paymentPlanId?: string;
  paidPreviewSnapshot?: Preview;
};

type Problematic = {
  id: string;
  title: string;
  question: string;
  rationale: string;
  angle: string;
};

type PlanInternalTitle = {
  id: string;
  number: number;
  title: string;
};

type PlanSubsection = {
  id: string;
  number: number;
  title: string;
  description: string;
  internalTitles: PlanInternalTitle[];
};

type PlanSection = {
  id: string;
  number: number;
  title: string;
  description: string;
  subsections: PlanSubsection[];
};

type PlanChapter = {
  id: string;
  number: number;
  title: string;
  description: string;
  wordCount: number;
  sections: PlanSection[];
};

type PlanPart = {
  id: string;
  number: number;
  title: string;
  description: string;
  chapters: PlanChapter[];
};

type PlanIntroConclusion = {
  title: string;
  description: string;
  wordCount: number;
};

type Plan = {
  id: string;
  title: string;
  description: string;
  approach: string;
  totalWords: number;
  introductionGeneral: PlanIntroConclusion;
  parts: PlanPart[];
  conclusionGeneral: PlanIntroConclusion;
  introduction: PlanIntroConclusion;
  conclusion: PlanIntroConclusion;
};

type Preview = {
  problematic: Problematic;
  plan: Plan;
  introduction: {
    title: string;
    content: string;
    wordCount: number;
    incomplete: boolean;
  };
  chapterOne: { title: string; content: string; wordCount: number; partTitle?: string; chapterNumber?: number; sectionTitles?: string[] };
};

type ProjectEstimate = {
  country: string; market: string; marketLabel: string; currency: string;
  documentType: string; level: string; complexity: string; pages: number; wordsPerPage: number;
  baseRate: number; levelCoefficient: number; complexityCoefficient: number; estimatedAmount: number;
  formattedAmount: string; checkoutCurrency: string; checkoutAmount: string; reasons: string[];
  detectedRequirements: string[]; countryDetected: boolean; pricingQuoteToken: string; status: string;
};

type Block = {
  id: string;
  title: string;
  expectedWords: number;
  content: string;
  wordCount: number;
  status: "pending" | "generating" | "done";
  sources: { title: string; author?: string; year?: string; url?: string; doi?: string; citation?: string; verified?: boolean }[];
  footnotes: string[];
  structure: string[];
  kind: "introduction" | "chapter" | "section" | "conclusion";
  error?: string;
};

type PremiumOptions = {
  problematics: Problematic[];
  plans: Plan[];
};

type Toast = {
  id: number;
  type: "error" | "success" | "info";
  message: string;
};

function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function wordsToPages(words: number) {
  return words / WORDS_PER_PAGE;
}

const MAX_TOTAL_FILES_BYTES = 3 * 1024 * 1024; // les fonctions Vercel refusent les requêtes > 4,5 Mo (base64 inclus)

function dataUrlBytes(value: string) {
  return Math.round(String(value || "").length * 0.75);
}

function createProjectId() {
  try { return crypto.randomUUID(); } catch {
    return `trm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

function maxPagesForFormula(_formula: FormulaId) {
  return 300;
}

function projectPayloadWithoutFiles(project: ProjectData, includePreviewSnapshot = false): ProjectData {
  const { paidPreviewSnapshot, ...cleanProject } = project;
  return { ...cleanProject, ...(includePreviewSnapshot && paidPreviewSnapshot ? { paidPreviewSnapshot } : {}), files: project.files.map(({ name, type, category }) => ({ name, type, category, content: "" })) };
}

// Le projet « en attente de paiement » est conservé SANS les fichiers (base64) : ils feraient dépasser le quota du navigateur.
function savePendingPreview(preview: Preview): boolean {
  try {
    window.sessionStorage.setItem("trimemo_preview_pending", JSON.stringify(preview));
    return true;
  } catch {
    return false;
  }
}

function savePendingProject(project: ProjectData): boolean {
  const { paidPreviewSnapshot, ...projectWithoutPreview } = project;
  const metadata = { ...projectWithoutPreview, files: [] };
  try {
    window.sessionStorage.setItem("trimemo_project", JSON.stringify(metadata));
    window.localStorage.setItem("trimemo_project_pending", JSON.stringify(metadata));
  } catch {
    return false;
  }
  return storeProjectFiles(project);
}

// Les fichiers joints vivent dans une clé séparée (hors du gros état) ; l'échec de stockage n'est jamais bloquant.
function storeProjectFiles(project: ProjectData): boolean {
  try {
    if (!project.files.length) {
      window.localStorage.removeItem("trimemo_pending_files");
      window.sessionStorage.removeItem("trimemo_pending_files_content");
      return true;
    }
    window.localStorage.setItem("trimemo_pending_files", JSON.stringify({ projectId: project.projectId, files: project.files.map(({ name, type, category }) => ({ name, type, category, content: "" })) }));
    // Full file contents stay in session storage only; they are not persisted in localStorage.
    window.sessionStorage.setItem("trimemo_pending_files_content", JSON.stringify({ projectId: project.projectId, files: project.files }));
    return true;
  } catch {
    // If the browser session quota is exceeded, metadata remains and the user can reattach files.
    return false;
  }
}

function loadStoredFiles(projectId: string): FileInput[] {
  try {
    const session = JSON.parse(window.sessionStorage.getItem("trimemo_pending_files_content") || "null");
    if (session?.projectId === projectId && Array.isArray(session.files) && session.files.every((file: FileInput) => file.content)) return session.files;
  } catch {}
  try {
    const pending = JSON.parse(window.localStorage.getItem("trimemo_pending_files") || "null");
    return pending?.projectId === projectId && Array.isArray(pending.files) ? pending.files : [];
  } catch { return []; }
}

// Retrouve le projet au retour de PayPal, même si l'onglet a changé (sessionStorage perdu).
function loadPendingProject(stateKey: string): ProjectData | null {
  try {
    const raw = window.sessionStorage.getItem("trimemo_project") || window.localStorage.getItem("trimemo_project_pending");
    if (!raw) return null;
    const saved: ProjectData = JSON.parse(raw);
    let files: FileInput[] = [];
    try {
      const sessionFiles = JSON.parse(window.sessionStorage.getItem("trimemo_pending_files_content") || "null");
      if (sessionFiles?.projectId === saved.projectId && Array.isArray(sessionFiles.files) && sessionFiles.files.every((file: FileInput) => file.content)) files = sessionFiles.files;
    } catch {}
    if (!files.length) {
      try { const pending = JSON.parse(window.localStorage.getItem("trimemo_pending_files") || "null"); if (pending?.projectId === saved.projectId) files = pending.files || []; } catch {}
    }
    return { ...saved, files: Array.isArray(files) ? files : [] };
  } catch {
    return null;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normalizeStructuralTitle(value: any, kind: "part" | "chapter" | "section" | "subsection", fallback: string) {
  let raw = String(value ?? "").trim();
  if (!raw) return fallback;

  const patterns: Record<string, RegExp> = {
    part: /^(?:partie|part)\s+(?:[IVXLCDM]+|\d+)\s*[.\-–—:]?\s*/i,
    chapter: /^(?:chapitre|chapter)\s+\d+(?:\.\d+)?\s*[.\-–—:]?\s*/i,
    section: /^section\s+\d+(?:\.\d+)*\s*[.\-–—:]?\s*/i,
    subsection: /^(?:sous[- ]section|subsection)\s+\d+(?:\.\d+)*\s*[.\-–—:]?\s*/i,
  };

  raw = raw.replace(patterns[kind], "");
  raw = raw.replace(/^§\s*/, "");
  raw = raw.replace(/^(?:\d+\.){1,6}\s*/, "");
  raw = raw.replace(/^[IVXLCDM]+\s*[.\-–—:]\s*/i, "");

  return raw.trim() || fallback;
}

function normalizeProblematic(value: any, index = 0): Problematic {
  return {
    id: String(value?.id || `problematic-${index + 1}`),
    title: String(value?.title || value?.titre || value?.question || `Problématique ${index + 1}`),
    question: String(value?.question || value?.texte || value?.text || value?.description || ""),
    rationale: String(value?.rationale || value?.pertinence || value?.justification || ""),
    angle: String(value?.angle || value?.approche || "")
  };
}

function normalizePlan(value: any, index = 0): Plan {
  const rawParts = Array.isArray(value?.parts)
    ? value.parts
    : Array.isArray(value?.parties)
      ? value.parties
      : [];

  let globalChapter = 0;

  const parts: PlanPart[] = rawParts.map((part: any, partIndex: number) => {
    const partNumber = partIndex + 1;
    const rawChapters = Array.isArray(part?.chapters)
      ? part.chapters
      : Array.isArray(part?.chapitres)
        ? part.chapitres
        : [];

    const chapters: PlanChapter[] = rawChapters.map((chapter: any, chapterIndex: number) => {
      globalChapter += 1;
      const chapterNumber = globalChapter;
      const rawSections = Array.isArray(chapter?.sections)
        ? chapter.sections
        : Array.isArray(chapter?.sectionsList)
          ? chapter.sectionsList
          : [];

      const sections: PlanSection[] = rawSections.map((section: any, sectionIndex: number) => {
        const sectionNumber = sectionIndex + 1;
        const rawSubsections = Array.isArray(section?.subsections)
          ? section.subsections
          : Array.isArray(section?.sousSections)
            ? section.sousSections
            : [];

        return {
          id: String(section?.id || `section-${partNumber}-${chapterNumber}-${sectionNumber}`),
          number: sectionNumber,
          title: normalizeStructuralTitle(section?.title || section?.titre, "section", `Section ${sectionNumber}`),
          description: String(section?.description || section?.descriptionText || "").trim(),
          subsections: rawSubsections.map((item: any, subsectionIndex: number) => ({
            id: String(item?.id || `subsection-${partNumber}-${chapterNumber}-${sectionNumber}-${subsectionIndex + 1}`),
            number: subsectionIndex + 1,
            title: normalizeStructuralTitle(typeof item === "string" ? item : item?.title || item?.titre, "subsection", `Sous-section ${subsectionIndex + 1}`),
            description: String(item?.description || item?.descriptionText || "").trim(),
            internalTitles: Array.isArray(item?.internalTitles)
              ? item.internalTitles.map((internal: any, internalIndex: number) => ({
                  id: String(internal?.id || `internal-${partNumber}-${chapterNumber}-${sectionNumber}-${subsectionIndex + 1}-${internalIndex + 1}`),
                  number: internalIndex + 1,
                  title: String(internal?.title || internal?.titre || `Titre interne ${internalIndex + 1}`).trim()
                }))
              : []
          }))
        };
      });

      return {
        id: String(chapter?.id || `chapter-${chapterNumber}`),
        number: chapterNumber,
        title: normalizeStructuralTitle(chapter?.title || chapter?.titre, "chapter", `Chapitre ${chapterNumber}`),
        description: String(chapter?.description || chapter?.descriptionText || "").trim(),
        wordCount: Number(chapter?.wordCount || 0),
        sections
      };
    });

    return {
      id: String(part?.id || `part-${partNumber}`),
      number: partNumber,
      title: normalizeStructuralTitle(part?.title || part?.titre, "part", `Partie ${partNumber}`),
      description: String(part?.description || part?.descriptionText || "").trim(),
      chapters
    };
  });

  const introSource = value?.introductionGeneral || value?.introduction || {};
  const conclusionSource = value?.conclusionGeneral || value?.conclusion || {};
  const intro: PlanIntroConclusion = {
    title: "Introduction générale",
    description: "",
    wordCount: Number(introSource?.wordCount || 0)
  };
  const conclusion: PlanIntroConclusion = {
    title: "Conclusion générale",
    description: "",
    wordCount: Number(conclusionSource?.wordCount || 0)
  };

  return {
    id: String(value?.id || `plan-${index + 1}`),
    title: String(value?.title || value?.titre || `Plan ${index + 1}`),
    description: String(value?.description || value?.descriptionText || "").trim(),
    approach: String(value?.approach || value?.angle || "").trim(),
    totalWords: Number(value?.totalWords || 0),
    introductionGeneral: intro,
    parts,
    conclusionGeneral: conclusion,
    introduction: intro,
    conclusion
  };
}

function planChapters(plan: Plan): PlanChapter[] {
  return plan.parts.flatMap((part) => part.chapters);
}

export default function App() {
  const [formula, setFormula] = useState<FormulaId | null>(null);
  const [project, setProject] = useState<ProjectData>({
    projectId: createProjectId(),
    formula: "MASTER",
    sujet: "",
    domaine: "",
    contexte: "",
    problematiquePersonnelle: "",
    planPersonnel: "",
    consignes: "",
    niveau: "",
    typeDoc: "Mémoire",
    pages: 0,
    email: "",
    files: [],
  });
  const [preview, setPreview] = useState<Preview | null>(null);
  const [estimate, setEstimate] = useState<ProjectEstimate | null>(null);
  const [premium, setPremium] = useState<PremiumOptions | null>(null);
  const [selectedProblematic, setSelectedProblematic] = useState<Problematic | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [clientProjectFlow, setClientProjectFlow] = useState(false);
  const [view, setView] = useState<"home" | "project" | "estimate" | "preview" | "premium" | "writing" | "account" | "dashboard">(() => { const params = new URLSearchParams(window.location.search); return params.get("account") === "signup" || params.get("reset-password") === "1" ? "account" : "home"; });
  const [previewTab, setPreviewTab] = useState<"problematic" | "plan" | "introduction" | "chapter">("problematic");
  const [premiumNav, setPremiumNav] = useState<string>("problematic-0");
  const [premiumSection, setPremiumSection] = useState<"problematic" | "plan" | "writing">("problematic");
  const [selectedWritingBlockId, setSelectedWritingBlockId] = useState<string | null>(null);
  const [writingTab, setWritingTab] = useState<"problematic" | "plan" | "writing" | "preview">("writing");
  const [loading, setLoading] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<"paypal" | "mobile-money" | null>(null);
  const [clientAuthMode, setClientAuthMode] = useState<"signup" | "login" | "forgot" | "reset">(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("reset-password") === "1" ? "reset" : "signup";
  });
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("");
  const [clientRecoveryToken, setClientRecoveryToken] = useState(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    return hash.get("access_token") || query.get("access_token") || query.get("token_hash") || "";
  });
  const [clientAuthError, setClientAuthError] = useState("");
  const [clientAuthNotice, setClientAuthNotice] = useState("");
  const [clientAuthBusy, setClientAuthBusy] = useState(false);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<"paypal" | "mobile-money" | null>(null);
  const [clientProjects, setClientProjects] = useState<Array<{project_id:string;subject:string;payment_status:string;updated_at:string}>>([]);
  const [clientRevisions, setClientRevisions] = useState<any[]>([]);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [clientDashboardTab, setClientDashboardTab] = useState<"documents" | "in_progress" | "pending" | "completed">("documents");
  const [revisionInstructions, setRevisionInstructions] = useState("");
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState("");
  const [revisionError, setRevisionError] = useState("");
  const [revisionTargetProjectId, setRevisionTargetProjectId] = useState<string | null>(null);
  const [revisionTargetTitle, setRevisionTargetTitle] = useState("");
  const [clientEmailDisplay, setClientEmailDisplay] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ownerRoute] = useState(() => typeof window !== "undefined" && window.location.pathname === "/owner");
  const stateStorageKey = ownerRoute ? "trimemo_state_v5_owner" : "trimemo_state_v5_public";
  const [ownerSessionValid, setOwnerSessionValid] = useState(false);
  const [ownerShowWriter, setOwnerShowWriter] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState(() => {
    try { return window.sessionStorage.getItem("trimemo_owner_email") || ""; } catch { return ""; }
  });
  const [ownerPassword, setOwnerPassword] = useState("");
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [ownerLoginError, setOwnerLoginError] = useState("");
  const [ownerBusy, setOwnerBusy] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [planImprovementComments, setPlanImprovementComments] = useState<Record<string,string>>({});
  const [problematicImprovementComments, setProblematicImprovementComments] = useState<Record<string,string>>({});
  const [problematicGenerationCount, setProblematicGenerationCount] = useState(0);
  const [planGenerationCount, setPlanGenerationCount] = useState(0);
  const filesHydrated = useRef(false);
  const cloudHydrated = useRef(false);
  const cloudLoadStarted = useRef(false);
  const cloudSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalDoneWords = useMemo(
    () => blocks.filter((b) => b.status === "done").reduce((sum, b) => sum + b.wordCount, 0),
    [blocks],
  );
  const targetWords = blocks.length
    ? blocks.reduce((sum, block) => sum + block.expectedWords, 0)
    : project.pages * WORDS_PER_PAGE;
  const progress = targetWords ? Math.min(100, Math.round((totalDoneWords / targetWords) * 100)) : 0;

  useEffect(() => {
    if (!ownerRoute) return;
    try {
      const token = window.sessionStorage.getItem("trimemo_owner_session");
      const lastActivity = Number(window.sessionStorage.getItem("trimemo_owner_last_activity") || 0);
      const maxAge = 24 * 60 * 60 * 1000;
      if (token && lastActivity && Date.now() - lastActivity < maxAge) {
        setOwnerSessionValid(true);
      } else {
        window.sessionStorage.removeItem("trimemo_owner_session");
        window.sessionStorage.removeItem("trimemo_owner_last_activity");
      }
    } catch {
      setOwnerSessionValid(false);
    }
  }, [ownerRoute]);

  useEffect(() => {
    // Un lien de reprise doit être restauré exclusivement depuis le projet distant,
    // jamais depuis l'ancien état local du navigateur.
    const sharedProjectId = new URLSearchParams(window.location.search).get("project");
    if (sharedProjectId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sharedProjectId)) {
      filesHydrated.current = true;
      return;
    }
    const params = new URLSearchParams(window.location.search);
    // Le retour de récupération doit primer sur l'état de navigation sauvegardé.
    // Sinon une ancienne vue (par exemple la commande) masque le formulaire de mot de passe.
    if (params.get("reset-password") === "1") {
      setView("account");
      setClientAuthMode("reset");
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const recoveryToken = hash.get("access_token") || params.get("access_token") || params.get("token_hash") || "";
      if (recoveryToken) setClientRecoveryToken(recoveryToken);
      const recoveryError = hash.get("error_description") || params.get("error_description") || "";
      if (recoveryError) setClientAuthError(recoveryError);
      else if (!recoveryToken) setClientAuthError("Le lien ne contient pas de jeton de récupération valide. Demandez un nouveau lien.");
      filesHydrated.current = true;
      return;
    }
    try {
      const raw = window.localStorage.getItem(stateStorageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.project) {
        const restoredId = saved.project.projectId || createProjectId();
        setProject({ ...saved.project, projectId: restoredId, files: loadStoredFiles(restoredId) });
      }
      if (saved?.formula) setFormula(saved.formula);
      if (saved?.preview) setPreview(saved.preview);
      if (saved?.estimate) setEstimate(saved.estimate);
      if (saved?.premium) setPremium(saved.premium);
      if (saved?.selectedProblematic) setSelectedProblematic(saved.selectedProblematic);
      if (saved?.selectedPlan) setSelectedPlan(saved.selectedPlan);
      if (Array.isArray(saved?.blocks)) setBlocks(saved.blocks);
      if (saved?.view) setView(saved.view);
      if (saved?.previewTab) setPreviewTab(saved.previewTab);
      if (saved?.premiumNav) setPremiumNav(saved.premiumNav);
      if (saved?.premiumSection === "problematic" || saved?.premiumSection === "plan" || saved?.premiumSection === "writing") setPremiumSection(saved.premiumSection);
      if (saved?.selectedWritingBlockId) setSelectedWritingBlockId(saved.selectedWritingBlockId);
      if (saved?.problematicImprovementComments) setProblematicImprovementComments(saved.problematicImprovementComments);
      if (saved?.planImprovementComments) setPlanImprovementComments(saved.planImprovementComments);
      if (Number.isFinite(saved?.problematicGenerationCount)) setProblematicGenerationCount(saved.problematicGenerationCount);
      if (Number.isFinite(saved?.planGenerationCount)) setPlanGenerationCount(saved.planGenerationCount);
      const params = new URLSearchParams(window.location.search);
      if (params.get("account") === "signup") {
        setView("account");
        const method = params.get("method");
        if (method === "paypal" || method === "mobile-money") setPendingPaymentMethod(method);
        setClientAuthMode("signup");
      }
    } catch {
      window.localStorage.removeItem(stateStorageKey);
    } finally {
      filesHydrated.current = true;
    }
  }, [ownerRoute, stateStorageKey]);

  // Restauration depuis Supabase si le projet est ouvert avec son lien de reprise (?project=UUID).
  useEffect(() => {
    if (cloudLoadStarted.current) return;
    cloudLoadStarted.current = true;
    const sharedProjectId = new URLSearchParams(window.location.search).get("project");
    if (!sharedProjectId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sharedProjectId)) {
      cloudHydrated.current = true;
      return;
    }
    cloudHydrated.current = false;
    (async () => {
      try {
        const response = await fetch(`${PROJECT_STATE_API}?projectId=${encodeURIComponent(sharedProjectId)}`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || "Impossible de récupérer le projet distant.");
        if (data.found && data.state) {
          const saved = data.state;
          const remoteProject = saved.project ? { ...saved.project, projectId: sharedProjectId, files: [] } : null;
          if (remoteProject) setProject(remoteProject);
          if (saved.formula) setFormula(saved.formula);
          if (saved.preview) setPreview(saved.preview);
          if (saved.estimate) setEstimate(saved.estimate);
          if (saved.premium) setPremium(saved.premium);
          if (saved.selectedProblematic) setSelectedProblematic(saved.selectedProblematic);
          if (saved.selectedPlan) setSelectedPlan(saved.selectedPlan);
          if (Array.isArray(saved.blocks)) setBlocks(saved.blocks);
          // Un projet ouvert depuis le tableau de bord reprend toujours dans la rédaction.
          setView("writing");
          setWritingTab("writing");
          if (saved.previewTab) setPreviewTab(saved.previewTab);
          if (saved.premiumNav) setPremiumNav(saved.premiumNav);
          if (saved.premiumSection) setPremiumSection(saved.premiumSection);
          if (saved.selectedWritingBlockId) setSelectedWritingBlockId(saved.selectedWritingBlockId);
          if (saved.problematicImprovementComments) setProblematicImprovementComments(saved.problematicImprovementComments);
          if (saved.planImprovementComments) setPlanImprovementComments(saved.planImprovementComments);
          if (Number.isFinite(saved.problematicGenerationCount)) setProblematicGenerationCount(saved.problematicGenerationCount);
          if (Number.isFinite(saved.planGenerationCount)) setPlanGenerationCount(saved.planGenerationCount);
          try { window.localStorage.setItem(stateStorageKey, JSON.stringify(saved)); } catch {}
        }
      } catch (error) {
        console.error("TRIMEMO_CLOUD_PROJECT_LOAD_FAILED", String(error));
        pushToast("error", "Le projet distant n’a pas pu être chargé. Les données locales restent disponibles.");
      } finally {
        cloudHydrated.current = true;
        filesHydrated.current = true;
      }
    })();
  }, [stateStorageKey]);

  // Persistance des fichiers joints (clé séparée) une fois la restauration faite.
  useEffect(() => {
    if (!filesHydrated.current) return;
    storeProjectFiles(project);
  }, [project.files, project.projectId]);

  // Synchronisation serveur de l'état complet du projet. Les fichiers sont gérés séparément.
  useEffect(() => {
    if (!cloudHydrated.current || !filesHydrated.current || (ownerRoute && !ownerSessionValid)) return;
    if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current);
    cloudSaveTimer.current = setTimeout(async () => {
      const { paidPreviewSnapshot, ...persistedProject } = project;
      const state = {
        project: { ...persistedProject, files: project.files.map(({ name, type, category }) => ({ name, type, category, content: "" })) },
        formula, preview, estimate, premium, selectedProblematic, selectedPlan, blocks,
        // Ne jamais sauvegarder l'écran du tableau de bord comme écran de reprise du mémoire.
        view: view === "dashboard" || view === "account" || view === "home" ? "writing" : view,
        previewTab,
        premiumNav, premiumSection, selectedWritingBlockId, problematicImprovementComments,
        planImprovementComments, problematicGenerationCount, planGenerationCount,
      };
      try {
        const response = await fetch(PROJECT_STATE_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: project.projectId, state }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || "Échec de la sauvegarde serveur.");
        window.dispatchEvent(new CustomEvent("trimemo-cloud-save", { detail: { ok: true, savedAt: data.savedAt } }));
      } catch (error) {
        console.error("TRIMEMO_CLOUD_PROJECT_SAVE_FAILED", String(error));
        window.dispatchEvent(new CustomEvent("trimemo-cloud-save", { detail: { ok: false } }));
      }
    }, 900);
    return () => { if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current); };
  }, [ownerRoute, ownerSessionValid, project, formula, preview, estimate, premium, selectedProblematic, selectedPlan, blocks, view, previewTab, premiumNav, premiumSection, selectedWritingBlockId, problematicImprovementComments, planImprovementComments, problematicGenerationCount, planGenerationCount]);

  // Évite d'afficher une page de rédaction vide lorsqu'aucun plan n'a été restauré.
  // On attend la fin de l'hydratation distante avant de décider où renvoyer l'utilisateur.
  useEffect(() => {
    if (view !== "writing" || !cloudHydrated.current || !filesHydrated.current) return;
    if (selectedPlan && selectedProblematic) return;
    let hasClientSession = false;
    try { hasClientSession = Boolean(JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null")?.token); } catch {}
    setView(hasClientSession ? "dashboard" : "home");
  }, [view, selectedPlan, selectedProblematic]);

  useEffect(() => {
    // L'espace de rédaction doit rester visible après validation du plan.
    // Le verrouillage commercial intervient au moment de poursuivre après l'aperçu,
    // jamais en effaçant les blocs ni en redirigeant la vue dès son ouverture.
    if (ownerRoute && !ownerSessionValid) return;
    try {
      window.localStorage.setItem(stateStorageKey, JSON.stringify({
        project: (() => { const { paidPreviewSnapshot, ...persistedProject } = project; return { ...persistedProject, files: [] }; })(),
        formula,
        preview,
        estimate,
        premium,
        selectedProblematic,
        selectedPlan,
        blocks,
        view,
        previewTab,
        premiumNav,
        premiumSection,
        selectedWritingBlockId,
        problematicImprovementComments,
        planImprovementComments,
        problematicGenerationCount,
        planGenerationCount,
      }));
    } catch {}
  }, [ownerRoute, ownerSessionValid, stateStorageKey, project, formula, preview, estimate, premium, selectedProblematic, selectedPlan, blocks, view, previewTab, premiumNav, premiumSection, selectedWritingBlockId, problematicImprovementComments, planImprovementComments, problematicGenerationCount, planGenerationCount]);

  useEffect(() => {
    if (!ownerRoute) return;
    const token = window.sessionStorage.getItem("trimemo_owner_session");
    const lastActivity = Number(window.sessionStorage.getItem("trimemo_owner_last_activity") || 0);
    if (token && lastActivity && Date.now() - lastActivity >= 24 * 60 * 60 * 1000) {
      window.sessionStorage.removeItem("trimemo_owner_session");
      window.sessionStorage.removeItem("trimemo_owner_last_activity");
      setOwnerSessionValid(false);
      return;
    }
    if (!token) return;
    (async () => {
      try {
        const response = await fetch(OWNER_AUTH_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", token }),
        });
        if (response.ok) {
          setOwnerSessionValid(true);
          window.sessionStorage.setItem("trimemo_owner_last_activity", String(Date.now()));
        } else {
          window.sessionStorage.removeItem("trimemo_owner_session");
        }
      } catch {
        window.sessionStorage.removeItem("trimemo_owner_session");
      }
    })();
  }, [ownerRoute]);

  useEffect(() => {
    if (!ownerRoute || !ownerSessionValid) return;
    const markActivity = () => window.sessionStorage.setItem("trimemo_owner_last_activity", String(Date.now()));
    const events = ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"];
    events.forEach((event) => window.addEventListener(event, markActivity, { passive: true }));
    const timer = window.setInterval(() => {
      const last = Number(window.sessionStorage.getItem("trimemo_owner_last_activity") || 0);
      if (last && Date.now() - last >= 24 * 60 * 60 * 1000) {
        window.sessionStorage.removeItem("trimemo_owner_session");
        window.sessionStorage.removeItem("trimemo_owner_last_activity");
        setOwnerSessionValid(false);
        setView("home");
      }
    }, 60 * 1000);
    return () => {
      events.forEach((event) => window.removeEventListener(event, markActivity));
      window.clearInterval(timer);
    };
  }, [ownerRoute, ownerSessionValid]);

  useEffect(() => {
    if (ownerRoute) return;

    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const queryOrderId = params.get("order_id") || params.get("token") || params.get("transaction_id");
    // Certains retours PayPal intégrés ne transmettent pas immédiatement le token dans l'URL.
    // La référence de commande est sauvegardée avant la redirection et sert de reprise sécurisée.
    const id = queryOrderId || (payment === "paypal" ? window.sessionStorage.getItem("trimemo_pending_paypal_order") : null);
    if (!payment || payment === "paypal_cancelled") {
      if (payment === "paypal_cancelled") {
        window.sessionStorage.removeItem("trimemo_pending_paypal_order");
        pushToast("info", "Paiement annulé. Votre projet est conservé ; vous pouvez reprendre le paiement.");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      return;
    }
    if (!id) {
      pushToast("error", "Le retour de paiement ne contient pas la référence PayPal. Votre projet est conservé ; relancez le paiement ou contactez le support.");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const action = payment === "paypal" ? "verify-paypal" : "verify-mobile-money";
        const response = await fetch(`${API_URL}?action=${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, project: loadPendingProject(stateStorageKey) }),
        });
        const data = await readApiResponse(response);
        if (data.status !== "PAID") {
          throw new Error(data.error || "Le paiement n’a pas été confirmé.");
        }
        if (!data.premium_token) {
          throw new Error("Paiement confirmé, mais le déblocage premium sécurisé n’a pas été délivré.");
        }
        window.sessionStorage.setItem("trimemo_premium_token", String(data.premium_token));
        const saved = data.project || loadPendingProject(stateStorageKey) || null;
        if (saved?.projectId) window.sessionStorage.setItem("trimemo_premium_project_id", String(saved.projectId));
        if (!saved) throw new Error("Le paiement est confirmé, mais les données du projet n'ont pas pu être restaurées. Contactez le support avec la référence de commande.");
        if (saved) {
          setProject(saved);
          let storedPreview: Preview | null = data.preview || null;
          if (!storedPreview) { try { storedPreview = JSON.parse(window.sessionStorage.getItem("trimemo_preview_pending") || window.localStorage.getItem("trimemo_preview_pending") || "null"); } catch {} }
          if (!storedPreview && saved.paidPreviewSnapshot) storedPreview = saved.paidPreviewSnapshot;

          if (storedPreview?.problematic?.question && storedPreview?.plan?.parts?.length && storedPreview?.chapterOne?.content) {
            const problematic = normalizeProblematic(storedPreview.problematic, 0);
            const plan = normalizePlan(storedPreview.plan, 0);
            setPreview(storedPreview);
            setPremium({ problematics: [problematic], plans: [plan] });
            setSelectedProblematic(problematic);
            setSelectedPlan(plan);
            setPremiumNav("plan-0");
            setPremiumSection("writing");

            const prepared = prepareBlocks(plan);
            const firstPart = plan.parts[0];
            const firstChapter = firstPart?.chapters?.[0];
            const firstChapterPrefix = firstChapter ? `${firstChapter.id}-bloc-` : "";
            const introductionBlock = prepared.find((block) => block.kind === "introduction");
            const seededChapter: Block = {
              id: `${plan.id}-chapter-one-preview`,
              title: storedPreview.chapterOne.title || firstChapter?.title || "Chapitre 1",
              expectedWords: Math.max(100, Number(storedPreview.chapterOne.wordCount || countWords(storedPreview.chapterOne.content))),
              content: storedPreview.chapterOne.content,
              wordCount: countWords(storedPreview.chapterOne.content),
              status: "done",
              sources: [],
              footnotes: [],
              structure: [
                firstPart ? `PARTIE I : ${firstPart.title}` : "PARTIE I",
                firstChapter ? `CHAPITRE 1 : ${firstChapter.title}` : "CHAPITRE 1",
                ...(storedPreview.chapterOne.sectionTitles || []),
              ],
              kind: "chapter",
            };
            const remainingBlocks = prepared.filter((block) =>
              block.kind !== "introduction" && (!firstChapterPrefix || !block.id.startsWith(firstChapterPrefix))
            );
            const nextBlocks = introductionBlock ? [introductionBlock, seededChapter, ...remainingBlocks] : [seededChapter, ...remainingBlocks];
            // Si le client revient du paiement, restaurer les blocs et leur contenu depuis la session
            // au lieu de remplacer sa progression par des blocs vierges.
            let savedBlocks: Block[] = [];
            let savedSelectedBlockId = "";
            try {
              const rawBlocks = window.sessionStorage.getItem("trimemo_blocks_pending");
              const parsedBlocks = rawBlocks ? JSON.parse(rawBlocks) : null;
              if (Array.isArray(parsedBlocks) && parsedBlocks.length && parsedBlocks.every((item) => item && typeof item.id === "string" && typeof item.content === "string")) savedBlocks = parsedBlocks;
              savedSelectedBlockId = window.sessionStorage.getItem("trimemo_selected_block_pending") || "";
            } catch {}
            // La liste des blocs sauvegardée avant le paiement est la source de vérité :
            // elle contient les blocs déjà rédigés et le prochain bloc qui attend la rédaction.
            // Ne pas remplacer le chapitre partiellement rédigé par un bloc synthétique d'aperçu.
            const restoredBlocks = savedBlocks.length
              ? prepared.map((block) => {
                  const savedBlock = savedBlocks.find((item) => item.id === block.id);
                  return savedBlock ? { ...block, ...savedBlock, id: block.id } : block;
                })
              : nextBlocks;
            setBlocks(restoredBlocks);
            const nextPendingBlock = restoredBlocks.find((block) => block.status !== "done" || !block.content.trim());
            const selectedBlock = nextPendingBlock?.id
              || restoredBlocks.find((block) => block.content.trim())?.id
              || introductionBlock?.id
              || seededChapter.id;
            setSelectedWritingBlockId(selectedBlock);
            setView("writing");
            window.sessionStorage.removeItem("trimemo_blocks_pending");
            window.sessionStorage.removeItem("trimemo_selected_block_pending");
            window.localStorage.removeItem("trimemo_preview_pending");
            window.sessionStorage.removeItem("trimemo_preview_pending");
            pushToast("success", "Paiement confirmé. La rédaction reprend au prochain bloc non rédigé, en conservant le contenu déjà produit.");
          } else {
            const personalQuestion = String(saved.problematiquePersonnelle || saved.problematique || "").trim();

            if (personalQuestion) {
              const personalProblematic: Problematic = {
                id: "personal-problematic",
                title: "Problématique fournie par le client",
                question: personalQuestion,
                rationale: "Problématique saisie par le client et conservée telle quelle.",
                angle: "Approche définie par le client",
              };
              setPremium({ problematics: [personalProblematic], plans: [] });
              setSelectedProblematic(personalProblematic);
              setSelectedPlan(null);
              setBlocks([]);
              setView("premium");
                pushToast("success", "Paiement confirmé. Votre problématique est prise en compte. Génération directe des trois plans.");
              await generatePlansForProblematic(personalProblematic, false, saved);
            } else {
              const problematicsResponse = await fetchWithTimeout(PROBLEMATICS_API, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json", ...premiumAuthHeaders() },
                body: JSON.stringify({ project: saved, count: 3 }),
              });
              const problematicsData = await readApiResponse(problematicsResponse);
              const rawProblematicList =
                problematicsData.problematiques ||
                problematicsData.problematics ||
                problematicsData.data ||
                [];

              const problematics = Array.isArray(rawProblematicList)
                ? rawProblematicList.slice(0, 3).map((item: any, index: number) => normalizeProblematic(item, index))
                : [];

              if (!problematics.length) {
                throw new Error("Le paiement est confirmé, mais aucune problématique n’a pu être générée.");
              }

              setPremium({ problematics, plans: [] });
              setProblematicGenerationCount(Math.min(3, problematics.length));
              setPlanGenerationCount(0);
              setSelectedProblematic(null);
              setSelectedPlan(null);
              setBlocks([]);
              setView("premium");
                pushToast("success", "Paiement confirmé. Les trois problématiques sont disponibles. Sélectionnez-en une pour générer les plans un par un.");
            }
          }
        }
        // Rattacher le projet payé au compte client afin qu'il apparaisse dans le tableau de bord.
        try {
          const clientSession = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null");
          if (clientSession?.token && saved?.projectId) {
            await fetch(CLIENT_ACCOUNT_API, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "link", token: clientSession.token, projectId: saved.projectId, subject: saved.sujet || "Projet académique", paid: true }),
            });
          }
        } catch (accountLinkError) {
          console.error("[Trimémo] association du projet payé au compte client impossible", accountLinkError);
        }
        window.sessionStorage.removeItem("trimemo_pending_paypal_order");
        window.localStorage.removeItem("trimemo_project_pending");
        window.localStorage.removeItem("trimemo_preview_pending");
        window.sessionStorage.removeItem("trimemo_preview_pending");
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        // Keep the PayPal return parameters and pending project so a reload can safely resume.
        pushToast("error", error instanceof Error ? error.message : "Vérification du paiement impossible.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function pushToast(type: Toast["type"], message: string) {
    const id = Date.now();
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
  }

  function startNewClientProject() {
    // Le formulaire s’ouvre dans le parcours client, sans retour à l’accueil.
    setClientProjectFlow(true);
    // Nouveau projet = nouvel identifiant et nouveau droit de paiement.
    window.sessionStorage.removeItem("trimemo_premium_token");
    window.sessionStorage.removeItem("trimemo_premium_project_id");
    setProject({
      projectId: createProjectId(), formula: formula || "MASTER", sujet: "", domaine: "", contexte: "",
      problematiquePersonnelle: "", planPersonnel: "", consignes: "", niveau: "", typeDoc: "Mémoire",
      pages: 0, email: "", files: [],
    });
    setPreview(null);
    setEstimate(null);
    setPremium(null);
    setSelectedProblematic(null);
    setSelectedPlan(null);
    setBlocks([]);
    setSelectedWritingBlockId(null);
    setView("project");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToProject() {
    // L'achat Premium couvre uniquement le projet auquel il est rattaché.
    window.sessionStorage.removeItem("trimemo_premium_token");
    window.sessionStorage.removeItem("trimemo_premium_project_id");
    const selectedFormula = formula || project.formula || "MASTER";
    setFormula(selectedFormula);
    setEstimate(null);
    setProject((current) => ({
      ...current,
      formula: selectedFormula,
      pages: current.pages > 0 ? Math.min(current.pages, maxPagesForFormula(selectedFormula)) : 0,
      pricingQuoteToken: undefined,
    }));
    setView("project");
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ];
    const files: FileInput[] = [];
    for (const file of Array.from(fileList)) {
      if (!allowed.includes(file.type) && !/\.(pdf|docx|txt|md|jpe?g|png|webp|gif|bmp|tiff?)$/i.test(file.name)) {
        pushToast("error", `${file.name} n’est pas un format accepté.`);
        continue;
      }
      const alreadyUsed = [...project.files, ...files].reduce((sum, item) => sum + dataUrlBytes(item.content), 0);
      if (alreadyUsed + file.size > MAX_TOTAL_FILES_BYTES) {
        pushToast("error", `${file.name} dépasse la limite de 3 Mo pour l’ensemble des documents joints. Joignez un extrait (pages utiles) ou un fichier plus léger.`);
        continue;
      }
      try {
        const category: FileCategory = /(consigne|instruction|instructions|exigence|cahier\s+des\s+charges)/i.test(file.name)
          ? "instructions"
          : /(methodolog|méthodolog|guide|norme|jury|format)/i.test(file.name)
            ? "methodology"
            : /(contexte|terrain|entreprise|organisation)/i.test(file.name)
              ? "context"
              : /(source|article|étude|etude|rapport)/i.test(file.name)
                ? "source"
                : "reference";
        files.push({ name: file.name, type: file.type || "application/octet-stream", content: await readFileAsDataUrl(file), category });
      } catch {
        pushToast("error", `Impossible de lire ${file.name}.`);
      }
    }
    setProject((current) => ({ ...current, files: [...current.files, ...files] }));
  }


  function ownerAuthHeaders(): Record<string, string> {
    const token = window.sessionStorage.getItem("trimemo_owner_session");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function premiumAuthHeaders(): Record<string, string> {
    const token = window.sessionStorage.getItem("trimemo_premium_token");
    return token ? { "X-Trimemo-Premium-Token": token } : {};
  }

  async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 180000) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("La génération a dépassé le délai prévu. L’API Trimémo n’a pas répondu à temps.");
      }
      if (error instanceof TypeError && /fetch/i.test(error.message || "")) {
        throw new Error("Impossible de joindre l’API Trimémo. La requête a échoué avant réception d’une réponse serveur. Vérifiez le proxy /api de Vercel.");
      }
      throw error;
    } finally {
      window.clearTimeout(timer);
    }
  }

  function stringifyApiError(value: any): string {
    if (typeof value === "string") return value;
    if (value == null) return "";
    if (value instanceof Error) return value.message || String(value);
    if (typeof value === "object") {
      const message = value.message || value.error || value.details || value.detail;
      if (typeof message === "string") return message;
      try { return JSON.stringify(value); } catch { return String(value); }
    }
    return String(value);
  }

  async function readApiResponse(response: Response) {
    const raw = await response.text();
    let data: any = null;

    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      throw new Error(
        response.ok
          ? "Le serveur a renvoyé une réponse invalide."
          : `Le serveur a renvoyé une réponse non JSON (HTTP ${response.status}). Vérifiez que la route API est bien déployée.`
      );
    }

    if (!response.ok) {
      const base = stringifyApiError(data?.error || data?.message) || `Erreur serveur HTTP ${response.status}.`;
      const detail = data?.details ? " — " + stringifyApiError(data.details) : "";
      throw new Error(base + detail);
    }

    return data;
  }

  function navigateToSection(id: "fonctionnement" | "formules") {
    setMobileMenuOpen(false);
    setView("home");

    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  async function handleOwnerLogin() {
    setOwnerBusy(true);
    setOwnerLoginError("");
    try {
      const response = await fetch(OWNER_AUTH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: ownerEmail, password: ownerPassword }),
      });
      const data = await readApiResponse(response);
      if (!data.token) throw new Error("Session propriétaire non reçue.");
      window.sessionStorage.setItem("trimemo_owner_session", data.token);
      window.sessionStorage.setItem("trimemo_owner_email", ownerEmail.trim());
      window.sessionStorage.setItem("trimemo_owner_last_activity", String(Date.now()));
      setOwnerSessionValid(true);
      setOwnerShowWriter(false);
      setOwnerPassword("");
      setShowOwnerPassword(false);
      setView("project");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setOwnerLoginError(
        message === "Failed to fetch"
          ? "Connexion au serveur impossible. Vérifiez le déploiement de trimemo-api, son endpoint /api/owner-auth et ses paramètres CORS."
          : message || "Connexion propriétaire impossible.",
      );
    } finally {
      setOwnerBusy(false);
    }
  }

  function handleOwnerLogout() {
    window.sessionStorage.removeItem("trimemo_owner_session");
    window.sessionStorage.removeItem("trimemo_owner_email");
    window.sessionStorage.removeItem("trimemo_owner_last_activity");
    setOwnerSessionValid(false);
    setOwnerShowWriter(false);
    setOwnerEmail("");
    setOwnerPassword("");
    setShowOwnerPassword(false);
  }

  function startOwnerTest(formulaId: FormulaId) {
    const ownerProject: ProjectData = {
      ...project,
      formula: formulaId,
      email: project.email || "owner@trimemo.local",
      sujet: project.sujet || "Sujet de test académique à préciser",
      pages: project.pages,
    };
    setProject(ownerProject);
    setFormula(formulaId);
    setView("project");
    pushToast("info", `Mode propriétaire : test ${formulaId} sans paiement.`);
  }

  async function generatePublicProblematics(estimateOverride?: ProjectEstimate, projectOverride?: ProjectData) {
    const activeEstimate = estimateOverride || estimate;
    const activeProject = projectOverride || project;
    if (!activeProject.sujet.trim() || !activeEstimate || !activeProject.pricingQuoteToken) {
      pushToast("error", "Renseignez les informations du projet avant de continuer.");
      setView("project");
      return;
    }
    setLoading(true);
    setGenerationError("");
    try {
      const requestProject = { ...activeProject, pricingQuoteToken: activeProject.pricingQuoteToken };
      const personalQuestion = String(requestProject.problematiquePersonnelle || "").trim();
      let problematics: Problematic[] = [];
      if (personalQuestion) {
        problematics.push({
          id: "personal-problematic",
          title: "Problématique proposée par le client",
          question: personalQuestion,
          rationale: "Problématique fournie par le client.",
          angle: "Approche définie par le client",
        });
      } else {
        const response = await fetchWithTimeout(PROBLEMATICS_API, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ project: projectPayloadWithoutFiles(requestProject), count: 1, problematicAction: "new" }),
        }, 280000);
        const data = await readApiResponse(response);
        const rawList = data.problematiques || data.problematics || data.data || [];
        problematics = Array.isArray(rawList) ? rawList.slice(0, 1).map((item: any, index: number) => normalizeProblematic(item, index)) : [];
      }
      if (!problematics.length) throw new Error("Aucune problématique n’a été retournée.");
      setProject(requestProject);
      setPremium({ problematics, plans: [] });
      setProblematicGenerationCount(Math.max(1, problematics.length));
      setPlanGenerationCount(0);
      setSelectedProblematic(null);
      setSelectedPlan(null);
      setBlocks([]);
      setPremiumSection("problematic");
      setPremiumNav("problematic-0");
      setView("premium");
      pushToast("success", "Première problématique générée. Vous pouvez la commenter, l’améliorer ou demander une autre proposition, dans la limite de trois.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de générer la problématique.";
      setGenerationError(message);
      pushToast("error", message);
    } finally {
      setLoading(false);
    }
  }

  async function generateOwnerPremium() {
    if (!ownerSessionValid) {
      pushToast("error", "Connectez-vous à l’espace administrateur.");
      return;
    }
    if (!project.sujet.trim()) {
      pushToast("error", "Le sujet est obligatoire.");
      setView("project");
      return;
    }

    const ownerProject: ProjectData = {
      ...project,
      email: project.email || "owner@trimemo.local",
    };

    const personalQuestion = String(ownerProject.problematiquePersonnelle || ownerProject.problematique || "").trim();
    if (personalQuestion) {
      const personalProblematic: Problematic = {
        id: "personal-problematic",
        title: "Problématique fournie par l'administrateur",
        question: personalQuestion,
        rationale: "Problématique saisie par l'administrateur et conservée telle quelle.",
        angle: "Approche définie par l'utilisateur",
      };
      setProject(ownerProject);
      setPremium({ problematics: [personalProblematic], plans: [] });
      setPremiumNav("plan-0");
      setPremiumSection("problematic");
      setSelectedProblematic(personalProblematic);
      setSelectedPlan(null);
      setBlocks([]);
      setView("premium");
      pushToast("info", "Problématique fournie détectée. Passage direct à la génération des trois plans.");
      await generatePlansForProblematic(personalProblematic, true, ownerProject);
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithTimeout(PROBLEMATICS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify({ project: ownerProject, count: 3, ownerMode: true }),
      }, 280000);
      const data = await readApiResponse(response);
      window.sessionStorage.setItem("trimemo_owner_last_activity", String(Date.now()));
      const rawList = data.problematiques || data.problematics || data.data || [];
      if (!Array.isArray(rawList) || rawList.length === 0) {
        throw new Error("Aucune problématique n’a été générée.");
      }

      const generatedProblematics = Array.isArray(rawList)
        ? rawList.slice(0, 3).map((item: any, index: number) => normalizeProblematic(item, index))
        : [];
      const personalProblematic = ownerProject.problematiquePersonnelle.trim()
        ? [{
            id: "personal-problematic",
            title: "Problématique personnelle fournie",
            question: ownerProject.problematiquePersonnelle.trim(),
            rationale: "Proposition saisie par l’administrateur. Elle doit être vérifiée avant validation.",
            angle: "Problématique imposée par l’utilisateur",
          } as Problematic]
        : [];
      const problematics = [...personalProblematic, ...generatedProblematics];
      if (!problematics.length) {
        throw new Error("Aucune problématique n’a été générée et aucune problématique personnelle n’a été fournie.");
      }

      setProject(ownerProject);
      setPremium({ problematics, plans: [] });
      setProblematicGenerationCount(Math.min(3, problematics.length));
      setPlanGenerationCount(0);
      setPremiumNav("problematic-0");
      setSelectedProblematic(null);
      setSelectedPlan(null);
      setBlocks([]);
      setView("premium");
      pushToast("success", "Les problématiques ont été générées. Sélectionnez-en une pour générer les plans.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Impossible de générer les problématiques.");
    } finally {
      setLoading(false);
    }
  }

  async function generateProblematicVariant(action: "alternative" | "improve", currentProblematic: Problematic, comments = "") {
    const existing = premium?.problematics || [];
    if (problematicGenerationCount >= 3) { pushToast("info", "La limite de trois propositions de problématique est atteinte."); return; }
    if (action === "improve" && !comments.trim()) { pushToast("error", "Décrivez les améliorations souhaitées."); return; }
    if (!project.pricingQuoteToken || !estimate) { pushToast("error", "Lancez d'abord l'analyse du projet."); return; }
    setLoading(true); setGenerationError("");
    try {
      const response = await fetchWithTimeout(PROBLEMATICS_API, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ project: projectPayloadWithoutFiles({ ...project, pricingQuoteToken: project.pricingQuoteToken }), count: 1, problematicAction: action, currentProblematic, improvementComments: comments, rejectedProblematics: existing.filter((item) => item.id !== currentProblematic.id) }),
      }, 280000);
      const data = await readApiResponse(response);
      const raw = (data.problematiques || data.problematics || data.data || [])[0];
      if (!raw?.question) throw new Error("Le serveur n'a pas retourné une nouvelle problématique exploitable.");
      const next = normalizeProblematic({ ...raw, id: `problematic-${Date.now()}` }, existing.length);
      setPremium((current) => {
        const base = current || { problematics: [], plans: [] };
        if (action === "improve") return { ...base, problematics: base.problematics.map((item) => item.id === currentProblematic.id ? next : item) };
        return { ...base, problematics: [...base.problematics, next].slice(0, 3) };
      });
      setProblematicGenerationCount((count) => Math.min(3, count + 1));
      setPremiumNav(`problematic-${action === "improve" ? Math.max(0, existing.findIndex((item) => item.id === currentProblematic.id)) : existing.length}`);
      setSelectedProblematic(null); setSelectedPlan(null); setBlocks([]);
      setProblematicImprovementComments((current) => ({ ...current, [currentProblematic.id]: "" }));
      pushToast("success", action === "improve" ? "La problématique a été améliorée." : `Proposition ${existing.length + 1} sur 3 générée.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de générer cette problématique.";
      setGenerationError(message); pushToast("error", message);
    } finally { setLoading(false); }
  }

  async function generatePlansForProblematic(problematic: Problematic, ownerMode = false, projectOverride?: ProjectData, options?: { action?: "new" | "alternative" | "improve"; currentPlan?: Plan; comments?: string }) {
    if (ownerMode && !ownerSessionValid) {
      pushToast("error", "Connectez-vous à l’espace administrateur.");
      return;
    }
    if (!premium && !ownerMode) {
      pushToast("error", "Le projet premium n’est pas encore disponible.");
      return;
    }

    const baseProject = projectOverride || project;
    const action = options?.action || "new";
    const currentPlan = options?.currentPlan;
    const comments = String(options?.comments || "").trim();
    const existingPlans = premium?.plans || [];
    if (planGenerationCount >= 3 || ((action === "new" || action === "alternative") && existingPlans.length >= 3)) {
      pushToast("info", "Vous avez atteint la limite de trois générations de plan pour ce projet.");
      return;
    }
    if (action === "improve" && !currentPlan) {
      pushToast("error", "Sélectionnez le plan à améliorer.");
      return;
    }
    if (action === "improve" && !comments) {
      pushToast("error", "Décrivez les modifications souhaitées avant de demander une amélioration.");
      return;
    }

    const requestProject: ProjectData = { ...baseProject, email: baseProject.email || (ownerMode ? "owner@trimemo.local" : baseProject.email) };
    setSelectedProblematic(problematic);
    setGenerationError("");
    setLoading(true);

    try {
      const rejectedPlans = existingPlans.filter((item) => item.id !== currentPlan?.id).slice(0, 3);
      const response = await fetchWithTimeout(PLANS_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(ownerMode ? ownerAuthHeaders() : premiumAuthHeaders()),
        },
        body: JSON.stringify({
          project: ownerMode ? requestProject : projectPayloadWithoutFiles(requestProject),
          problematic,
          count: 1,
          ownerMode,
          planAction: action,
          currentPlan: currentPlan || null,
          improvementComments: comments,
          rejectedPlans,
        }),
      }, 280000);

      const data = await readApiResponse(response);
      const raw = data.plan || data.plans?.[0] || data.data?.plan || data.data?.plans?.[0];
      if (!raw) throw new Error("Le serveur n’a pas retourné de plan académique.");
      const generatedPlan = normalizePlan(raw, action === "improve" ? existingPlans.findIndex((item) => item.id === currentPlan?.id) : existingPlans.length);

      setPlanGenerationCount((count) => Math.min(3, count + 1));
      setPremium((current) => {
        const base = current || { problematics: [problematic], plans: [] as Plan[] };
        if (action === "improve" && currentPlan) {
          return { ...base, plans: base.plans.map((item) => item.id === currentPlan.id ? generatedPlan : item) };
        }
        return { ...base, plans: [...base.plans, generatedPlan] };
      });
      setPremiumNav(action === "improve" ? "plan-" + Math.max(0, existingPlans.findIndex((item) => item.id === currentPlan?.id)) : "plan-" + existingPlans.length);
      setPremiumSection("plan");
      setSelectedPlan(null);
      setBlocks([]);
      if (action === "improve" && currentPlan) {
        setPlanImprovementComments((current) => ({ ...current, [currentPlan.id]: "" }));
        pushToast("success", "Le plan a été amélioré selon vos commentaires.");
      } else {
        pushToast("success", existingPlans.length === 0 ? "Le premier plan est prêt. Vous pouvez le valider, l’améliorer ou générer un autre plan." : `Plan ${existingPlans.length + 1} généré. Vous pouvez le valider, l’améliorer ou poursuivre.`);
      }
    } catch (error) {
      const message = error instanceof Error ? (error.message || "Impossible de générer le plan.") : stringifyApiError(error) || "Impossible de générer le plan.";
      setGenerationError(message);
      pushToast("error", message);
    } finally {
      setLoading(false);
    }
  }

  async function generateOwnerPlans(problematic: Problematic) {
    return generatePlansForProblematic(problematic, true);
  }

  function simulateOwnerPayment() {
    if (!ownerSessionValid) {
      pushToast("error", "Connectez-vous à l’espace propriétaire.");
      return;
    }
    pushToast("success", "Paiement simulé. Aucune transaction réelle n’a été exécutée.");
  }

  async function analyzeProject() {
    if (!project.sujet.trim()) {
      pushToast("error", "Le sujet est obligatoire.");
      return;
    }
    if (!project.niveau.trim() || !project.typeDoc.trim() || !project.domaine.trim()) {
      pushToast("error", "Renseignez le niveau académique, le domaine et le type de document avant l'analyse.");
      return;
    }
    if (!Number.isInteger(project.pages) || project.pages < 1 || project.pages > 300) {
      pushToast("error", "Indiquez un volume compris entre 1 et 300 pages.");
      return;
    }
    setGenerationError("");
    setEstimate(null);
    setLoading(true);
    try {
      const response = await fetchWithTimeout(ESTIMATE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ project }),
      }, 90000);
      const data = await readApiResponse(response);
      if (!data?.estimate?.pricingQuoteToken) throw new Error("L'estimation du projet n'a pas été signée par le serveur.");
      const analyzedEstimate = data.estimate as ProjectEstimate;
      const analyzedProject: ProjectData = {
        ...project,
        country: String(data.estimate.country || ""),
        pricingQuoteToken: String(data.estimate.pricingQuoteToken),
      };
      // L’estimation est calculée et conservée, mais elle reste masquée jusqu’à l’aperçu final.
      setEstimate(analyzedEstimate);
      setProject(analyzedProject);
      await generatePublicProblematics(analyzedEstimate, analyzedProject);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'analyser le projet.";
      setGenerationError(message);
      pushToast("error", message);
    } finally {
      setLoading(false);
    }
  }

  async function generateFreePreview(chosenProblematic?: Problematic, chosenPlan?: Plan) {
    if (!project.sujet.trim()) {
      pushToast("error", "Le sujet est obligatoire.");
      return;
    }
    if (!estimate || !project.pricingQuoteToken) {
      pushToast("error", "Analysez d'abord le projet pour obtenir une estimation du coût.");
      setView("project");
      return;
    }
    setGenerationError("");
    setPreview(null);
    setLoading(true);
    try {
      const response = await fetchWithTimeout(FREE_PREVIEW_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ project: projectPayloadWithoutFiles(project), problematic: chosenProblematic || selectedProblematic, plan: chosenPlan || selectedPlan, count: 1, freePreview: true }),
      }, 280000);
      const data = await readApiResponse(response);

      const problematicRaw = data?.problematic || data?.problematique;
      const planRaw = data?.plan;
      const introductionRaw = data?.introduction;
      if (!problematicRaw?.question) {
        throw new Error("La problématique proposée n’a pas été retournée par le serveur.");
      }
      if (!planRaw?.parts?.length) {
        throw new Error("Le plan proposé n’a pas été retourné par le serveur.");
      }
      if (!introductionRaw?.content) {
        throw new Error("L’aperçu de l’introduction n’a pas été retourné par le serveur.");
      }
      if (!data?.chapterOne?.content) {
        throw new Error("Le premier chapitre de validation n’a pas été retourné par le serveur.");
      }

      const problematic = normalizeProblematic(problematicRaw, 0);
      const plan = normalizePlan(planRaw, 0);
      const introductionContent = String(introductionRaw.content).trim();

      const generatedPreview: Preview = {
        problematic,
        plan,
        introduction: {
          title: introductionRaw.title || "Introduction générale",
          content: introductionContent,
          wordCount: countWords(introductionContent),
          incomplete: true,
        },
        chapterOne: {
          title: String(data.chapterOne.title || plan.parts[0]?.chapters[0]?.title || "Chapitre 1"),
          content: String(data.chapterOne.content || "").trim(),
          wordCount: Number(data.chapterOne.wordCount || countWords(String(data.chapterOne.content || ""))),
          partTitle: String(data.chapterOne.partTitle || plan.parts[0]?.title || ""),
          chapterNumber: Number(data.chapterOne.chapterNumber || 1),
          sectionTitles: Array.isArray(data.chapterOne.sectionTitles) ? data.chapterOne.sectionTitles : [],
        },
      };
      setPreview(generatedPreview);
      savePendingProject({ ...project, pricingQuoteToken: project.pricingQuoteToken || estimate.pricingQuoteToken });
      savePendingPreview(generatedPreview);
      setPreviewTab("problematic");
      setView("preview");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de préparer l’aperçu avant paiement.";
      setGenerationError(message);
      pushToast("error", message);
    } finally {
      setLoading(false);
    }
  }

  async function loadClientProjects() {
    let session: { token: string; refreshToken?: string; expiresAt?: number | string | null; email?: string; userId?: string } | null = null;
    try { session = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
    if (!session?.token) {
      setClientAuthMode("login");
      setClientAuthError("");
      setView("account");
      return;
    }
    const refreshSession = async () => {
      if (!session?.refreshToken) return false;
      const rr = await fetch(CLIENT_ACCOUNT_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "refresh", refreshToken: session.refreshToken }) });
      const rd = await rr.json().catch(() => ({}));
      if (!rr.ok || !rd.token) return false;
      session = { ...session!, token: String(rd.token), refreshToken: String(rd.refresh_token || session!.refreshToken || ""), expiresAt: rd.expires_at || null, email: String(rd.user?.email || session!.email || ""), userId: String(rd.user?.id || session!.userId || "") };
      window.localStorage.setItem("trimemo_client_session", JSON.stringify(session));
      return true;
    };
    try {
      let response = await fetch(CLIENT_ACCOUNT_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "list", token: session.token }) });
      if (response.status === 401 && await refreshSession()) {
        response = await fetch(CLIENT_ACCOUNT_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "list", token: session!.token }) });
      }
      const data = await readApiResponse(response);
      setClientProjects(Array.isArray(data.projects) ? data.projects : []);
      setClientEmailDisplay(String(data.user?.email || session.email || ""));
      try {
        let rr = await fetch(`${API_BASE_URL}/api/admin-console`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "revision-client-list", token: session.token }) });
        if (rr.status === 401 && await refreshSession()) {
          rr = await fetch(`${API_BASE_URL}/api/admin-console`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "revision-client-list", token: session!.token }) });
        }
        const rd = await rr.json().catch(() => ({}));
        if (rr.ok) setClientRevisions(Array.isArray(rd.requests) ? rd.requests : []);
        else pushToast("error", String(rd.error || "Les demandes de révision n’ont pas pu être actualisées."));
      } catch {
        pushToast("error", "Connexion momentanément indisponible pour les demandes de révision. Réessayez sans vous déconnecter.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de charger votre espace client.";
      pushToast("error", message);
      if (/session a expiré|connectez-vous/i.test(message) && !session.refreshToken) {
        setClientAuthMode("login");
        setClientAuthError(message);
        setView("account");
      }
    }
  }

  async function downloadClientRevision(id:string) {
    try {
      const session=JSON.parse(window.localStorage.getItem("trimemo_client_session")||"null");
      if(!session?.token) throw new Error("Connectez-vous pour récupérer le document.");
      const response=await fetch(`${API_BASE_URL}/api/admin-console`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"revision-client-file",token:session.token,id})});
      const data=await readApiResponse(response);
      const binary=atob(data.base64);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      const url=URL.createObjectURL(new Blob([bytes],{type:data.type||"application/octet-stream"}));const link=document.createElement("a");link.href=url;link.download=data.name||"document-corrige";link.click();URL.revokeObjectURL(url);
    } catch(e) { pushToast("error",e instanceof Error?e.message:"Téléchargement impossible."); }
  }

  async function submitHumanRevision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setRevisionError(""); setRevisionMessage("");
    if (!revisionFile) { setRevisionError("Joignez le document exporté à faire corriger."); return; }
    if (revisionFile.size > 3 * 1024 * 1024) { setRevisionError("Le fichier doit faire moins de 3 Mo."); return; }
    let session: {token:string;email?:string} | null = null;
    try { session = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
    if (!session?.token) { setRevisionError("Connectez-vous à votre compte pour envoyer une demande de révision."); return; }
    if (revisionInstructions.trim().length < 10) { setRevisionError("Précisez les corrections attendues (10 caractères minimum)."); return; }
    setRevisionSubmitting(true);
    try {
      const base64 = await new Promise<string>((resolve,reject) => { const reader=new FileReader(); reader.onload=()=>resolve(String(reader.result||"").split(",")[1]||""); reader.onerror=()=>reject(new Error("Lecture du fichier impossible.")); reader.readAsDataURL(revisionFile); });
      const response=await fetch(`${API_BASE_URL}/api/admin-console`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"revision-submit",token:session.token,projectId:revisionTargetProjectId,documentTitle:revisionTargetTitle||"Document Trimémo",instructions:revisionInstructions,file:{name:revisionFile.name,type:revisionFile.type,base64}})});
      const data=await readApiResponse(response);
      setRevisionMessage(data.message||"Demande envoyée.");
      setRevisionInstructions(""); setRevisionFile(null);
      await loadClientProjects();
    } catch(e) { setRevisionError(e instanceof Error?e.message:"Envoi de la demande impossible."); }
    finally { setRevisionSubmitting(false); }
  }

  async function openClientProject(projectId: string) {
    let session: { token: string; email?: string } | null = null;
    try { session = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
    if (!session?.token) {
      setClientAuthMode("login");
      setClientAuthError("Connectez-vous pour ouvrir vos projets.");
      setView("account");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(CLIENT_ACCOUNT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume", token: session.token, projectId }),
      });
      const data = await readApiResponse(response);
      if (!data.state?.project) throw new Error("Le contenu du projet n'a pas été retourné par le serveur.");
      const saved = data.state;
      const remoteProject = { ...saved.project, projectId, files: [] };
      setProject(remoteProject);
      setFormula(saved.formula || saved.project.formula || null);
      setPreview(saved.preview || null);
      setEstimate(saved.estimate || null);
      setPremium(saved.premium || null);
      setSelectedProblematic(saved.selectedProblematic || null);
      setSelectedPlan(saved.selectedPlan || null);
      setBlocks(Array.isArray(saved.blocks) ? saved.blocks : []);
      setPreviewTab(saved.previewTab || "problematic");
      setPremiumNav(saved.premiumNav || "writing");
      setPremiumSection(saved.premiumSection || "writing");
      // Toujours reprendre au premier bloc incomplet. Un ancien identifiant sélectionné ne doit jamais ramener à l'introduction déjà rédigée.
      setSelectedWritingBlockId(
        saved.blocks?.find((block: Block) => block.status !== "done" || !String(block.content || "").trim())?.id
        || saved.blocks?.find((block: Block) => block.id === saved.selectedWritingBlockId)?.id
        || saved.blocks?.[0]?.id
        || null
      );
      setProblematicImprovementComments(saved.problematicImprovementComments || {});
      setPlanImprovementComments(saved.planImprovementComments || {});
      setProblematicGenerationCount(Number(saved.problematicGenerationCount || 0));
      setPlanGenerationCount(Number(saved.planGenerationCount || 0));
      if (data.premium_token) {
        window.sessionStorage.setItem("trimemo_premium_token", String(data.premium_token));
        window.sessionStorage.setItem("trimemo_premium_project_id", projectId);
      } else {
        window.sessionStorage.removeItem("trimemo_premium_token");
        window.sessionStorage.removeItem("trimemo_premium_project_id");
      }
      setClientEmailDisplay(String(session.email || ""));
      setView("writing");
      setWritingTab("writing");
      window.history.replaceState({}, document.title, window.location.pathname);
      pushToast("success", data.project?.payment_status === "paid"
        ? "Projet payé restauré. Vous pouvez poursuivre la rédaction, puis revenir plus tard."
        : "Projet restauré. La poursuite de la rédaction nécessitera le paiement Premium.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de restaurer ce projet.";
      pushToast("error", message);
    } finally {
      setLoading(false);
    }
  }

  async function submitClientAuth() {
    setClientAuthBusy(true);
    setClientAuthError("");
    setClientAuthNotice("");
    try {
      if (clientAuthMode === "forgot" || clientAuthMode === "reset") {
        const response = await fetch(CLIENT_ACCOUNT_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clientAuthMode === "forgot"
            ? { action: "forgot-password", email: clientEmail.trim() }
            : { action: "reset-password", recoveryToken: clientRecoveryToken, password: clientPassword }),
        });
        const data = await readApiResponse(response);
        setClientPassword("");
        if (clientAuthMode === "forgot") {
          setClientAuthNotice(data.message || "Si un compte correspond à cette adresse, un lien de réinitialisation sera envoyé.");
        } else {
          setClientAuthMode("login");
          setClientRecoveryToken("");
          window.history.replaceState({}, document.title, window.location.pathname);
          setClientAuthNotice(data.message || "Mot de passe modifié. Vous pouvez maintenant vous connecter.");
        }
        return;
      }
      const response = await fetch(CLIENT_ACCOUNT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: clientAuthMode, firstName: clientFirstName.trim(), lastName: clientLastName.trim(), email: clientEmail.trim(), password: clientPassword }),
      });
      const data = await readApiResponse(response);
      if (!data.token || !data.user?.id) throw new Error("Le compte a été traité, mais aucune session sécurisée n'a été retournée.");
      const session = { token: String(data.token), refreshToken: String(data.refresh_token || ""), expiresAt: data.expires_at || null, email: String(data.user.email || clientEmail.trim()), userId: String(data.user.id) };
      window.localStorage.setItem("trimemo_client_session", JSON.stringify(session));
      setClientEmailDisplay(session.email);
      setClientPassword("");

      // Ne créer une entrée de projet que si un vrai sujet est déjà renseigné.
      if (String(project.sujet || "").trim()) {
        const persistedProject = { ...project, files: project.files.map(({ name, type, category }) => ({ name, type, category, content: "" })) };
        const state = {
          project: persistedProject, formula, preview, estimate, premium, selectedProblematic, selectedPlan, blocks,
          view: "preview", previewTab, premiumNav, premiumSection, selectedWritingBlockId,
          problematicImprovementComments, planImprovementComments, problematicGenerationCount, planGenerationCount,
        };
        const saveResponse = await fetch(PROJECT_STATE_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: project.projectId, state }),
        });
        const saveData = await saveResponse.json().catch(() => ({}));
        if (!saveResponse.ok) throw new Error(saveData.error || "Le projet n'a pas pu être sauvegardé avant l'association au compte.");

        const linkResponse = await fetch(CLIENT_ACCOUNT_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "link", token: session.token, projectId: project.projectId, subject: project.sujet, paid: false }),
        });
        const linkData = await readApiResponse(linkResponse);
        if (!linkData.success) throw new Error("Le projet n'a pas pu être associé au compte client.");
      }

      pushToast("success", clientAuthMode === "signup" ? "Compte créé. Votre projet est enregistré dans votre espace." : String(project.sujet || "").trim() ? "Connexion réussie. Votre projet est associé à votre compte." : "Connexion réussie. Chargement de votre espace client.");
      if (pendingPaymentMethod) {
        const method = pendingPaymentMethod;
        setPendingPaymentMethod(null);
        setView("preview");
        await startPayment(method);
      } else {
        setView("dashboard");
        await loadClientProjects();
      }
    } catch (error) {
      setClientAuthError(error instanceof Error ? error.message : "La création du compte ou la connexion a échoué.");
    } finally {
      setClientAuthBusy(false);
    }
  }

  async function startPayment(method: "paypal" | "mobile-money") {
    let clientSession: { token: string; email?: string } | null = null;
    try { clientSession = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
    if (!clientSession?.token) {
      try {
        const pendingState = {
          project: (() => { const { paidPreviewSnapshot, ...savedProject } = project; return { ...savedProject, files: [] }; })(),
          formula, preview, estimate, premium, selectedProblematic, selectedPlan, blocks,
          view: "account", previewTab, premiumNav, premiumSection, selectedWritingBlockId,
          problematicImprovementComments, planImprovementComments, problematicGenerationCount, planGenerationCount,
        };
        window.localStorage.setItem(stateStorageKey, JSON.stringify(pendingState));
        savePendingProject(project);
      } catch (saveError) {
        console.error("[Trimémo] impossible de sauvegarder avant création du compte", saveError);
      }
      window.location.href = "/?account=signup&method=" + encodeURIComponent(method);
      return;
    }
    if (!estimate || !project.pricingQuoteToken) {
      pushToast("error", "Relancez l'analyse du projet avant le paiement.");
      setView("project");
      return;
    }
    if (!selectedProblematic || !selectedPlan || !preview) {
      pushToast("error", "Validez une problématique, un plan et consultez l'aperçu avant le paiement.");
      setView("premium");
      return;
    }
    if (project.formula === "AUTRE") {
      pushToast("info", "La formule « Autre besoin » nécessite un devis personnalisé. Contactez-nous pour cette demande.");
      return;
    }
    setPaymentLoading(method);
    const paymentProject: ProjectData = { ...project, paymentProblematicId: selectedProblematic.id, paymentPlanId: selectedPlan.id, paidPreviewSnapshot: preview || undefined };
    setProject(paymentProject);
    try {
      if (!savePendingProject(paymentProject) && paymentProject.files.length) {
        pushToast("info", "Espace de stockage du navigateur insuffisant : vos documents joints devront peut-être être rattachés à nouveau après le paiement.");
      }
      const response = await fetch(`${API_URL}?action=${method === "paypal" ? "create-paypal-order" : "create-mobile-money"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: projectPayloadWithoutFiles(paymentProject, true) }),
      });
      const data = await readApiResponse(response);
      if (!data.url) throw new Error("Aucune URL de paiement n’a été retournée.");
      if (method === "paypal" && data.id) {
        window.sessionStorage.setItem("trimemo_pending_paypal_order", String(data.id));
      }
      // Forcer une sauvegarde locale immédiatement avant de quitter la plateforme.
      try {
        const state = {
          project: (() => { const { paidPreviewSnapshot, ...savedProject } = paymentProject; return { ...savedProject, files: [] }; })(),
          formula, preview, estimate, premium, selectedProblematic, selectedPlan, blocks,
          view: "preview", previewTab, premiumNav, premiumSection, selectedWritingBlockId,
          problematicImprovementComments, planImprovementComments, problematicGenerationCount, planGenerationCount,
        };
        window.localStorage.setItem(stateStorageKey, JSON.stringify(state));
      } catch {}
      window.location.href = data.url;
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Impossible d’initialiser le paiement.");
      setPaymentLoading(null);
    }
  }

  function prepareBlocks(plan: Plan) {
    const toRoman = (value: number) => {
      const table: Array<[number, string]> = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
      let rest = Math.max(1, Math.round(value));
      let out = "";
      for (const [amount, symbol] of table) {
        while (rest >= amount) { out += symbol; rest -= amount; }
      }
      return out;
    };

    const partLabel = (part: PlanPart) => `PARTIE ${toRoman(part.number)} : ${part.title}`;
    const chapterLabel = (chapter: PlanChapter) => `CHAPITRE ${chapter.number} : ${chapter.title}`;
    const sectionLabel = (chapter: PlanChapter, section: PlanSection) => `SECTION ${chapter.number}.${section.number} : ${section.title}`;
    const subsectionLabel = (chapter: PlanChapter, section: PlanSection, subsection: PlanSubsection) =>
      `${chapter.number}.${section.number}.${subsection.number} : ${subsection.title}`;
    const internalLabel = (chapter: PlanChapter, section: PlanSection, subsection: PlanSubsection, internal: PlanInternalTitle) =>
      `${chapter.number}.${section.number}.${subsection.number}.${internal.number} : ${internal.title}`;

    const introductionConfig = plan.introductionGeneral || { title: "Introduction générale", wordCount: 900 };
    const conclusionConfig = plan.conclusionGeneral || { title: "Conclusion générale", wordCount: 600 };
    const introductionWords = Math.min(1000, Math.max(100, Math.round(Number(introductionConfig.wordCount || 900))));
    const introductionBlock: Block = {
      id: `${plan.id}-introduction-generale`,
      title: introductionConfig.title || "Introduction générale",
      expectedWords: introductionWords,
      content: "",
      wordCount: 0,
      status: "pending",
      sources: [],
      footnotes: [],
      structure: ["Introduction générale"],
      kind: "introduction",
    };

    /*
     * Un bloc de rédaction vise environ 900 mots.
     * Un même bloc peut contenir plusieurs sous-sections et leurs titres internes.
     * On conserve toujours l'ordre du plan et on ne coupe jamais une sous-section.
     */
    const safeParts = Array.isArray(plan.parts) ? plan.parts : [];
    const chapterBlocks = safeParts.flatMap((part) =>
      (Array.isArray(part.chapters) ? part.chapters : []).flatMap((chapter, chapterIndex) => {
        /*
         * L'unité minimale de regroupement est la SECTION.
         * Une section et toutes ses sous-sections/titres internes restent ensemble.
         * Le seuil de 900 mots est une cible, jamais une contrainte.
         */
        const sectionUnits = (Array.isArray(chapter.sections) ? chapter.sections : []).map((section) => ({
          id: section.id,
          title: section.title,
          // Chaque unité porte son propre titre. Les titres parents sont ajoutés
          // uniquement au premier bloc réel de la partie/du chapitre.
          structure: [
            sectionLabel(chapter, section),
            ...(Array.isArray(section.subsections) ? section.subsections : []).flatMap((subsection) => [
              subsectionLabel(chapter, section, subsection),
              ...(Array.isArray(subsection.internalTitles) ? subsection.internalTitles : []).map((internal) =>
                internalLabel(chapter, section, subsection, internal)
              ),
            ]),
          ],
        }));

        if (!sectionUnits.length) {
          return [{
            id: `${chapter.id}-bloc-1`,
            title: chapter.title,
            expectedWords: Math.max(100, Math.round(Number(chapter.wordCount || 900))),
            content: "",
            wordCount: 0,
            status: "pending" as const,
            sources: [],
            footnotes: [],
            structure: [
              ...(chapterIndex === 0 ? [partLabel(part)] : []),
              chapterLabel(chapter),
            ],
            kind: "chapter" as const,
          }];
        }

        const chapterWords = Math.max(300, Math.round(Number(chapter.wordCount || 900)));
        const estimatedSectionWords = chapterWords / sectionUnits.length;
        const groups: Array<typeof sectionUnits> = [];
        let current: typeof sectionUnits = [];
        let currentWords = 0;

        for (const section of sectionUnits) {
          const nextWords = currentWords + estimatedSectionWords;

          /*
           * On ne coupe jamais une section.
           * On vise environ 900 mots lorsque le regroupement reste cohérent.
           * Une section peut donc constituer seule un bloc de 500, 700, 1 100
           * ou davantage de mots si sa densité scientifique le justifie.
           */
          if (
            current.length > 0 &&
            currentWords >= 600 &&
            nextWords > 1100
          ) {
            groups.push(current);
            current = [];
            currentWords = 0;
          }

          current.push(section);
          currentWords += estimatedSectionWords;
        }

        if (current.length) groups.push(current);

        return groups.map((group, groupIndex) => {
          const groupWords = Math.round(
            chapterWords * group.length / sectionUnits.length
          );
          const structure = [
            ...(groupIndex === 0
              ? [
                  ...(chapterIndex === 0 ? [partLabel(part)] : []),
                  chapterLabel(chapter),
                ]
              : []),
            ...group.flatMap((unit) => unit.structure),
          ];
          const title = group.length === 1
            ? group[0].title
            : group.map((unit) => unit.title).join(" + ");

          return {
            id: `${chapter.id}-bloc-${groupIndex + 1}`,
            title,
            expectedWords: Math.min(1000, Math.max(100, groupWords || 900)),
            content: "",
            wordCount: 0,
            status: "pending" as const,
            sources: [],
            footnotes: [],
            structure,
            kind: groupIndex === 0 ? "chapter" as const : "section" as const,
          };
        });
      }),
    );

    const conclusionBlock: Block = {
      id: `${plan.id}-conclusion-generale`,
      title: conclusionConfig.title || "Conclusion générale",
      expectedWords: Math.min(1500, Math.max(300, Math.round(Number(conclusionConfig.wordCount || 600)))),
      content: "",
      wordCount: 0,
      status: "pending",
      sources: [],
      footnotes: [],
      structure: ["Conclusion générale"],
      kind: "conclusion",
    };

    const preparedBlocks = [introductionBlock, ...chapterBlocks, conclusionBlock];
    setBlocks(preparedBlocks);
    return preparedBlocks;
  }

  function selectPremiumPlan(problematic: Problematic, plan: Plan) {
    // Valider un plan doit ouvrir l'espace de rédaction, comme dans l'espace propriétaire.
    // La sélection ne déclenche plus une génération automatique d'aperçu générique.
    setSelectedProblematic(problematic);
    setSelectedPlan(plan);
    setPreview(null);
    let preparedBlocks: Block[] = [];
    try {
      preparedBlocks = prepareBlocks(plan);
    } catch (error) {
      console.error("Trimémo: préparation des blocs impossible", error);
      // Préserver un espace de rédaction utilisable même si le plan est incomplet.
      preparedBlocks = [{
        id: `${plan.id || "plan"}-introduction-generale`,
        title: plan.introductionGeneral?.title || "Introduction générale",
        expectedWords: 900,
        content: "",
        wordCount: 0,
        status: "pending",
        sources: [],
        footnotes: [],
        structure: ["Introduction générale"],
        kind: "introduction",
      }, {
        id: `${plan.id || "plan"}-conclusion-generale`,
        title: plan.conclusionGeneral?.title || "Conclusion générale",
        expectedWords: 600,
        content: "",
        wordCount: 0,
        status: "pending",
        sources: [],
        footnotes: [],
        structure: ["Conclusion générale"],
        kind: "conclusion",
      }];
      setGenerationError("La structure du plan est incomplète. Les blocs essentiels sont affichés ; vérifiez le plan pour reconstruire les autres blocs.");
    }
    if (!preparedBlocks.length) {
      preparedBlocks = [{
        id: `${plan.id || "plan"}-introduction-generale`,
        title: plan.introductionGeneral?.title || "Introduction générale",
        expectedWords: 900,
        content: "",
        wordCount: 0,
        status: "pending",
        sources: [],
        footnotes: [],
        structure: ["Introduction générale"],
        kind: "introduction",
      }, {
        id: `${plan.id || "plan"}-conclusion-generale`,
        title: plan.conclusionGeneral?.title || "Conclusion générale",
        expectedWords: 600,
        content: "",
        wordCount: 0,
        status: "pending",
        sources: [],
        footnotes: [],
        structure: ["Conclusion générale"],
        kind: "conclusion",
      }];
      setGenerationError("Le plan ne contient aucune partie exploitable. Les blocs essentiels sont affichés, mais le plan doit être vérifié.");
    }
    setBlocks(preparedBlocks);
    setSelectedWritingBlockId(preparedBlocks[0]?.id || null);
    setPremiumNav("writing");
    setPremiumSection("writing");
    setView("writing");
  }

  async function generateBlock(blockId: string) {
    if (!selectedProblematic || !selectedPlan) {
      const message = "Sélectionnez une problématique et un plan avant de rédiger.";
      pushToast("error", message);
      setBlocks((current) => current.map((item) => item.id === blockId ? { ...item, status: "pending", error: message } : item));
      return;
    }

    const block = blocks.find((item) => item.id === blockId);
    if (!block) {
      const message = "Bloc introuvable dans la structure de rédaction.";
      pushToast("error", message);
      return;
    }

    if (block.status === "generating") return;
    if (!ownerRoute && !(window.sessionStorage.getItem("trimemo_premium_token") && window.sessionStorage.getItem("trimemo_premium_project_id") === String(project.projectId))) {
      const completedBlocks = blocks.filter((item) => item.status === "done" && item.content.trim());
      const completedWords = completedBlocks.reduce((sum, item) => sum + countWords(item.content), 0);
      if (completedWords >= 2500) {
        // Une fois les 2 500 mots atteints, tout nouveau bloc ouvre l’aperçu verrouillé.
        setSelectedWritingBlockId(blockId);
        await exportDocument();
        return;
      }
      if (!estimate || !project.pricingQuoteToken) {
        const message = "Analysez d’abord le projet pour obtenir une estimation avant de générer l’aperçu.";
        pushToast("error", message);
        setView("project");
        return;
      }
      // Un clic ne rédige qu'un seul bloc, avec une cible maximale de 1 000 mots.
      setActiveBlockId(blockId);
      setBlocks((current) => current.map((item) => item.id === blockId ? { ...item, status: "generating", error: undefined } : item));
      try {
        const preceding = completedBlocks.map((item, index) => ({
          title: item.title,
          // Conserver tout l'historique des titres ; texte complet pour les trois derniers blocs.
          content: index >= completedBlocks.length - 3 ? item.content : String(item.content || "").slice(0, 1200),
          sources: item.sources || [],
        }));
        const response = await fetchWithTimeout(BLOCK_API, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            project: projectPayloadWithoutFiles(project),
            problematic: selectedProblematic,
            plan: selectedPlan,
            block: { id: block.id, title: block.title, expectedWords: Math.min(block.expectedWords || 900, 1000), structure: block.structure, kind: block.kind },
            blockTitle: block.title,
            structure: block.structure,
            kind: block.kind,
            targetWords: Math.min(block.expectedWords || 900, 1000, 2500 - completedWords),
            preceding,
            previewBlocks: completedBlocks.map((item) => ({ id: item.id, title: item.title, content: item.content })),
            previewMode: true,
            ownerMode: false,
          }),
        }, 240000);
        const data = await readApiResponse(response);
        const content = String(data.content || data.block?.content || data.text || "").trim();
        if (!content) throw new Error("Le serveur n’a retourné aucun contenu pour ce bloc.");
        const remainingWords = Math.max(0, 2500 - completedWords);
        const limitedContent = content.split(/\s+/u).filter(Boolean).slice(0, Math.min(1000, remainingWords)).join(" ");
        const finalCount = countWords(limitedContent);
        setBlocks((current) => current.map((item) => item.id === blockId ? {
          ...item, ...data, id: item.id, title: item.title, kind: item.kind, structure: item.structure,
          content: limitedContent, wordCount: finalCount, status: "done", error: undefined,
        } : item));
        pushToast("success", finalCount + " mots rédigés dans ce bloc. " + (completedWords + finalCount >= 2500 ? "L’aperçu académique est disponible." : "Passez au bloc suivant."));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Impossible de rédiger ce bloc.";
        setBlocks((current) => current.map((item) => item.id === blockId ? { ...item, status: "pending", error: message } : item));
        pushToast("error", message);
      } finally {
        setActiveBlockId(null);
      }
      return;
    }
    if (activeBlockId && activeBlockId !== blockId) {
      pushToast("info", "Un seul bloc peut être rédigé à la fois. Attendez la fin du bloc en cours.");
      return;
    }

    setActiveBlockId(blockId);
    setBlocks((current) => current.map((item) =>
      item.id === blockId
        ? { ...item, status: "generating", error: undefined }
        : item
    ));

    try {
      const completedBlocks = blocks.filter((item) => item.status === "done" && item.content.trim());
      const preceding = completedBlocks.map((item, index) => ({
        title: item.title,
        // L'historique complet des titres évite de répéter les unités déjà traitées.
        content: index >= completedBlocks.length - 3 ? item.content : String(item.content || "").slice(0, 1200),
        sources: item.sources || [],
      }));

      const payload = {
        project: ownerRoute ? project : projectPayloadWithoutFiles(project),
        problematic: selectedProblematic,
        plan: selectedPlan,
        block: {
          id: block.id,
          title: block.title,
          expectedWords: block.expectedWords,
          structure: block.structure,
          kind: block.kind,
        },
        blockTitle: block.title,
        structure: block.structure,
        kind: block.kind,
        targetWords: block.expectedWords,
        preceding,
        ownerMode: ownerRoute === true,
      };

      const response = await fetchWithTimeout(BLOCK_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(ownerRoute ? ownerAuthHeaders() : premiumAuthHeaders()),
        },
        body: JSON.stringify(payload),
      }, 240000);

      const data = await readApiResponse(response);
      const result = data.block || data.data || data;
      const content = String(result.content || result.text || result.body || "");

      if (!content.trim()) {
        throw new Error("Le serveur a répondu sans contenu pour ce bloc.");
      }

      setBlocks((current) => current.map((item) =>
        item.id === blockId
          ? {
              ...item,
              ...result,
              id: item.id,
              kind: item.kind,
              content,
              wordCount: Number(result.wordCount || countWords(content)),
              sources: Array.isArray(result.sources) ? result.sources : [],
              footnotes: Array.isArray(result.footnotes) ? result.footnotes : [],
              status: "done",
              error: undefined,
            }
          : item
      ));
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Impossible de générer ce bloc.";

      console.error("[Trimémo] erreur génération bloc", error);

      setBlocks((current) => current.map((item) =>
        item.id === blockId
          ? { ...item, status: "pending", error: message }
          : item
      ));

      pushToast("error", message);
    } finally {
      setActiveBlockId(null);
    }
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    pushToast("success", "Contenu copié.");
  }

  function renderAcademicText(raw: string, previewMode = false, blockStructure: string[] = [], blockKind = "") {
    const cleanLine = (value: string) => value
      .replace(/\[\s*(?:https?:\/\/)?(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}\s*\]\(https?:\/\/[^)]+\)/giu, "")
      .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/giu, "$1")
      .replace(/https?:\/\/\S+/giu, "")
      .replace(/\bwww\.[a-z0-9.-]+\.[a-z]{2,}\S*/giu, "")
      .replace(/\s*\(\s*\)\s*/gu, " ")
      .replace(/[ \t]{2,}/gu, " ")
      .replace(/\s+([,.;:!?])/gu, "$1")
      .trim();
    const planTitleValues = (selectedPlan?.parts || []).flatMap((part) => [
      part.title,
      ...(part.chapters || []).flatMap((chapter) => [
        chapter.title,
        ...(chapter.sections || []).flatMap((section) => [
          section.title,
          ...(section.subsections || []).flatMap((sub) => [sub.title, ...(sub.internalTitles || []).map((item) => item.title)])
        ])
      ])
    ]).map((title) => String(title || "").trim().replace(/^[#*\s]+/u, "")).filter(Boolean);
    const planTitles = planTitleValues.map((title) => title.toLocaleLowerCase("fr"));
    const splitDuplicatedHeading = (value: string) => {
      const line = value.replace(/^#{1,6}\s*/u, "").replace(/[*_\x60]/gu, "").trim();
      const prefix = line.match(/^(CHAPITRE\s+\d+\s*[:.\-–]?\s*|SECTION\s+\d+(?:\.\d+)*\s*[:.\-–]?\s*|SOUS-SECTION\s+\d+(?:\.\d+)*\s*[:.\-–]?\s*)/iu);
      if (!prefix) return null;
      const rest = line.slice(prefix[0].length).trim();
      const candidates = [...planTitleValues].sort((a, b) => b.length - a.length);
      const title = candidates.find((candidate) => rest.toLocaleLowerCase("fr").startsWith(candidate.toLocaleLowerCase("fr")));
      if (!title) return null;
      const remainder = rest.slice(title.length).trim().replace(/^[:.\-–+\s]+/u, "");
      if (!remainder || remainder.length < 8) return null;
      return { heading: prefix[0] + title, subtitle: remainder };
    };
    // Normalise les titres académiques même lorsqu'ils sont collés au début d'un paragraphe.
    let source = String(raw || "").replace(/\r\n?/gu, "\n");
    // Chaque bloc de chapitre reçoit les libellés de partie et de chapitre du plan validé
    // lorsqu'ils sont absents du texte généré. On ne modifie pas le corps scientifique.
    if (!previewMode && (blockKind === "chapter" || blockKind === "chapter_intro")) {
      const structuralHeadings = blockStructure.filter((item) => /^(?:PARTIE\s+[IVXLCDM0-9]+|CHAPITRE\s+\d+)\s*[:.\-–]?/iu.test(String(item || "").trim()));
      const existingLines = source.split("\n").map((line) => line.trim().replace(/^#{1,6}\s*/, "").toLocaleLowerCase("fr"));
      const missingHeadings = structuralHeadings.filter((item) => !existingLines.includes(String(item).trim().toLocaleLowerCase("fr")));
      if (missingHeadings.length) source = missingHeadings.map((item) => "## " + item).join("\n\n") + "\n\n" + source;
    }
    source = source
      .replace(/[ \t]*(#{1,6}\s+)/gu, "\n\n$1")
      // Les titres numérotés internes doivent devenir des blocs distincts, même s'ils arrivent au milieu d'une phrase aplatie.
      .replace(/[ \t]+(?=(?:\d+\.){2,5}\d+\s*[:.)\-–]?\s+[A-ZÀ-ÖØ-ÞÀ-ÿ])/gu, "\n\n")
      .replace(/[ \t]*(\*\*?(?:INTRODUCTION(?: GÉNÉRALE)?|CONCLUSION(?: GÉNÉRALE)?|PARTIE\s+[IVXLCDM0-9]+|CHAPITRE\s+\d+|SECTION\s+\d+(?:\.\d+)*|SOUS-SECTION\s+\d+(?:\.\d+)*))/giu, "\n\n$1")
      .replace(/\s+(?=(?:INTRODUCTION(?: GÉNÉRALE)?|CONCLUSION(?: GÉNÉRALE)?|PARTIE\s+[IVXLCDM0-9]+\b|CHAPITRE\s+\d+\b|SECTION\s+\d+(?:\.\d+)*\b|SOUS-SECTION\s+\d+(?:\.\d+)*\b)\s*[:.\-–]?\s)/giu, "\n\n")
      .replace(/\n[ \t]*\n(?:[ \t]*\n)+/gu, "\n\n")
      .trim();
    const rawBlocks = source.split(/\n\s*\n/gu).flatMap((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length > 1) return lines;
      const line = lines[0] || "";
      // Sépare une phrase de prose lorsqu'un titre identifié est suivi sur la même ligne.
      const match = line.match(/^(#{1,6}\s*)?((?:\*\*)?(?:INTRODUCTION(?: GÉNÉRALE)?|CONCLUSION(?: GÉNÉRALE)?|PARTIE\s+[IVXLCDM0-9]+\b[^.!?\n]{0,180}|CHAPITRE\s+\d+\b[^.!?\n]{0,180}|SECTION\s+\d+(?:\.\d+)*\b[^.!?\n]{0,180}|SOUS-SECTION\s+\d+(?:\.\d+)*\b[^.!?\n]{0,180})(?:\*\*)?)(?:\s*[:.\-–]?\s+)([A-ZÀ-ÖØ-Þ][\s\S]+)$/iu);
      if (match && match[3]) return [match[1] ? match[1] + match[2] : match[2], match[3]];
      if (!line) return [];
      // Si le moteur a renvoyé tout un bloc sur une seule ligne, rétablit des paragraphes lisibles sans réécrire le texte.
      const sentences = line.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-ÞÀ-ÿ«“])/u).filter(Boolean);
      // Ne pas fabriquer des paragraphes d'une ou deux phrases : regrouper le texte aplati par unités de 4 à 6 phrases.
      if (sentences.length >= 4) {
        const paragraphs: string[] = [];
        // Rétablir des paragraphes académiques lisibles lorsque le moteur a aplati l'introduction.
        // Trois phrases au maximum par paragraphe évitent un unique bloc massif sans créer une phrase par ligne.
        const groupSize = sentences.length >= 10 ? 3 : 2;
        for (let i = 0; i < sentences.length; i += groupSize) {
          paragraphs.push(sentences.slice(i, i + groupSize).join(" ").trim());
        }
        return paragraphs;
      }
      return [line];
    });
    return rawBlocks.map((rawBlock, index) => {
      const line = cleanLine(rawBlock.replace(/^\s*[-*]\s+/u, ""));
      if (!line) return null;
      const markdownHeading = line.match(/^(#{1,6})\s+(.+)$/u);
      const headingText = (markdownHeading ? markdownHeading[2] : line)
        .replace(/[*_\x60]/gu, "").replace(/\s+/gu, " ").trim();
      const normalizedHeading = headingText.toLocaleLowerCase("fr");
      const splitHeading = splitDuplicatedHeading(headingText);
      const displayHeading = splitHeading?.heading || headingText;
      const numberedHeading = /^(?:\d+\.){1,5}\d+\s*[:.)\-–]?\s+\S.+$/u.test(headingText);
      const isAcademicHeading = /^(?:INTRODUCTION(?: GÉNÉRALE)?|CONCLUSION(?: GÉNÉRALE)?|PARTIE\s+[IVXLCDM0-9]+\b|CHAPITRE\s+\d+\b|SECTION\s+\d+(?:\.\d+)*\b|SOUS-SECTION\s+\d+(?:\.\d+)*\b)/iu.test(headingText);
      const plainHeading = planTitles.includes(normalizedHeading) || planTitles.some((title) => title && normalizedHeading === title.replace(/^\d+(?:\.\d+)*\s*/u, ""));
      if (markdownHeading || isAcademicHeading || numberedHeading || plainHeading) {
        const numberDepth = (headingText.match(/\./gu) || []).length;
        const level = markdownHeading ? Math.min(6, markdownHeading[1].length) : /^(?:INTRODUCTION|CONCLUSION|PARTIE)\b/iu.test(headingText) ? 1 : /^CHAPITRE\b/iu.test(headingText) ? 2 : numberedHeading ? Math.min(5, numberDepth + 2) : 3;
        const className = level <= 1
          ? "mb-5 mt-9 text-center text-lg font-bold uppercase tracking-wide text-[#172554]"
          : level === 2
            ? "mb-4 mt-8 text-base font-bold uppercase text-[#172554]"
            : numberedHeading
              ? "mb-3 mt-5 text-sm font-bold text-[#172554]"
              : "mb-3 mt-6 text-sm font-bold text-[#172554]";
        return (
          <React.Fragment key={index}>
            <h4 className={className}>{displayHeading}</h4>
            {splitHeading?.subtitle && <h5 className="mb-4 mt-2 text-sm font-semibold leading-6 text-[#444]">{splitHeading.subtitle}</h5>}
          </React.Fragment>
        );
      }
      const paragraph = line
        .replace(/\*\*(.*?)\*\*/gu, "$1")
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/gu, "$1")
        .replace(/^#{1,6}\s*/u, "")
        .trim();
      return <p key={index} className={previewMode ? "mb-6 text-left font-normal" : "mb-6 text-left font-normal"} style={{ textIndent: "1.1cm", lineHeight: 1.5, whiteSpace: "normal", overflowWrap: "anywhere" }}>{paragraph}</p>;
    }).filter(Boolean);
  }

  function academicPreviewSegments() {
    const finished = blocks.filter((block) => block.status === "done" && block.content.trim());
    let remaining = 2500;
    return finished.flatMap((block) => {
      if (remaining <= 0) return [];
      const matches = [...block.content.matchAll(/\S+/gu)];
      const selected = matches.slice(0, remaining);
      remaining -= selected.length;
      const end = selected.length ? selected[selected.length - 1].index + selected[selected.length - 1][0].length : 0;
      const content = end > 0 ? block.content.slice(0, end).trim() : "";
      return content ? [{ id: block.id, title: block.title, kind: block.kind, content, words: selected.length, structure: block.structure || [] }] : [];
    });
  }

  async function exportDocument() {
    if (!ownerRoute && !window.sessionStorage.getItem("trimemo_premium_token")) {
      const done = blocks.filter((block) => block.status === "done" && block.content.trim());
      const combined = done.map((block) => block.content).join("\n\n");
      if (countWords(combined) < 1) {
        pushToast("info", "Rédigez l’introduction et le premier chapitre pour consulter l’aperçu avant paiement.");
        return;
      }
      if (!selectedPlan || !selectedProblematic) {
        pushToast("error", "Sélectionnez une problématique et un plan avant de poursuivre.");
        return;
      }
      const segments = academicPreviewSegments();
      const intro = segments.find((block) => block.kind === "introduction");
      const others = segments.filter((block) => block.kind !== "introduction");
      const previewSnapshot: Preview = {
        problematic: selectedProblematic,
        plan: selectedPlan,
        introduction: { title: intro?.title || "Introduction générale", content: intro?.content || "", wordCount: intro?.words || 0, incomplete: true },
        chapterOne: { title: "Suite de la rédaction", content: others.map((block) => {
          const content = String(block.content || "").trim();
          const title = String(block.title || "").trim();
          // Le titre de bloc est ajouté uniquement s'il n'est pas déjà présent au début du contenu.
          const startsWithTitle = title && content.slice(0, Math.max(title.length + 80, 160)).toLocaleLowerCase("fr").includes(title.toLocaleLowerCase("fr"));
          return startsWithTitle ? content : [title, content].filter(Boolean).join("\n\n");
        }).join("\n\n"), wordCount: others.reduce((sum, block) => sum + block.words, 0), partTitle: "", chapterNumber: 1, sectionTitles: others.flatMap((block) => block.structure) },
      };
      setPreview(previewSnapshot);
      try {
        window.sessionStorage.setItem("trimemo_blocks_pending", JSON.stringify(blocks));
        window.sessionStorage.setItem("trimemo_selected_block_pending", selectedWritingBlockId || "");
        window.sessionStorage.setItem("trimemo_preview_pending", JSON.stringify(previewSnapshot));
      } catch {}
      setPreviewTab("introduction");
      setView("preview");
      pushToast("info", "Consultez l’aperçu, puis choisissez le paiement pour poursuivre la rédaction.");
      return;
    }
    const doneBlocks = blocks.filter((block) => block.status === "done" && block.content.trim());
    const pendingBlocks = blocks.filter((block) => block.status !== "done");
    if (!doneBlocks.length) {
      pushToast("error", "Rédigez au moins un bloc avant l’exportation.");
      return;
    }
    if (pendingBlocks.length > 0) {
      pushToast("error", `Le mémoire n’est pas terminé. ${pendingBlocks.length} bloc(s) restent à rédiger avant l’export final.`);
      return;
    }
    if (!selectedPlan || !selectedProblematic) {
      pushToast("error", "Sélectionnez une problématique et un plan avant l’exportation.");
      return;
    }
    const uniqueSources = new Map(
      doneBlocks
        .flatMap((block) => (block.sources || []).filter((source) => source?.verified === true))
        .map((source) => [
          `${String(source.author || "").toLowerCase()}|${String(source.year || "")}|${String(source.title || "").toLowerCase()}`,
          source,
        ])
    );
    if (uniqueSources.size < 10) {
      pushToast("info", `Export autorisé avec avertissement : ${uniqueSources.size} source(s) bibliographique(s) sont actuellement retenues. Une vérification manuelle peut être nécessaire.`);
    }
    try {
      setLoading(true);
      const papers = doneBlocks.flatMap((block) => (block.sources || []).filter((source) => source?.verified === true));
      const response = await fetch(EXPORT_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ...(ownerRoute ? ownerAuthHeaders() : premiumAuthHeaders()),
        },
        body: JSON.stringify({
          format: "docx",
          ownerMode: ownerRoute === true,
          title: project.sujet || "Document académique",
          project: projectPayloadWithoutFiles(project),
          problematic: selectedProblematic,
          plan: selectedPlan,
          blocks: doneBlocks,
          papers,
          formatting: {
            fontFamily: "Times New Roman",
            bodySize: 12,
            partSize: 14,
            chapterSize: 13,
            sectionSize: 12,
            lineSpacing: 1.5,
          },
        }),
      });
      if (!response.ok) {
        const raw = await response.text();
        let message = raw;
        try { message = JSON.parse(raw)?.error || raw; } catch {}
        throw new Error(message || "Le serveur n’a pas pu générer le fichier Word.");
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error("Le fichier Word généré est vide.");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(project.sujet || "trimemo-document").replace(/[^a-z0-9À-ÿ]+/gi, "-").slice(0, 80)}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      const missingLinks = Number(response.headers.get("X-Trimemo-Bibliography-Missing-Links") || 0);
      if (missingLinks > 0) {
        pushToast("info", `${missingLinks} référence(s) n’ont ni DOI ni lien : vérifiez-les manuellement avant de remettre le document.`);
      } else {
        pushToast("success", "Document Word académique généré avec bibliographie et mise en forme.");
      }
      // Le projet et le jeton premium sont conservés après l'export pour permettre
      // une nouvelle tentative si le navigateur n'enregistre pas le téléchargement.
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Export Word impossible.");
    } finally {
      setLoading(false);
    }
  }

  if (ownerRoute) {
    if (!ownerSessionValid) {
      return (
        <div className="min-h-screen bg-[#172554] px-5 py-10 text-[#172554]">
          <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleOwnerLogin();
              }}
              className="w-full rounded-[28px] bg-white p-7 shadow-2xl"
            >
              <div className="flex justify-center">
                <img
                  src={LOGO_SRC}
                  alt="Logo Trimémo"
                  className="h-16 w-16 object-contain"
                />
              </div>
              <div className="mt-4 text-center font-inter text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4A23A]">
                Accès sécurisé
              </div>
              <h1 className="mt-2 text-center font-playfair text-3xl text-[#172554]">
                Administration Trimémo
              </h1>
              <p className="mt-3 text-center font-inter text-sm leading-[1.7] text-[#172554]/65">
                Espace séparé de la plateforme publique pour tester les générations sans paiement.
              </p>

              <label className="mt-6 block font-inter text-xs font-semibold text-[#172554]/75">
                E-mail administrateur
              </label>
              <input
                type="email"
                required
                value={ownerEmail}
                onChange={(event) => setOwnerEmail(event.target.value)}
                autoComplete="username"
                className="mt-2 h-11 w-full rounded-xl border border-[#172554]/10 px-4 font-inter text-sm outline-none focus:border-[#172554]/30"
              />

              <label
                htmlFor="owner-password"
                className="mt-4 block font-inter text-xs font-semibold text-[#172554]/75"
              >
                Mot de passe
              </label>
              <div className="relative mt-2">
                <input
                  id="owner-password"
                  type={showOwnerPassword ? "text" : "password"}
                  required
                  value={ownerPassword}
                  onChange={(event) => setOwnerPassword(event.target.value)}
                  autoComplete="current-password"
                  className="h-11 w-full rounded-xl border border-[#172554]/10 px-4 pr-12 font-inter text-sm outline-none focus:border-[#172554]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowOwnerPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#172554]/55"
                  aria-label={
                    showOwnerPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showOwnerPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {ownerLoginError && (
                <div className="mt-3 rounded-xl bg-red-50 p-3 font-inter text-xs text-red-700">
                  {ownerLoginError}
                </div>
              )}

              <button
                type="submit"
                disabled={ownerBusy}
                className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[#D4A23A] font-inter text-sm font-semibold text-[#172554] disabled:opacity-50"
              >
                {ownerBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Ouvrir le tableau de bord"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="mt-3 w-full font-inter text-xs text-[#172554]/60"
              >
                Retour à la plateforme publique
              </button>
            </form>
          </div>
        </div>
      );
    }

    if (!ownerShowWriter) {
      const ownerToken = window.sessionStorage.getItem("trimemo_owner_session") || "";
      return <AdminDashboard
        token={ownerToken}
        email={ownerEmail || "Propriétaire Trimémo"}
        onOpenWriter={() => { setOwnerShowWriter(true); setView("project"); }}
        onLogout={() => { handleOwnerLogout(); window.location.href = "/"; }}
      />;
    }

    return (
      <div className="min-h-screen bg-[#EAF7EE] text-[#172554]">
        <div className="border-b border-[#172554]/10 bg-[#172554] text-white">
          <div className="mx-auto flex min-h-[76px] max-w-[1280px] items-center justify-between gap-4 px-5 lg:px-8">
            <div className="flex items-center gap-3">
              <img
                src={LOGO_SRC}
                alt="Logo Trimémo"
                className="h-11 w-11 object-contain"
              />
              <div>
                <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">
                  Administration
                </div>
                <div className="font-playfair text-2xl font-semibold">
                  Tableau de bord propriétaire
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {premium && (
                <button
                  type="button"
                  onClick={() => setView("premium")}
                  className="rounded-full border border-white/20 px-4 py-2 font-inter text-xs font-semibold"
                >
                  Problématiques & plans
                </button>
              )}
              <button
                type="button"
                onClick={() => setOwnerShowWriter(false)}
                className="rounded-full border border-[#D4A23A] px-4 py-2 font-inter text-xs font-semibold text-[#D4A23A]"
              >
                Tableau de bord
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("project");
                  setPremium(null);
                  setPremiumNav("problematic-0");
                  setPremiumSection("problematic");
                  setSelectedProblematic(null);
                  setSelectedPlan(null);
                  setBlocks([]);
                }}
                className="rounded-full border border-white/20 px-4 py-2 font-inter text-xs font-semibold"
              >
                Nouveau test
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((value) => !value)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white lg:hidden"
                aria-label={mobileMenuOpen ? "Fermer la navigation" : "Ouvrir la navigation"}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={handleOwnerLogout}
                className="rounded-full bg-white px-4 py-2 font-inter text-xs font-semibold text-[#172554]"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1280px]">
        {mobileMenuOpen && (
          <div className="border-b border-[#172554]/10 bg-white px-5 py-4 lg:hidden">
            <div className="mx-auto flex max-w-[1280px] flex-col gap-2 font-inter text-sm">
              <button type="button" onClick={() => { setMobileMenuOpen(false); setView("project"); }} className="rounded-xl px-4 py-3 text-left text-[#172554] hover:bg-[#F7FAF8]">Nouveau projet</button>
              {premium && (
                <>
                  <button type="button" onClick={() => { setMobileMenuOpen(false); setView("premium"); setPremiumSection("problematic"); setPremiumNav("problematic-0"); }} className="rounded-xl px-4 py-3 text-left text-[#172554] hover:bg-[#F7FAF8]">Problématique</button>
                  {premium.problematics.map((item,index) => (
                    <button key={item.id} type="button" onClick={() => { setMobileMenuOpen(false); setView("premium"); setPremiumSection("problematic"); setPremiumNav("problematic-"+index); setSelectedProblematic(item); }} className="ml-4 rounded-lg px-4 py-2 text-left text-xs text-[#172554]/70 hover:bg-[#EAF7EE]">Problématique {index+1}</button>
                  ))}
                  <button type="button" onClick={() => { setMobileMenuOpen(false); setView("premium"); setPremiumSection("plan"); setPremiumNav("plan-0"); }} className="rounded-xl px-4 py-3 text-left text-[#172554] hover:bg-[#F7FAF8]">Plan</button>
                  {premium.plans.map((plan,index) => (
                    <button key={plan.id} type="button" onClick={() => { setMobileMenuOpen(false); setView("premium"); setPremiumSection("plan"); setPremiumNav("plan-"+index); setSelectedPlan(plan); }} className="ml-4 rounded-lg px-4 py-2 text-left text-xs text-[#172554]/70 hover:bg-[#EAF7EE]">Plan {index+1}</button>
                  ))}
                  <button type="button" disabled={!selectedPlan} onClick={() => { setMobileMenuOpen(false); setView("writing"); setPremiumSection("writing"); }} className="rounded-xl px-4 py-3 text-left text-[#172554] hover:bg-[#F7FAF8] disabled:opacity-40">Rédaction</button>
                </>
              )}
            </div>
          </div>
        )}
          <aside className="hidden min-h-[calc(100vh-72px)] w-[245px] shrink-0 border-r border-[#172554]/10 bg-white p-5 lg:block">
            <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">Navigation</div>
            <nav className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setView("project");
                  setPremiumSection("problematic");
                }}
                className={`w-full rounded-xl px-4 py-3 text-left font-inter text-xs font-semibold ${view === "project" ? "bg-[#172554] text-white" : "text-[#172554] hover:bg-[#F7FAF8]"}`}
              >
                Nouveau projet
              </button>

              {premium && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setView("premium");
                      setPremiumSection("problematic");
                      setPremiumNav("problematic-0");
                    }}
                    className={`w-full rounded-xl px-4 py-3 text-left font-inter text-xs font-semibold ${view === "premium" && premiumSection === "problematic" ? "bg-[#172554] text-white" : "text-[#172554] hover:bg-[#F7FAF8]"}`}
                  >
                    Problématique
                  </button>
                  {premiumSection === "problematic" && (
                    <div className="ml-3 space-y-1 border-l-2 border-[#EAF7EE] pl-2">
                      {premium.problematics.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setView("premium");
                            setPremiumSection("problematic");
                            setPremiumNav("problematic-" + index);
                            setSelectedProblematic(item);
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left font-inter text-[11px] font-semibold ${premiumNav === "problematic-" + index && view === "premium" ? "bg-[#EAF7EE] text-[#172554]" : "text-[#172554]/70 hover:bg-[#F7FAF8]"}`}
                        >
                          Problématique {index + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={!premium.plans.length}
                    onClick={() => {
                      setView("premium");
                      setPremiumSection("plan");
                      setPremiumNav("plan-0");
                    }}
                    className={`w-full rounded-xl px-4 py-3 text-left font-inter text-xs font-semibold ${view === "premium" && premiumSection === "plan" ? "bg-[#172554] text-white" : "text-[#172554] hover:bg-[#F7FAF8]"} disabled:opacity-40`}
                  >
                    Plan
                  </button>
                  {premiumSection === "plan" && premium.plans.length > 0 && (
                    <div className="ml-3 space-y-1 border-l-2 border-[#EAF7EE] pl-2">
                      {premium.plans.map((plan, index) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => {
                            setView("premium");
                            setPremiumSection("plan");
                            setPremiumNav("plan-" + index);
                            setSelectedPlan(plan);
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left font-inter text-[11px] font-semibold ${premiumNav === "plan-" + index && view === "premium" ? "bg-[#EAF7EE] text-[#172554]" : "text-[#172554]/70 hover:bg-[#F7FAF8]"}`}
                        >
                          Plan {index + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={!selectedPlan}
                    onClick={() => {
                      setPremiumSection("writing");
                      setView("writing");
                    }}
                    className={`w-full rounded-xl px-4 py-3 text-left font-inter text-xs font-semibold ${view === "writing" ? "bg-[#172554] text-white" : "text-[#172554] hover:bg-[#F7FAF8]"} disabled:opacity-40`}
                  >
                    Rédaction
                  </button>
                </>
              )}
            </nav>
          </aside>
          <main className={`min-w-0 flex-1 px-6 py-8 lg:px-8 lg:py-10 ${view === "writing" ? "h-[calc(100vh-76px)] overflow-y-auto overscroll-contain" : ""}`}>
          {view === "project" && (
            <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="rounded-[24px] border border-[#172554]/5 bg-white p-7 shadow-sm lg:p-9">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">
                      Test sans paiement
                    </div>
                    <h1 className="mt-2 font-playfair text-4xl leading-tight text-[#172554]">
                      Préparer une génération
                    </h1>
                    <p className="mt-2 max-w-2xl font-inter text-sm leading-[1.7] text-[#172554]/65">
                      Ce formulaire appartient uniquement à l’espace administrateur.
                      Les utilisateurs publics ne voient jamais ce tableau de bord.
                    </p>
                  </div>
                  <div className="rounded-full bg-[#EAF7EE] px-3 py-1.5 font-inter text-[10px] font-semibold text-[#2F6B45]">
                    PAIEMENT NEUTRALISÉ
                  </div>
                </div>

                <div className="mt-7 grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="font-inter text-xs font-semibold text-[#172554]/75">
                      Sujet
                    </label>
                    <textarea
                      value={project.sujet}
                      onChange={(event) =>
                        setProject((current) => ({
                          ...current,
                          sujet: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Sujet du mémoire, rapport ou thèse"
                      className="mt-2 w-full rounded-2xl border border-[#172554]/10 px-4 py-3 font-inter text-sm outline-none focus:border-[#172554]/30"
                    />
                  </div>

                  <div>
                    <label className="font-inter text-xs font-semibold text-[#172554]/75">Niveau</label>
                    <select value={project.niveau} onChange={(event) => setProject((current) => ({ ...current, niveau: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-[#172554]/10 bg-white px-4 font-inter text-sm">
                      <option value="">Sélectionnez un niveau</option><option>Licence 1</option><option>Licence 2</option><option>Licence 3</option><option>Master 1</option><option>Master 2</option><option>Doctorat</option><option>Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-inter text-xs font-semibold text-[#172554]/75">Domaine</label>
                    <select value={project.domaine} onChange={(event) => setProject((current) => ({ ...current, domaine: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-[#172554]/10 bg-white px-4 font-inter text-sm">
                      <option value="">Sélectionnez un domaine</option>
                      {domainOptions.map((domain) => <option key={domain} value={domain}>{domain}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-inter text-xs font-semibold text-[#172554]/75">Type de document</label>
                    <select value={project.typeDoc} onChange={(event) => setProject((current) => ({ ...current, typeDoc: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-[#172554]/10 bg-white px-4 font-inter text-sm">
                      <option value="">Sélectionnez un type</option><option>Mémoire</option><option>Thèse</option><option>Rapport</option><option>Dissertation</option><option>Devoir</option><option>Article scientifique</option><option>Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-inter text-xs font-semibold text-[#172554]/75">
                      Formule
                    </label>
                    <select
                      value={project.formula}
                      onChange={(event) =>
                        setProject((current) => ({
                          ...current,
                          formula: event.target.value as FormulaId,
                        }))
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-[#172554]/10 bg-white px-4 font-inter text-sm"
                    >
                      {formulaOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-inter text-xs font-semibold text-[#172554]/75">
                      Nombre de pages
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={project.pages}
                      onChange={(event) =>
                        setProject((current) => ({
                          ...current,
                          pages: Math.max(1, Number(event.target.value) || 1),
                        }))
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-[#172554]/10 px-4 font-inter text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-inter text-xs font-semibold text-[#172554]/75">
                      Contexte
                    </label>
                    <textarea
                      value={project.contexte}
                      onChange={(event) =>
                        setProject((current) => ({
                          ...current,
                          contexte: event.target.value,
                        }))
                      }
                      rows={4}
                      placeholder="Contexte, terrain, organisation ou informations utiles"
                      className="mt-2 w-full rounded-2xl border border-[#172554]/10 px-4 py-3 font-inter text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-inter text-xs font-semibold text-[#172554]/75">
                      Problématique personnelle (facultatif)
                    </label>
                    <textarea
                      value={project.problematiquePersonnelle}
                      onChange={(event) =>
                        setProject((current) => ({ ...current, problematiquePersonnelle: event.target.value }))
                      }
                      rows={3}
                      placeholder="Ajoutez votre propre problématique. Elle sera proposée comme option distincte des trois générées."
                      className="mt-2 w-full rounded-2xl border border-[#172554]/10 px-4 py-3 font-inter text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-inter text-xs font-semibold text-[#172554]/75">
                      Plan personnel (facultatif)
                    </label>
                    <textarea
                      value={project.planPersonnel}
                      onChange={(event) =>
                        setProject((current) => ({ ...current, planPersonnel: event.target.value }))
                      }
                      rows={5}
                      placeholder="Ajoutez votre propre plan. Il sera proposé comme option supplémentaire et contrôlé avant rédaction."
                      className="mt-2 w-full rounded-2xl border border-[#172554]/10 px-4 py-3 font-inter text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-inter text-xs font-semibold text-[#172554]/75">
                      Consignes
                    </label>
                    <textarea
                      value={project.consignes}
                      onChange={(event) =>
                        setProject((current) => ({
                          ...current,
                          consignes: event.target.value,
                        }))
                      }
                      rows={4}
                      placeholder="Consignes méthodologiques ou documentaires"
                      className="mt-2 w-full rounded-2xl border border-[#172554]/10 px-4 py-3 font-inter text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-inter text-xs font-semibold text-[#172554]/75">
                      Documents du projet
                    </label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff,image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff"
                      onChange={(event) => {
                        void handleFiles(event.target.files);
                        event.currentTarget.value = "";
                      }}
                      className="mt-2 w-full rounded-2xl border border-dashed border-[#172554]/15 bg-[#F7FAF8] px-4 py-4 font-inter text-sm"
                    />
                    {project.files.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {project.files.map((file, index) => (
                          <div
                            key={`${file.name}-${file.content.length}`}
                            className="rounded-xl bg-[#F7FAF8] px-3 py-2 font-inter text-xs"
                          >
                            <span className="min-w-0 flex-1 truncate">{file.name}</span>
                            <select value={file.category || "reference"} onChange={(event) => {
                              const category = event.target.value as FileCategory;
                              setProject((current) => ({
                                ...current,
                                files: current.files.map((item, itemIndex) => itemIndex === index ? { ...item, category } : item),
                              }));
                            }} className="rounded-lg border border-[#172554]/10 bg-white px-2 py-1 text-[11px]">
                              <option value="methodology">Méthodologie</option>
                              <option value="instructions">Instructions</option>
                              <option value="context">Contexte</option>
                              <option value="source">Source</option>
                              <option value="reference">Référence</option>
                            </select>
                            <button type="button" onClick={() => setProject((current) => ({ ...current, files: current.files.filter((_, itemIndex) => itemIndex !== index) }))} className="ml-2 rounded-lg border border-red-200 px-2 py-1 text-[11px] text-red-700">Retirer</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void generateOwnerPremium()}
                  className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#172554] font-inter text-sm font-semibold text-white disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-[#D4A23A]" />
                  )}
                  Générer les problématiques
                </button>
              </div>

              <aside className="h-fit rounded-[24px] border border-[#172554]/5 bg-white p-6 shadow-sm lg:sticky lg:top-[96px]">
                <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">
                  Pipeline de test
                </div>
                <div className="mt-4 space-y-3 font-inter text-sm">
                  <div className="rounded-2xl bg-[#EAF7EE] p-4">
                    <strong>01.</strong> Problématiques
                  </div>
                  <div className="rounded-2xl bg-[#F7FAF8] p-4">
                    <strong>02.</strong> Plans détaillés
                  </div>
                  <div className="rounded-2xl bg-[#F7FAF8] p-4">
                    <strong>03.</strong> Sélection d’un plan
                  </div>
                  <div className="rounded-2xl bg-[#F7FAF8] p-4">
                    <strong>04.</strong> Rédaction
                  </div>
                </div>
              </aside>
            </section>
          )}

          
          
          {view === "premium" && premium && premiumSection !== "writing" && (
            <section>
              <div className="mb-6">
                <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">
                  Espace propriétaire · résultats
                </div>
                <h1 className="mt-2 font-playfair text-4xl text-[#172554]">
                  {premiumSection === "problematic"
                    ? "Problématique"
                    : premiumSection === "plan"
                      ? "Plans détaillés"
                      : "Rédaction"}
                </h1>

                {generationError && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-inter text-sm leading-6 text-red-700"
                  >
                    <strong>Erreur de génération :</strong> {generationError}
                  </div>
                )}

                {premiumSection === "problematic" && (() => {
                  const index = Number(premiumNav.replace("problematic-", "") || 0);
                  const item = premium.problematics[index] || premium.problematics[0];
                  return item ? (
                    <article className="rounded-[24px] border border-[#172554]/10 bg-white p-7 shadow-sm lg:p-10">
                      <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">
                        Problématique {index + 1}
                      </div>
                      <h2 className="mt-3 font-playfair text-3xl text-[#172554]">{item.title}</h2>
                      <p className="mt-6 font-inter text-base leading-[1.9] text-[#172554]/80">{item.question}</p>
                      {item.angle && (
                        <div className="mt-5 rounded-2xl bg-[#EAF7EE] p-5 font-inter text-sm leading-[1.8] text-[#172554]/80">
                          <strong>Angle :</strong> {item.angle}
                        </div>
                      )}
                      {item.rationale && (
                        <div className="mt-4 rounded-2xl bg-[#F7FAF8] p-5 font-inter text-sm leading-[1.8] text-[#172554]/70">
                          {item.rationale}
                        </div>
                      )}
                      <div className="mt-6 grid gap-3 rounded-2xl border border-[#172554]/10 bg-[#F7FAF8] p-4">
                        <div className="font-inter text-xs font-semibold uppercase tracking-wide text-[#172554]/65">Améliorer ou comparer la problématique</div>
                        <textarea value={problematicImprovementComments[item.id] || ""} onChange={(event) => setProblematicImprovementComments((current) => ({ ...current, [item.id]: event.target.value }))} rows={3} placeholder="Indiquez ce qui doit être précisé ou corrigé." className="w-full rounded-xl border border-[#172554]/10 bg-white px-4 py-3 font-inter text-sm" />
                        <div className="flex flex-wrap gap-2">
                          <button type="button" disabled={loading || problematicGenerationCount >= 3} onClick={() => void generateProblematicVariant("improve", item, problematicImprovementComments[item.id] || "")} className="rounded-full border border-[#172554]/15 bg-white px-4 py-2 font-inter text-xs font-semibold text-[#172554] disabled:opacity-50">Améliorer cette problématique</button>
                          <button type="button" disabled={loading || problematicGenerationCount >= 3} onClick={() => void generateProblematicVariant("alternative", item)} className="rounded-full border border-[#1D78C1]/30 bg-white px-4 py-2 font-inter text-xs font-semibold text-[#1D78C1] disabled:opacity-50">Proposer une autre</button>
                        </div>
                        <div className="font-inter text-[11px] text-[#172554]/55">{problematicGenerationCount}/3 propositions utilisées</div>
                      </div>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => void generatePlansForProblematic(item, ownerRoute === true, undefined, { action: "new" })}
                        className="mt-7 rounded-full bg-[#1D78C1] px-6 py-3 font-inter text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading && selectedProblematic?.id === item.id ? "Génération du plan..." : "Générer un plan"}
                      </button>
                    </article>
                  ) : (
                    <div className="rounded-[24px] bg-white p-8 font-inter text-sm text-[#172554]/65">
                      Aucune problématique disponible.
                    </div>
                  );
                })()}

                {premiumSection === "plan" && (() => {
                  const index = Number(premiumNav.replace("plan-", "") || 0);
                  const plan = premium.plans[index] || premium.plans[0];
                  return plan ? (
                    <article>
                      <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">Plan {index + 1}</div>
                      <h2 className="mt-3 font-playfair text-3xl text-[#172554]">{plan.title}</h2>
                      <div className="mt-7 space-y-5 font-inter">
                        {plan.parts.map((part) => (
                          <div key={part.id}>
                            <div className="font-bold uppercase text-[#172554]">PARTIE {part.number}. {part.title}</div>
                            <div className="mt-3 space-y-3 pl-4">
                              {part.chapters.map((chapter) => (
                                <div key={chapter.id}>
                                  <div className="font-semibold text-[#172554]">Chapitre {chapter.number}. {chapter.title}</div>
                                  <div className="mt-2 space-y-2 pl-5">
                                    {chapter.sections.map((section) => (
                                      <div key={section.id}>
                                        <div className="text-sm font-semibold text-[#172554]/90">Section {chapter.number}.{section.number}. {section.title}</div>
                                        {section.subsections.map((subsection) => (
                                          <div key={subsection.id} className="mt-1 pl-5 text-xs text-[#172554]/70">
                                            § {chapter.number}.{section.number}.{subsection.number} {subsection.title}
                                            {subsection.internalTitles.map((internal) => (
                                              <div key={internal.id} className="pl-4 text-[11px] text-[#172554]/55">{internal.number}. {internal.title}</div>
                                            ))}
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-8 grid gap-3 rounded-2xl border border-[#172554]/10 bg-[#F7FAF8] p-5">
                        <div className="font-inter text-xs font-semibold uppercase tracking-[0.12em] text-[#172554]/60">Validation du plan</div>
                        <textarea
                          value={planImprovementComments[plan.id] || ""}
                          onChange={(event) => setPlanImprovementComments((current) => ({ ...current, [plan.id]: event.target.value }))}
                          rows={4}
                          placeholder="Décrivez précisément les modifications souhaitées pour améliorer ce plan."
                          className="w-full rounded-xl border border-[#172554]/10 bg-white px-4 py-3 font-inter text-sm"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button type="button" disabled={loading} onClick={() => void generatePlansForProblematic(selectedProblematic || premium.problematics[0], ownerRoute === true, undefined, { action: "improve", currentPlan: plan, comments: planImprovementComments[plan.id] || "" })} className="rounded-full border border-[#172554]/15 bg-white px-5 py-3 font-inter text-xs font-semibold text-[#172554] disabled:opacity-50">Demander une amélioration</button>
                          <button type="button" disabled={loading || premium.plans.length >= 3} onClick={() => void generatePlansForProblematic(selectedProblematic || premium.problematics[0], ownerRoute === true, undefined, { action: "alternative" })} className="rounded-full border border-[#1D78C1]/30 bg-white px-5 py-3 font-inter text-xs font-semibold text-[#1D78C1] disabled:opacity-50">Générer un autre plan</button>
                          <button type="button" disabled={loading} onClick={() => {
                            const problematic = selectedProblematic || premium.problematics[0];
                            if (!problematic) return;
                            setSelectedProblematic(problematic);
                            selectPremiumPlan(problematic, plan);
                            setView("writing");
                            setPremiumSection("writing");
                            pushToast("success", "Plan retenu. L’espace de rédaction et ses blocs sont affichés.");
                          }} className="rounded-full bg-[#172554] px-5 py-3 font-inter text-xs font-semibold text-white disabled:opacity-50">Valider ce plan</button>
                        </div>
                        {selectedPlan?.id === plan.id && <div className="font-inter text-xs font-semibold text-[#2F6B45]">Plan retenu</div>}
                        <div className="font-inter text-[11px] text-[#172554]/55">{planGenerationCount}/3 génération(s) de plan utilisée(s)</div>
                      </div>
                    </article>
                  ) : (
                    <div className="font-inter text-sm text-[#172554]/65">Aucun plan disponible.</div>
                  );
                })()}
              </div>
            </section>
          )}

          {view === "writing" && selectedProblematic && selectedPlan && (
              <section className="min-h-full">
                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                  <div>
                    <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">Rédaction</div>
                    <h1 className="mt-2 font-playfair text-4xl text-[#172554]">{selectedPlan.title}</h1>
                    <p className="mt-2 font-inter text-sm text-[#172554]/60">
                      Le mémoire est rédigé dans l'ordre exact du plan sélectionné.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {(ownerRoute || (window.sessionStorage.getItem("trimemo_premium_token") && window.sessionStorage.getItem("trimemo_premium_project_id") === String(project.projectId))) ? (
                      <button type="button" disabled={loading} onClick={() => { void exportDocument(); }} className="rounded-full bg-[#172554] px-5 py-3 font-inter text-xs font-semibold text-white transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70">
                        {loading ? "Vérification et préparation du document…" : "Exporter le document Word"}
                      </button>
                    ) : totalDoneWords >= 2500 ? (
                      <button type="button" onClick={() => void exportDocument()} className="rounded-full bg-[#D4A23A] px-5 py-3 font-inter text-xs font-semibold text-[#172554]">
                        Voir l’aperçu
                      </button>
                    ) : (
                      <div className="rounded-full border border-[#172554]/10 px-4 py-3 font-inter text-xs text-[#172554]/60">
                        Aperçu disponible à 2 500 mots ({totalDoneWords.toLocaleString("fr-FR")}/2 500)
                      </div>
                    )}
                    {CONTACT_EMAIL && blocks.length > 0 && blocks.every((item) => item.status === "done" && item.content.trim()) && (
                      <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Demande de révision humaine - " + (project.sujet || "Document Trimémo"))}`} className="rounded-full border border-[#172554]/15 bg-white px-5 py-3 font-inter text-xs font-semibold text-[#172554]">
                        Demander une révision humaine
                      </a>
                    )}
                  </div>
                  {CONTACT_EMAIL && blocks.length > 0 && blocks.every((item) => item.status === "done" && item.content.trim()) && (
                    <div className="font-inter text-[11px] text-[#172554]/60">Révision humaine : {CONTACT_EMAIL}</div>
                  )}
                </div>

                <div className="space-y-8 pb-20">
                  {blocks.map((block, index) => {
                    const isLast = index === blocks.length - 1;
                    const isGenerating = block.status === "generating";
                    return (
                      <article
                        key={block.id}
                        id={`writing-block-${block.id}`}
                        className="mx-auto max-w-[900px] overflow-hidden border border-[#D9D9D9] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
                      >
                        <div className="border-b border-[#E5E5E5] px-10 py-6 md:px-16">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">
                              Bloc {index + 1}
                            </div>
                            <button
                              type="button"
                              disabled={isGenerating || (activeBlockId !== null && activeBlockId !== block.id)}
                              onClick={() => {
                                setSelectedWritingBlockId(block.id);
                                void generateBlock(block.id);
                              }}
                              className="rounded-full bg-[#172554] px-5 py-2.5 font-inter text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isGenerating ? "Rédaction en cours…" : block.status === "done" ? "Régénérer ce bloc" : "Rédiger ce bloc"}
                            </button>
                          </div>

                          <h2 className="mt-4 font-playfair text-2xl text-[#172554]">{block.title}</h2>

                          <div className="mt-5 border-l-2 border-[#D4A23A] pl-4">
                            <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777]">
                              Trame du plan sélectionné
                            </div>
                            <div className="mt-2 space-y-1 font-inter text-[11px] leading-5 text-[#555]">
                              {block.structure.map((item, structureIndex) => (
                                <div key={`${block.id}-structure-${structureIndex}`}>{item}</div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="min-h-[720px] px-10 py-14 font-['Times_New_Roman'] text-[15px] leading-[1.85] text-[#111] md:px-[88px]">
                          {block.error && (
                            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 font-inter text-xs leading-5 text-red-700">
                              <strong>Erreur de rédaction :</strong> {block.error}
                            </div>
                          )}

                          {block.content ? (
                            <div>{renderAcademicText(block.content, false, block.structure, block.kind)}</div>
                          ) : (
                            <div className="flex min-h-[420px] items-center justify-center text-center">
                              <div>
                                <div className="font-playfair text-2xl text-[#172554]">{block.title}</div>
                                <div className="mt-3 font-inter text-sm text-[#777]">
                                  Ce bloc attend sa rédaction.
                                </div>
                                <button
                                  type="button"
                                  disabled={isGenerating || activeBlockId !== null}
                                  onClick={() => {
                                    setSelectedWritingBlockId(block.id);
                                    void generateBlock(block.id);
                                  }}
                                  className="mt-5 rounded-full bg-[#1D78C1] px-6 py-3 font-inter text-xs font-semibold text-white disabled:opacity-40"
                                >
                                  {isGenerating ? "Rédaction en cours…" : "Rédiger ce bloc"}
                                </button>
                              </div>
                            </div>
                          )}

                          {block.footnotes.length > 0 && (
                            <div className="mt-12 border-t border-[#222] pt-5 text-[11px] leading-[1.6]">
                              <div className="mb-2 font-bold">Notes</div>
                              <ol className="list-decimal space-y-1 pl-5">
                                {block.footnotes.map((note, noteIndex) => <li key={noteIndex}>{note}</li>)}
                              </ol>
                            </div>
                          )}

                          {block.sources.some((source) => source?.verified === true) && (
                            <div className="mt-10 border-t border-[#DDD] pt-5 font-inter text-[11px] leading-[1.6] text-[#555]">
                              <div className="mb-2 font-semibold uppercase tracking-[0.12em]">Sources utilisées</div>
                              <div className="space-y-1">
                                {block.sources.filter((source) => source?.verified === true).map((source, sourceIndex) => (
                                  <div key={`${block.id}-source-${sourceIndex}`}>
                                    {source.author ? `${source.author}. ` : ""}{source.title}{source.year ? ` (${source.year})` : ""}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {!isLast && (
                          <div className="border-t border-[#E5E5E5] bg-white px-10 py-5 text-center md:px-16">
                            <button
                              type="button"
                              disabled={activeBlockId !== null}
                              onClick={() => {
                                const next = blocks[index + 1];
                                const completedWords = blocks.filter((item) => item.status === "done" && item.content.trim()).reduce((sum, item) => sum + (item.wordCount || countWords(item.content)), 0);
                                if (!ownerRoute && !window.sessionStorage.getItem("trimemo_premium_token") && completedWords >= 2500) {
                                  setSelectedWritingBlockId(next.id);
                                  void exportDocument();
                                  return;
                                }
                                setSelectedWritingBlockId(next.id);
                                document.getElementById(`writing-block-${next.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }}
                              className="rounded-full border border-[#172554]/15 bg-white px-6 py-2.5 font-inter text-xs font-semibold text-[#172554] hover:bg-[#F7FAF8] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Bloc suivant · {index + 2}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

{view !== "project" && view !== "premium" && view !== "writing" && (
            <section className="rounded-[28px] border border-[#172554]/10 bg-white p-6 shadow-sm">
              <h1 className="font-playfair text-3xl">Tableau de bord</h1>
              <p className="mt-2 font-inter text-sm text-[#172554]/65">
                Préparez un test pour lancer la génération.
              </p>
              <button
                type="button"
                onClick={() => setView("project")}
                className="mt-5 rounded-full bg-[#172554] px-5 py-3 font-inter text-xs font-semibold text-white"
              >
                Nouveau test
              </button>
            </section>
          )}
          </main>
        </div>

        <div className="fixed bottom-4 right-4 z-[90] max-w-sm rounded-2xl bg-[#172554] px-4 py-3 font-inter text-[11px] text-white shadow-xl">
          MODE ADMINISTRATEUR · PAIEMENT NEUTRALISÉ · ESPACE SÉPARÉ
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#172554]">
      <style>{`
        .font-playfair { font-family: 'Playfair Display', Georgia, serif; }
        .font-inter { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; }
      `}</style>

      <div className="fixed right-4 top-4 z-[100] flex max-w-md flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="rounded-xl border bg-white px-4 py-3 text-sm shadow-lg">
            <div className="flex items-start gap-2">
              <span className={`mt-1 h-2 w-2 rounded-full ${toast.type === "error" ? "bg-red-500" : toast.type === "success" ? "bg-emerald-500" : "bg-[#D4A23A]"}`} />
              <span>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>

      {ownerRoute && ownerSessionValid && (
        <aside className="fixed bottom-4 right-4 z-[90] w-[min(340px,calc(100vw-2rem))] rounded-[22px] border border-[#172554]/10 bg-white p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">Espace propriétaire</div>
              <div className="mt-1 font-playfair text-xl text-[#172554]">Tests rapides</div>
            </div>
            <button onClick={handleOwnerLogout} className="rounded-full border border-[#172554]/10 px-3 py-1.5 font-inter text-[11px]">Quitter</button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(["LICENCE", "MASTER", "DOCTORAT"] as FormulaId[]).map((item) => (
              <button key={item} onClick={() => startOwnerTest(item)} className="rounded-xl bg-[#EAF7EE] px-2 py-3 font-inter text-[10px] font-semibold text-[#172554]">
                {item === "DOCTORAT" ? "Thèse" : item === "MASTER" ? "Master" : "Licence"}
              </button>
            ))}
          </div>
          <button onClick={() => void generateOwnerPremium()} disabled={loading} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#172554] font-inter text-xs font-semibold text-white disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[#D4A23A]" />}
            Générer les problématiques
          </button>
          <button onClick={() => simulateOwnerPayment()} className="mt-2 flex h-10 w-full items-center justify-center rounded-full border border-[#172554]/10 font-inter text-xs font-semibold text-[#172554]">
            Simuler un paiement
          </button>
          <div className="mt-3 rounded-xl bg-[#FFF8E7] p-3 font-inter text-[10px] leading-[1.6] text-[#6B4B08]">
            Les générations propriétaires ne déclenchent aucun paiement réel.
          </div>
        </aside>
      )}

      {ownerRoute && !ownerSessionValid && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#172554] px-5">
          <form onSubmit={(event) => { event.preventDefault(); void handleOwnerLogin(); }} className="w-full max-w-md rounded-[26px] bg-white p-7 shadow-2xl">
            <img src={LOGO_SRC} alt="Logo Trimémo" className="mx-auto h-16 w-16 object-contain" />
            <div className="mt-4 text-center font-inter text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4A23A]">Accès privé</div>
            <h1 className="mt-2 text-center font-playfair text-3xl text-[#172554]">Espace propriétaire</h1>
            <p className="mt-3 text-center font-inter text-sm leading-[1.7] text-[#172554]/65">Accédez aux tests de Trimémo sans paiement réel.</p>
            <label className="mt-6 block font-inter text-xs font-semibold text-[#172554]/75">E-mail</label>
            <input type="email" required value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#172554]/10 px-4 font-inter text-sm" />
            <label htmlFor="owner-password" className="mt-4 block font-inter text-xs font-semibold text-[#172554]/75">Mot de passe</label>
            <div className="relative mt-2">
              <input
                id="owner-password"
                type={showOwnerPassword ? "text" : "password"}
                required
                value={ownerPassword}
                onChange={(event) => setOwnerPassword(event.target.value)}
                autoComplete="current-password"
                className="h-11 w-full rounded-xl border border-[#172554]/10 px-4 pr-12 font-inter text-sm outline-none transition focus:border-[#172554]/30 focus:ring-2 focus:ring-[#172554]/10"
              />
              <button
                type="button"
                onClick={() => setShowOwnerPassword((visible) => !visible)}
                aria-label={showOwnerPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                aria-pressed={showOwnerPassword}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-[#172554]/55 transition hover:text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#D4A23A]"
              >
                {showOwnerPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {ownerLoginError && <div className="mt-3 rounded-xl bg-red-50 p-3 font-inter text-xs text-red-700">{ownerLoginError}</div>}
            <button type="submit" disabled={ownerBusy} className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[#D4A23A] font-inter text-sm font-semibold text-[#172554] disabled:opacity-50">
              {ownerBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Se connecter"}
            </button>
            <button type="button" onClick={() => { window.location.href = "/"; }} className="mt-3 w-full font-inter text-xs text-[#172554]/60">Retour à la plateforme</button>
          </form>
        </div>
      )}

      {view !== "dashboard" && (<>
      <header className="sticky top-0 z-50 border-b border-white/15 bg-[#172554] backdrop-blur-xl">
        {clientProjectFlow ? (
          <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <img src={LOGO_SRC} alt="Logo Trimémo" className="h-12 w-12 object-contain" />
              <span className="font-playfair text-2xl font-semibold tracking-tight text-white">Trimé<span className="text-[#78C850]">mo</span></span>
            </div>
            <button type="button" onClick={() => { setClientProjectFlow(false); setView("dashboard"); void loadClientProjects(); }} className="rounded-full border border-white/25 px-4 py-2 font-inter text-xs font-semibold text-white hover:bg-white/10">
              Retour au tableau de bord
            </button>
          </div>
        ) : (
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 lg:px-8>
          <button onClick={() => setView("home")} className="flex items-center gap-3" aria-label="Retour à l’accueil">
            <img src={LOGO_SRC} alt="Logo Trimémo" className="h-12 w-12 object-contain" />
            <span className="font-playfair text-2xl font-semibold tracking-tight text-white">Trimé<span className="text-[#78C850]">mo</span></span>
          </button>
          <div className="hidden items-center gap-8 font-inter text-sm text-white md:flex">
            <button className="text-white hover:text-[#D4A23A]" onClick={() => navigateToSection("fonctionnement")}>Fonctionnement</button>
            <button className="text-white hover:text-[#D4A23A]" onClick={() => navigateToSection("formules")}>Formules</button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setView("project");
              }}
            >
              <span className="text-white hover:text-[#D4A23A]">Mon projet</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white md:hidden"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <button
              onClick={() => { setMobileMenuOpen(false); setView("dashboard"); void loadClientProjects(); }}
              className="hidden rounded-full border border-white/25 px-4 py-2 font-inter text-[12px] text-white sm:inline-flex"
            >
              Mon compte
            </button>
            <button
              onClick={goToProject}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#D4A23A] px-5 font-inter text-[13px] font-medium"
            >
              Commencer <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        )}
      </header>

      {!clientProjectFlow && mobileMenuOpen && (
        <div className="sticky top-[72px] z-40 border-b border-white/15 bg-[#172554] px-6 py-4 shadow-sm md:hidden">
          <div className="flex flex-col gap-1 font-inter text-sm text-white">
            <button onClick={() => navigateToSection("fonctionnement")} className="rounded-xl px-4 py-3 text-left hover:bg-white/10">Fonctionnement</button>
            <button onClick={() => navigateToSection("formules")} className="rounded-xl px-4 py-3 text-left hover:bg-white/10">Formules</button>
            <button onClick={() => { setMobileMenuOpen(false); setView("project"); }} className="rounded-xl px-4 py-3 text-left hover:bg-white/10">Mon projet</button>
            <button onClick={() => { setMobileMenuOpen(false); setView("dashboard"); void loadClientProjects(); }} className="rounded-xl px-4 py-3 text-left hover:bg-white/10">Mon compte client</button>
            {view === "preview" && preview && (
              <>
                <div className="mt-2 border-t border-white/10 pt-2 text-[10px] uppercase tracking-[0.18em] text-[#D4A23A]">Aperçu</div>
                {(["problematic","plan","introduction"] as const).map((tab) => (
                  <button key={tab} onClick={() => { setMobileMenuOpen(false); setPreviewTab(tab); }} className="rounded-xl px-4 py-2 text-left hover:bg-white/10">
                    {tab === "problematic" ? "Problématique" : tab === "plan" ? "Plan" : "Introduction"}
                  </button>
                ))}
              </>
            )}
            {view === "premium" && premium && (
              <>
                <div className="mt-2 border-t border-white/10 pt-2 text-[10px] uppercase tracking-[0.18em] text-[#D4A23A]">Problématiques</div>
                {premium.problematics.map((item,index) => (
                  <button key={item.id} onClick={() => { setMobileMenuOpen(false); setPremiumSection("problematic"); setPremiumNav("problematic-"+index); setSelectedProblematic(item); }} className="rounded-xl px-4 py-2 text-left hover:bg-white/10">Problématique {index+1}</button>
                ))}
                <div className="mt-2 border-t border-white/10 pt-2 text-[10px] uppercase tracking-[0.18em] text-[#D4A23A]">Plans</div>
                {premium.plans.map((plan,index) => (
                  <button key={plan.id} onClick={() => { setMobileMenuOpen(false); setPremiumSection("plan"); setPremiumNav("plan-"+index); setSelectedPlan(plan); }} className="rounded-xl px-4 py-2 text-left hover:bg-white/10">Plan {index+1}</button>
                ))}
                <button disabled={!selectedPlan} onClick={() => { setMobileMenuOpen(false); setPremiumSection("writing"); setView("writing"); }} className="rounded-xl px-4 py-3 text-left hover:bg-white/10 disabled:opacity-40">Rédaction</button>
              </>
            )}
            {view === "writing" && selectedPlan && (
              <button onClick={() => { setMobileMenuOpen(false); setView("writing"); }} className="rounded-xl px-4 py-3 text-left hover:bg-white/10">Rédaction</button>
            )}
          </div>
        </div>
      )}

      {view === "account" && (
        <section className="min-h-[72vh] bg-gradient-to-b from-[#EEF4FF] via-[#F8FAFC] to-[#EAF7EE] px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-xl rounded-3xl border border-[#172554]/10 bg-white p-6 shadow-sm sm:p-9">
            <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#D4A23A]">Compte client Trimémo</div>
            <h1 className="mt-3 font-playfair text-3xl font-bold text-[#172554]">{clientAuthMode === "signup" ? "Créez votre compte" : clientAuthMode === "login" ? "Connectez-vous" : clientAuthMode === "forgot" ? "Mot de passe oublié" : "Choisissez un nouveau mot de passe"}</h1>
            <p className="mt-3 font-inter text-sm leading-6 text-[#172554]/70">{clientAuthMode === "signup" ? "Créez votre compte avec votre prénom, votre nom, votre adresse e-mail et un mot de passe. Votre projet sera enregistré avant l’ouverture de PayPal." : clientAuthMode === "login" ? "Connectez-vous pour retrouver vos projets et poursuivre votre travail." : clientAuthMode === "forgot" ? "Saisissez l’adresse e-mail associée à votre compte. Si un compte correspond, vous recevrez un lien de réinitialisation." : "Saisissez un nouveau mot de passe d’au moins 8 caractères."}</p>
            <form className="mt-7 space-y-4" onSubmit={(event) => { event.preventDefault(); void submitClientAuth(); }}>
              {clientAuthMode === "signup" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block font-inter text-sm font-medium text-[#172554]">Prénom
                    <input type="text" required autoComplete="given-name" value={clientFirstName} onChange={(event) => setClientFirstName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#172554]/15 px-4 py-3 font-normal outline-none focus:border-[#D4A23A]" placeholder="Votre prénom" />
                  </label>
                  <label className="block font-inter text-sm font-medium text-[#172554]">Nom
                    <input type="text" required autoComplete="family-name" value={clientLastName} onChange={(event) => setClientLastName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#172554]/15 px-4 py-3 font-normal outline-none focus:border-[#D4A23A]" placeholder="Votre nom" />
                  </label>
                </div>
              )}
              {clientAuthMode !== "reset" && <label className="block font-inter text-sm font-medium text-[#172554]">Adresse e-mail
                <input type="email" required autoComplete="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-[#172554]/15 px-4 py-3 font-normal outline-none focus:border-[#D4A23A]" placeholder="vous@exemple.com" />
              </label>}
              {clientAuthMode !== "forgot" && <label className="block font-inter text-sm font-medium text-[#172554]">{clientAuthMode === "reset" ? "Nouveau mot de passe" : "Mot de passe"}
                <input type="password" required minLength={8} autoComplete={clientAuthMode === "signup" || clientAuthMode === "reset" ? "new-password" : "current-password"} value={clientPassword} onChange={(event) => setClientPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-[#172554]/15 px-4 py-3 font-normal outline-none focus:border-[#D4A23A]" placeholder="8 caractères minimum" />
              </label>}
              {clientAuthError && <div role="alert" className="rounded-xl bg-red-50 p-3 font-inter text-sm text-red-700">{clientAuthError}</div>}
              {clientAuthNotice && <div role="status" className="rounded-xl bg-[#EAF7EE] p-3 font-inter text-sm text-[#172554]">{clientAuthNotice}</div>}
              <button type="submit" disabled={clientAuthBusy || (clientAuthMode === "reset" && !clientRecoveryToken)} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#172554] px-5 py-3 font-inter text-sm font-semibold text-white disabled:opacity-60">
                {clientAuthBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : clientAuthMode === "signup" ? "Créer mon compte et continuer" : clientAuthMode === "login" ? "Se connecter" : clientAuthMode === "forgot" ? "Envoyer le lien de réinitialisation" : "Modifier mon mot de passe"}
              </button>
              {clientAuthMode === "reset" && !clientRecoveryToken && <p className="font-inter text-sm text-red-700">Ce lien est invalide ou incomplet. Demandez un nouveau lien de réinitialisation.</p>}
            </form>
            {clientAuthMode === "login" && <button type="button" onClick={() => { setClientAuthMode("forgot"); setClientAuthError(""); setClientAuthNotice(""); }} className="mt-5 w-full font-inter text-sm text-[#1D78C1]">Mot de passe oublié ?</button>}
            {clientAuthMode !== "reset" && <button type="button" onClick={() => { setClientAuthMode(clientAuthMode === "signup" ? "login" : clientAuthMode === "login" ? "signup" : "login"); setClientAuthError(""); setClientAuthNotice(""); }} className="mt-5 w-full font-inter text-sm text-[#1D78C1]">
              {clientAuthMode === "signup" ? "J’ai déjà un compte : me connecter" : clientAuthMode === "login" ? "Je n’ai pas encore de compte : m’inscrire" : "Retour à la connexion"}
            </button>}
            <button type="button" onClick={() => { setPendingPaymentMethod(null); setView("preview"); }} className="mt-4 w-full font-inter text-xs text-[#172554]/60">Retour à mon aperçu</button>
          </div>
        </section>
      )}

            </>)}

      {view === "dashboard" && (
        <section className="min-h-[72vh] bg-[#F2F5FC] px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl bg-[#172554] p-5 text-white shadow-lg sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><div className="font-inter text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A23A]">ESPACE CLIENT SÉCURISÉ</div><h1 className="mt-2 font-playfair text-3xl font-bold text-white sm:text-4xl">Mon tableau de bord</h1><p className="mt-2 font-inter text-sm text-white/75">{clientEmailDisplay || "Retrouvez vos documents et vos demandes."}</p></div>
                <button onClick={() => { window.localStorage.removeItem("trimemo_client_session"); setClientProjectFlow(false); setClientEmailDisplay(""); setClientProjects([]); setClientRevisions([]); setView("home"); }} className="rounded-full border border-white/30 px-5 py-3 font-inter text-sm font-semibold text-white hover:bg-white/10">Déconnexion</button>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <button type="button" onClick={() => setClientDashboardTab("documents")} className={`rounded-2xl border border-[#D7E1F7] bg-white p-4 text-left shadow-sm hover:bg-[#EAF0FF] sm:p-5 ${clientDashboardTab==="documents"?"ring-2 ring-[#172554] ring-offset-2":""}`}><span className="block font-inter text-xs font-semibold text-[#344A83] sm:text-sm">Documents rédigés</span><span className="mt-2 block font-playfair text-3xl font-bold text-[#172554]">{clientProjects.length}</span><span className="mt-1 block font-inter text-[11px] text-[#53658C]">Mes projets</span></button>
              <button type="button" onClick={() => setClientDashboardTab("in_progress")} className={`rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-left shadow-sm hover:bg-[#DBEAFE] sm:p-5 ${clientDashboardTab==="in_progress"?"ring-2 ring-[#2563EB] ring-offset-2":""}`}><span className="block font-inter text-xs font-semibold text-[#1D4ED8] sm:text-sm">Révisions en cours</span><span className="mt-2 block font-playfair text-3xl font-bold text-[#1D4ED8]">{clientRevisions.filter((r:any)=>r.status==="in_progress").length}</span><span className="mt-1 block font-inter text-[11px] text-[#1D4ED8]/75">Traitement en cours</span></button>
              <button type="button" onClick={() => setClientDashboardTab("pending")} className={`rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-4 text-left shadow-sm hover:bg-[#FEF3C7] sm:p-5 ${clientDashboardTab==="pending"?"ring-2 ring-[#D97706] ring-offset-2":""}`}><span className="block font-inter text-xs font-semibold text-[#92400E] sm:text-sm">Révisions en attente</span><span className="mt-2 block font-playfair text-3xl font-bold text-[#B45309]">{clientRevisions.filter((r:any)=>r.status!=="in_progress"&&r.status!=="completed").length}</span><span className="mt-1 block font-inter text-[11px] text-[#92400E]/75">À traiter</span></button>
              <button type="button" onClick={() => setClientDashboardTab("completed")} className={`rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-left shadow-sm hover:bg-[#DCFCE7] sm:p-5 ${clientDashboardTab==="completed"?"ring-2 ring-[#15803D] ring-offset-2":""}`}><span className="block font-inter text-xs font-semibold text-[#166534] sm:text-sm">Révisions terminées</span><span className="mt-2 block font-playfair text-3xl font-bold text-[#15803D]">{clientRevisions.filter((r:any)=>r.status==="completed").length}</span><span className="mt-1 block font-inter text-[11px] text-[#166534]/75">Documents livrés</span></button>
            </div>
            <div className="mt-6 rounded-3xl border border-[#DCE3F0] bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-playfair text-2xl font-bold text-[#172554]">{clientDashboardTab==="documents"?"Mes documents rédigés":clientDashboardTab==="in_progress"?"Demandes de révision en cours":clientDashboardTab==="pending"?"Demandes de révision en attente":"Révisions terminées et livrées"}</h2><p className="mt-1 font-inter text-sm text-[#64748B]">{clientDashboardTab==="documents"?"Retrouvez vos projets et demandez une révision humaine.":"Suivez l'avancement et récupérez les documents corrigés."}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={()=>{setClientDashboardTab("documents");void loadClientProjects();}} className="rounded-full border border-[#172554]/15 px-4 py-2 font-inter text-xs font-semibold text-[#172554] hover:bg-[#F2F5FC]">Actualiser</button><button type="button" onClick={startNewClientProject} className="rounded-full bg-[#D4A23A] px-4 py-2 font-inter text-xs font-semibold text-[#172554]">Nouveau projet</button></div></div>
              {clientDashboardTab==="documents"?<div className="mt-5 grid gap-4">{clientProjects.length?clientProjects.map((item)=><article key={item.project_id} className="flex flex-col gap-4 rounded-2xl border border-[#DCE3F0] bg-white p-5 shadow-sm transition hover:border-[#D4A23A] hover:shadow-md sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={()=>{void openClientProject(item.project_id);}} className="min-w-0 flex-1 text-left"><span className="block font-playfair text-xl font-semibold text-[#172554]">{item.subject||"Projet académique"}</span><span className="mt-2 block font-inter text-xs text-[#64748B]">Dernière mise à jour : {item.updated_at?new Date(item.updated_at).toLocaleString("fr-FR"):"Non disponible"}</span><span className="mt-2 inline-block rounded-full bg-[#EAF7EE] px-3 py-2 font-inter text-xs font-semibold text-[#2F6B45]">{item.payment_status==="paid"?"Premium payé":"Projet enregistré"}</span></button><button type="button" onClick={()=>{setRevisionTargetProjectId(item.project_id);setRevisionTargetTitle(item.subject||"Document Trimémo");setRevisionInstructions("");setRevisionFile(null);setRevisionError("");setRevisionMessage("");setRevisionModalOpen(true);}} className="rounded-full border border-[#172554]/20 px-4 py-3 font-inter text-xs font-semibold text-[#172554] hover:border-[#D4A23A] hover:bg-[#FFFBEB]">Demander une révision humaine</button></article>):<div className="rounded-2xl border border-dashed border-[#172554]/20 bg-[#F8FAFC] p-8 font-inter text-sm text-[#64748B]">Aucun document enregistré dans ce compte pour le moment.</div>}</div>:<div className="mt-5 grid gap-3">{clientRevisions.filter((r:any)=>clientDashboardTab==="in_progress"?r.status==="in_progress":clientDashboardTab==="pending"?r.status!=="in_progress"&&r.status!=="completed":r.status==="completed").length?clientRevisions.filter((r:any)=>clientDashboardTab==="in_progress"?r.status==="in_progress":clientDashboardTab==="pending"?r.status!=="in_progress"&&r.status!=="completed":r.status==="completed").map((revision:any)=><article key={revision.id} className={`rounded-2xl border p-4 sm:p-5 ${revision.status==="completed"?"border-[#BBF7D0] bg-[#F0FDF4]":revision.status==="in_progress"?"border-[#BFDBFE] bg-[#EFF6FF]":"border-[#FDE68A] bg-[#FFFBEB]"}`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-playfair text-lg font-bold text-[#172554]">{revision.document_title}</h3><p className="mt-1 font-inter text-xs text-[#64748B]">{revision.created_at?new Date(revision.created_at).toLocaleString("fr-FR"):""} · {revision.status==="completed"?"Terminée":revision.status==="in_progress"?"En cours":"En attente"}</p>{revision.admin_notes&&<p className="mt-2 whitespace-pre-wrap font-inter text-sm text-[#475569]">Note : {revision.admin_notes}</p>}</div>{revision.status==="completed"&&<button type="button" onClick={()=>void downloadClientRevision(String(revision.id))} className="rounded-full bg-[#15803D] px-4 py-2 font-inter text-xs font-semibold text-white">Télécharger le document corrigé</button>}</div></article>):<p className="rounded-xl bg-[#F8FAFC] p-5 font-inter text-sm text-[#64748B]">Aucune demande dans cette catégorie pour le moment.</p>}</div>}
            </div>
            {revisionModalOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#172554]/60 p-4" role="dialog" aria-modal="true" aria-labelledby="revision-modal-title"><form onSubmit={submitHumanRevision} className="max-h-[90vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8"><div className="flex items-start justify-between gap-4"><div><p className="font-inter text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A23A]">Assistance humaine</p><h2 id="revision-modal-title" className="mt-2 font-playfair text-2xl font-bold text-[#172554]">Demande de révision</h2><p className="mt-2 font-inter text-sm text-slate-600">Document sélectionné : {revisionTargetTitle} · Référence : {revisionTargetProjectId}</p></div><button type="button" onClick={()=>setRevisionModalOpen(false)} className="rounded-full border px-3 py-1 text-slate-600" aria-label="Fermer">✕</button></div><label className="block font-inter text-sm font-semibold text-[#172554]">Corrections demandées<textarea required minLength={10} value={revisionInstructions} onChange={e=>setRevisionInstructions(e.target.value)} rows={5} placeholder="Précisez les passages à corriger et les consignes à respecter…" className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-[#D4A23A]"/></label><label className="block font-inter text-sm font-semibold text-[#172554]">Document à corriger (PDF, Word, TXT ou RTF, 3 Mo maximum)<input required type="file" accept=".pdf,.doc,.docx,.txt,.rtf" onChange={e=>setRevisionFile(e.target.files?.[0]||null)} className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm font-normal"/></label>{revisionError&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{revisionError}</p>}{revisionMessage&&<p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{revisionMessage}</p>}<div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={()=>setRevisionModalOpen(false)} className="rounded-full border px-5 py-3 text-sm">Annuler</button><button type="submit" disabled={revisionSubmitting} className="rounded-full bg-[#D4A23A] px-5 py-3 text-sm font-semibold text-[#172554] disabled:opacity-50">{revisionSubmitting?"Envoi en cours…":"Envoyer la demande"}</button></div></form></div>}
          </div>
        </section>
      )}
      {view !== "dashboard" && (<>
      {view === "home" && (
        <>
          <section className="px-6 pb-24 pt-20 lg:px-8 lg:pt-28">
            <div className="mx-auto max-w-[820px] text-center">
              <div className="font-inter text-[11px] uppercase tracking-[0.22em] text-[#D4A23A]">Plateforme académique francophone internationale</div>
              <h1 className="mt-5 font-playfair text-5xl font-bold leading-[0.98] tracking-[-0.02em] lg:text-6xl">Une rédaction guidée par votre sujet réel.</h1>
              <p className="mx-auto mt-7 max-w-[690px] font-inter text-[16px] leading-[1.75] text-[#172554]/75">
                Vos consignes, votre contexte, vos documents et vos exigences commandent la génération. Aucun contenu académique préécrit n’est utilisé comme source de remplacement.
              </p>
              <div className="mt-9 flex justify-center">
                <button onClick={goToProject} className="inline-flex h-13 items-center gap-3 rounded-full bg-[#1D78C1] px-7 font-inter text-sm font-medium text-white">
                  Créer mon projet <ArrowRight className="h-4 w-4 text-[#D4A23A]" />
                </button>
              </div>
              <div className="mt-7 font-inter text-xs text-[#172554]/75">1 page = {WORDS_PER_PAGE} mots · Aperçu avant paiement · Coût calculé dès l’analyse</div>
            </div>
          </section>

          <section id="fonctionnement" className="border-y border-[#172554]/5 bg-[#EAF7EE] px-6 py-20 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-[1280px]">
              <div className="max-w-[650px]">
                <div className="font-inter text-[11px] uppercase tracking-[0.22em] text-[#D4A23A]">Fonctionnement</div>
                <h2 className="mt-4 font-playfair text-4xl leading-tight">Un flux qui sépare aperçu, validation et rédaction complète.</h2>
              </div>
              <div className="mt-12 grid gap-5 md:grid-cols-4">
                {[
                  ["01", "Votre formule", "Vous choisissez la formule qui correspond à votre niveau ou à votre besoin."],
                  ["02", "Votre dossier", "Sujet, contexte, consignes et documents sont transmis au moteur de génération."],
                  ["03", "Choix et validation", "Générez jusqu’à trois problématiques, améliorez-les ou proposez-en d’autres, puis comparez jusqu’à trois plans avant de choisir."],
                  ["04", "Aperçu rédactionnel puis accès complet", "Après validation de la problématique et du plan, rédigez jusqu’à 2 500 mots pour examiner le document en cours. Ces mots sont inclus dans le prix global du document : ils ne sont ni gratuits ni facturés une seconde fois. Le paiement permet de poursuivre la rédaction et d’exporter le document complet."],
                ].map(([n, title, text]) => (
                  <div key={n} className="rounded-[20px] border border-[#172554]/5 bg-white p-6">
                    <div className="font-inter text-[11px] tracking-[0.2em] text-[#D4A23A]">{n}</div>
                    <div className="mt-3 font-playfair text-xl">{title}</div>
                    <div className="mt-2 font-inter text-[13px] leading-[1.6] text-[#172554]/70">{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="formules"
            className="border-y border-[#172554]/5 bg-[#EAF7EE] px-6 py-20 lg:px-8 lg:py-24"
          >
            <div className="mx-auto max-w-[1280px]">
              <div>
                <div className="font-inter text-[11px] uppercase tracking-[0.22em] text-[#D4A23A]">
                  Tarifs Trimémo
                </div>
                <h2 className="mt-4 font-playfair text-4xl">
                  Tarification personnalisée
                </h2>
                <p className="mt-3 max-w-[760px] font-inter text-sm leading-[1.7] text-[#172554]/70">
                  Un coût estimé après analyse du pays, du type de document, du volume, du niveau et des exigences du guide.
                  La correction humaine est proposée en option et facturée séparément.
                </p>
              </div>

              <div className="mt-10 grid gap-5 lg:grid-cols-3">
                {pricing.individual.map((item) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setFormula(item.id as FormulaId);
                      setProject((current) => ({
                        ...current,
                        formula: item.id as FormulaId,
                      }));
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setFormula(item.id as FormulaId);
                        setProject((current) => ({
                          ...current,
                          formula: item.id as FormulaId,
                        }));
                      }
                    }}
                    className={`rounded-[24px] border p-7 text-left transition ${
                      formula === item.id
                        ? "border-[#172554] bg-[#172554] text-white"
                        : "border-[#172554]/10 bg-white hover:border-[#172554]/25"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-playfair text-2xl">{item.title}</div>
                      {item.id === "MASTER" && (
                        <span className="rounded-full bg-[#D4A23A] px-2.5 py-1 font-inter text-[10px] font-semibold text-[#172554]">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <div
                      className={`mt-2 font-inter text-xs ${
                        formula === item.id ? "text-white/55" : "text-[#172554]/75"
                      }`}
                    >
                      {item.pages}
                    </div>

                    <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
                      <span className="font-playfair text-3xl">{item.eur}</span>
                      <span
                        className={`pb-1 font-inter text-xs ${
                          formula === item.id ? "text-white/55" : "text-[#172554]/75"
                        }`}
                      >
                        {item.fcfa}
                      </span>
                    </div>

                    <div
                      className={`mt-4 font-inter text-xs leading-[1.6] ${
                        formula === item.id ? "text-white/70" : "text-[#172554]/60"
                      }`}
                    >
                      {item.details}
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="font-inter text-xs font-semibold">
                        {formula === item.id ? "Formule sélectionnée" : "Sélectionner cette formule →"}
                      </span>
                      {formula === item.id && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            goToProject();
                          }}
                          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#D4A23A] px-5 font-inter text-xs font-semibold text-[#172554] transition hover:brightness-95"
                        >
                          Commencer <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-[22px] border border-[#172554]/10 bg-white p-6">
                <div className="font-playfair text-xl">
                  Inclus dans votre projet
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {pricingInclusions.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full bg-[#EAF7EE] px-3 py-2 font-inter text-xs text-[#172554]/70"
                    >
                      <Check className="h-3.5 w-3.5 text-[#D4A23A]" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {(view === "project" || view === "estimate" || view === "preview" || view === "premium" || view === "writing") && (
        <main className={`min-h-[calc(100vh-72px)] bg-[#EAF7EE] px-6 py-8 lg:px-8 lg:py-10 ${view === "writing" ? "h-[calc(100vh-72px)] overflow-y-auto overscroll-contain" : ""}`}>
          <div className="mx-auto max-w-[1220px]">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                {(
                  <button
                    onClick={() => { if (clientProjectFlow) { setClientProjectFlow(false); setView("dashboard"); void loadClientProjects(); } else { setView("home"); } }}
                    className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#172554]/10 bg-white"
                    aria-label="Retour à l'accueil"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </button>
                )}
                <div>
                <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#D4A23A]">Projet académique</div>
                <h2 className="mt-2 font-playfair text-3xl">{view === "project" ? "Définissez votre demande" : view === "estimate" ? "Analyse du projet · Estimation du coût" : view === "preview" ? "Votre aperçu avant paiement" : view === "premium" ? "Vos options premium" : selectedPlan && selectedProblematic ? selectedPlan.title : ""}</h2>
              </div>
              <div className="font-inter text-xs text-[#172554]/75">1 page = {WORDS_PER_PAGE} mots</div>
            </div>

            {generationError && view === "project" && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-inter text-sm leading-6 text-red-700">
                <strong>Erreur de génération :</strong> {generationError}
              </div>
            )}

              {view === "estimate" && estimate && (
              <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <article className="rounded-[24px] border border-[#172554]/10 bg-white p-7 lg:p-9">
                  <div className="font-inter text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">Analyse du projet</div>
                  <h3 className="mt-3 font-playfair text-3xl text-[#172554]">Estimation du coût</h3>
                  <p className="mt-4 font-inter text-sm leading-[1.8] text-[#172554]/75">Trimémo a analysé le sujet, le niveau, les consignes et les documents fournis. Le montant est provisoire et couvre le service automatisé prévu pour le projet, y compris les propositions, les améliorations, les contrôles automatiques et l’aperçu avant paiement. La correction humaine est une prestation distincte, non comprise dans ce prix.</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#F7FAF8] p-4"><div className="font-inter text-xs text-[#172554]/60">Type de document</div><div className="mt-1 font-inter text-sm font-semibold text-[#172554]">{project.typeDoc}</div></div>
                    <div className="rounded-2xl bg-[#F7FAF8] p-4"><div className="font-inter text-xs text-[#172554]/60">Niveau académique</div><div className="mt-1 font-inter text-sm font-semibold text-[#172554]">{project.niveau}</div></div>
                    <div className="rounded-2xl bg-[#F7FAF8] p-4"><div className="font-inter text-xs text-[#172554]/60">Volume demandé</div><div className="mt-1 font-inter text-sm font-semibold text-[#172554]">{estimate.pages} pages · {(estimate.pages * estimate.wordsPerPage).toLocaleString("fr-FR")} mots</div></div>
                    <div className="rounded-2xl bg-[#F7FAF8] p-4"><div className="font-inter text-xs text-[#172554]/60">Complexité détectée</div><div className="mt-1 font-inter text-sm font-semibold capitalize text-[#172554]">{estimate.complexity === "elevee" ? "Élevée" : estimate.complexity}</div></div>
                  </div>
                  <div className="mt-6 rounded-2xl border border-[#172554]/10 p-5">
                    <div className="font-inter text-xs font-semibold uppercase tracking-wide text-[#172554]/60">Critères pris en compte</div>
                    <ul className="mt-3 space-y-2 font-inter text-sm leading-[1.7] text-[#172554]/80">
                      {(estimate.detectedRequirements || []).map((item, index) => <li key={index}>• {item}</li>)}
                      {(estimate.reasons || []).map((item, index) => <li key={"reason-"+index}>• {item}</li>)}
                    </ul>
                  </div>
                  {!estimate.countryDetected && <p className="mt-4 rounded-xl bg-[#FFF8E7] p-3 font-inter text-xs leading-[1.6] text-[#6B4B08]">Le pays n'a pas pu être détecté automatiquement. Le prix utilise provisoirement le marché international. Vérifiez le pays avant le paiement si ce tarif ne correspond pas à votre situation.</p>}
                </article>
                <aside className="h-fit rounded-[24px] bg-[#172554] p-7 text-white lg:sticky lg:top-[98px]">
                  <div className="font-inter text-[11px] uppercase tracking-[0.18em] text-[#D4A23A]">{estimate.marketLabel}</div>
                  <div className="mt-5 font-inter text-xs text-white/65">Coût approximatif du projet</div>
                  <div className="mt-2 font-playfair text-4xl">{estimate.formattedAmount} {estimate.currency === "XOF" ? "FCFA" : estimate.currency === "EUR" ? "€" : estimate.currency === "CAD" ? "CA$" : estimate.currency === "CHF" ? "CHF" : "US$"}</div>
                  <div className="mt-3 font-inter text-xs leading-[1.7] text-white/65">Tarif de base {estimate.baseRate} {estimate.currency === "XOF" ? "FCFA" : estimate.currency === "EUR" ? "€" : estimate.currency === "CAD" ? "CA$" : estimate.currency === "CHF" ? "CHF" : "US$"} par page × coefficient de niveau {estimate.levelCoefficient} × coefficient de complexité {estimate.complexityCoefficient}.</div>
                  {estimate.currency === "XOF" && <div className="mt-3 rounded-xl bg-white/10 p-3 font-inter text-xs leading-[1.6] text-white/80">Si vous payez par PayPal, le montant sera converti en euros selon la parité fixe FCFA/euro : environ {estimate.checkoutAmount} €.</div>}
                  <div className="mt-5 rounded-xl border border-white/15 p-3 font-inter text-xs leading-[1.7] text-white/75">Le montant affiché couvre le document complet. Les 2 500 mots de l’aperçu sont inclus dans ce prix global : ils ne sont pas gratuits et ne seront pas facturés une seconde fois.</div>
                  <button onClick={() => void generatePublicProblematics()} disabled={loading} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#D4A23A] font-inter text-sm font-semibold text-[#172554] disabled:opacity-50">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Commencer les problématiques
                  </button>
                  <button onClick={() => { setProject((current) => ({ ...current, projectId: createProjectId(), pricingQuoteToken: undefined })); setEstimate(null); setPremium(null); setPreview(null); setSelectedProblematic(null); setSelectedPlan(null); setBlocks([]); setProblematicGenerationCount(0); setPlanGenerationCount(0); setView("project"); }} className="mt-3 w-full rounded-full border border-white/20 px-4 py-3 font-inter text-xs font-semibold text-white">Modifier les informations</button>
                </aside>
              </section>
            )}



          {view === "project" && (
              <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
                <section className="rounded-[24px] border border-[#172554]/5 bg-white p-7 lg:p-9">
                  <div className="grid gap-6">
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">Sujet exact *</label>
                      <textarea value={project.sujet} onChange={(e) => setProject({ ...project, sujet: e.target.value })} className="mt-2 min-h-[110px] w-full rounded-[16px] border border-[#172554]/10 bg-[#FFFFFF] p-4 font-inter text-sm outline-none focus:border-[#172554]/30" placeholder="Saisissez le sujet tel qu’il vous a été attribué." />
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">Contexte de recherche</label>
                      <textarea value={project.contexte} onChange={(e) => setProject({ ...project, contexte: e.target.value })} className="mt-2 min-h-[110px] w-full rounded-[16px] border border-[#172554]/10 bg-[#FFFFFF] p-4 font-inter text-sm outline-none focus:border-[#172554]/30" placeholder="Terrain, organisation, population, période, secteur, problématique déjà envisagée, ou toute précision utile. Ne renseignez qu’un pays s’il fait réellement partie du sujet." />
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">Problématique personnelle (facultatif)</label>
                      <textarea value={project.problematiquePersonnelle} onChange={(e) => setProject({ ...project, problematiquePersonnelle: e.target.value })} className="mt-2 min-h-[100px] w-full rounded-[16px] border border-[#172554]/10 bg-[#FFFFFF] p-4 font-inter text-sm outline-none focus:border-[#172554]/30" placeholder="Si vous avez déjà une problématique, saisissez-la ici. Elle sera conservée et vérifiée." />
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">Plan personnel (facultatif)</label>
                      <textarea value={project.planPersonnel} onChange={(e) => setProject({ ...project, planPersonnel: e.target.value })} className="mt-2 min-h-[120px] w-full rounded-[16px] border border-[#172554]/10 bg-[#FFFFFF] p-4 font-inter text-sm outline-none focus:border-[#172554]/30" placeholder="Si vous avez déjà un plan, saisissez-le ici. Il sera utilisé après vérification de sa cohérence." />
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">Consignes de l’établissement ou du client</label>
                      <textarea value={project.consignes} onChange={(e) => setProject({ ...project, consignes: e.target.value })} className="mt-2 min-h-[150px] w-full rounded-[16px] border border-[#172554]/10 bg-[#FFFFFF] p-4 font-inter text-sm outline-none focus:border-[#172554]/30" placeholder="Collez ici les consignes textuelles, méthodologiques ou de mise en forme." />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">Documents du projet</label>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#172554]/10 bg-white px-3 py-2 font-inter text-xs">
                          <Paperclip className="h-3.5 w-3.5" /> Ajouter des fichiers
                          <input type="file" multiple accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff" onChange={(e) => void handleFiles(e.target.files)} className="hidden" />
                        </label>
                      </div>
                      <div className="mt-3 rounded-[16px] border border-dashed border-[#172554]/15 bg-[#FFFFFF] p-5">
                        <div className="font-inter text-xs text-[#172554]/70">PDF, DOCX, TXT, Markdown, JPG ou PNG. Les documents et images transmis sont analysés par le moteur OpenAI avec votre demande.</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {project.files.map((file, index) => (
                            <span key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-[#172554]/10 bg-white px-3 py-1.5 font-inter text-[11px]">
                              <FileText className="h-3.5 w-3.5" /> <span className="max-w-[180px] truncate">{file.name}</span>
                              <select value={file.category || "reference"} onChange={(event) => {
                              const category = event.target.value as FileCategory;
                              setProject((current) => ({
                                ...current,
                                files: current.files.map((item, itemIndex) => itemIndex === index ? { ...item, category } : item),
                              }));
                            }} className="rounded-lg border border-[#172554]/10 bg-white px-2 py-1 text-[11px]">
                              <option value="methodology">Méthodologie</option>
                              <option value="instructions">Instructions</option>
                              <option value="context">Contexte</option>
                              <option value="source">Source</option>
                              <option value="reference">Référence</option>
                            </select>
                              <button onClick={() => setProject((current) => ({ ...current, files: current.files.filter((_, fileIndex) => fileIndex !== index) }))}><X className="h-3 w-3" /></button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <aside className="h-fit rounded-[24px] border border-[#172554]/5 bg-white p-7 lg:sticky lg:top-[98px]">
                  <div className="font-playfair text-xl">Paramètres du projet</div>
                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">Formule</label>
                      <div className="mt-2 rounded-[12px] bg-[#172554] px-4 py-3 font-inter text-sm text-white">{formulaOptions.find((item) => item.id === project.formula)?.title || "À sélectionner"}</div>
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">Niveau *</label>
                      <select value={project.niveau} onChange={(e) => setProject({ ...project, niveau: e.target.value })} className="mt-2 h-11 w-full rounded-[12px] border border-[#172554]/10 bg-white px-4 font-inter text-sm">
                        <option value="">Sélectionnez un niveau</option>
                        <option>Licence 1</option><option>Licence 2</option><option>Licence 3</option>
                        <option>Master 1</option><option>Master 2</option><option>Doctorat</option><option>Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">Domaine *</label>
                      <select value={project.domaine} onChange={(e) => setProject({ ...project, domaine: e.target.value })} className="mt-2 h-11 w-full rounded-[12px] border border-[#172554]/10 bg-white px-4 font-inter text-sm">
                        <option value="">Sélectionnez un domaine</option>
                        {domainOptions.map((domain) => <option key={domain} value={domain}>{domain}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">Type de document *</label>
                      <select value={project.typeDoc} onChange={(e) => setProject({ ...project, typeDoc: e.target.value })} className="mt-2 h-11 w-full rounded-[12px] border border-[#172554]/10 bg-white px-4 font-inter text-sm">
                        <option value="">Sélectionnez un type</option>
                        <option>Mémoire</option><option>Thèse</option><option>Rapport</option><option>Dissertation</option><option>Devoir</option><option>Article scientifique</option><option>Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">Nombre de pages</label>
                      <input type="number" min={1} max={maxPagesForFormula(project.formula)} value={project.pages || ""} onChange={(e) => {
                        const raw = e.target.value;
                        setProject({ ...project, pages: raw === "" ? 0 : Math.min(maxPagesForFormula(project.formula), Number(raw)) });
                      }} className="mt-2 h-11 w-full rounded-[12px] border border-[#172554]/10 px-4 font-inter text-sm" />
                      <div className="mt-2 font-inter text-[11px] text-[#172554]/75">Objectif de rédaction : {targetWords.toLocaleString("fr-FR")} mots</div>
                    </div>
                  </div>
                  <button onClick={() => void analyzeProject()} disabled={loading} className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1D78C1] font-inter text-sm font-medium text-white disabled:opacity-50">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[#D4A23A]" />}
                    Analyser le projet et estimer le coût
                  </button>
                </aside>
              </div>
            )}

            {view === "preview" && preview && !ownerRoute && (
            <section
              className="mb-7 mx-auto max-w-[900px] select-none rounded-lg border border-[#172554]/10 bg-[#E5E7EB] p-3 sm:p-8"
              onCopy={(event) => event.preventDefault()}
              onCut={(event) => event.preventDefault()}
              onContextMenu={(event) => event.preventDefault()}
            >
              <div className="mx-auto bg-white px-6 py-10 text-[#171717] shadow-lg sm:px-14 sm:py-16" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "11pt", lineHeight: 1.55, fontWeight: 400 }}>
                <div className="mb-8 border-b pb-5 text-center">
                  <div className="text-xs uppercase tracking-[0.12em] text-[#555]">Aperçu du document académique</div>
                  <h2 className="mt-4 text-xl font-bold">{project.sujet || selectedPlan?.title || "Projet académique"}</h2>
                  <div className="mx-auto mt-4 max-w-[620px] border-t border-b border-[#999] py-3 text-left text-sm">
                    <div><strong>Problématique :</strong> {preview.problematic.question}</div>
                    <div className="mt-2"><strong>Plan retenu :</strong> {preview.plan.title}</div>
                  </div>
                  <div className="mt-3 text-sm">{academicPreviewSegments().reduce((sum, segment) => sum + segment.words, 0).toLocaleString("fr-FR")} / 2 500 mots rédigés</div>
                </div>
                <section className="mb-10 border-b border-[#999] pb-8">
                  <h3 className="mb-5 text-center text-base font-bold uppercase tracking-wide">Sommaire</h3>
                  <div className="space-y-3 text-sm">
                    <div className="font-semibold">Introduction générale</div>
                    {preview.plan.parts.map((part) => (
                      <div key={part.id}>
                        <div className="font-bold uppercase">PARTIE {part.number}. {part.title}</div>
                        <div className="mt-2 space-y-2 pl-4">
                          {part.chapters.map((chapter) => (
                            <div key={chapter.id}>
                              <div className="font-semibold">Chapitre {chapter.number}. {chapter.title}</div>
                              <div className="mt-1 space-y-1 pl-4">
                                {chapter.sections.map((section) => (
                                  <div key={section.id}>
                                    <div>Section {chapter.number}.{section.number}. {section.title}</div>
                                    {section.subsections.map((sub) => <div key={sub.id} className="pl-4 text-xs">{chapter.number}.{section.number}.{sub.number} {sub.title}</div>)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="font-semibold">Conclusion générale</div>
                  </div>
                </section>
                {academicPreviewSegments().map((segment, index) => (
                  <article key={segment.id} className="mb-8">
                    <h3 className={`mb-5 font-bold ${segment.kind === "introduction" ? "text-center text-lg uppercase" : "text-base"}`}>{segment.title}</h3>
                    <div className="font-normal text-[11pt] leading-[1.55] text-[#171717]">
                      {renderAcademicText(
                        segment.content,
                        true
                      )}
                    </div>
                  </article>
                ))}
                <div className="mt-10 border-t pt-4 text-center text-xs italic text-[#555]">Fin de l’aperçu. Le paiement permet de poursuivre la rédaction au point d’arrêt.</div>
              </div>
            </section>
          )}
            {view === "preview" && preview && (
              <section className="mx-auto mt-6 max-w-[900px] rounded-[24px] bg-[#172554] p-6 text-white sm:p-8">
                <div className="text-center">
                  <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#D4A23A]">Poursuivre le document</div>
                  <h3 className="mt-2 font-playfair text-2xl sm:text-3xl">Votre aperçu est terminé</h3>
                  <p className="mx-auto mt-3 max-w-[650px] font-inter text-sm leading-6 text-white/75">Le paiement débloque la suite de la rédaction au point d’arrêt, en conservant la problématique et le plan choisis.</p>
                  {estimate && (
                    <div className="mx-auto mt-5 max-w-[560px] rounded-2xl border border-white/15 bg-white/5 p-4 text-left">
                      <div className="font-inter text-xs font-semibold uppercase tracking-wide text-[#D4A23A]">Récapitulatif de l’analyse initiale</div>
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 font-inter text-xs leading-5">
                        <div><dt className="text-white/60">Document</dt><dd className="font-semibold text-white">{estimate.documentType || project.typeDoc}</dd></div>
                        <div><dt className="text-white/60">Niveau</dt><dd className="font-semibold text-white">{estimate.level || project.niveau}</dd></div>
                        <div><dt className="text-white/60">Volume demandé</dt><dd className="font-semibold text-white">{estimate.pages || project.pages} pages</dd></div>
                        <div><dt className="text-white/60">Complexité évaluée</dt><dd className="font-semibold text-white">{estimate.complexity || "À confirmer"}</dd></div>
                      </dl>
                      {estimate.reasons?.length > 0 && <div className="mt-4"><div className="font-inter text-[11px] font-semibold text-white/75">Éléments pris en compte</div><ul className="mt-2 list-disc space-y-1 pl-5 font-inter text-xs leading-5 text-white/75">{estimate.reasons.map((reason, i) => <li key={"estimate-reason-"+i}>{reason}</li>)}</ul></div>}
                      {estimate.detectedRequirements?.length > 0 && <div className="mt-3"><div className="font-inter text-[11px] font-semibold text-white/75">Exigences détectées</div><ul className="mt-2 list-disc space-y-1 pl-5 font-inter text-xs leading-5 text-white/75">{estimate.detectedRequirements.map((item, i) => <li key={"estimate-requirement-"+i}>{item}</li>)}</ul></div>}
                      <div className="mt-5 border-t border-white/15 pt-4">
                        <div className="font-inter text-xs text-white/65">Montant estimé pour terminer et exporter le document complet</div>
                        <div className="mt-1 font-playfair text-2xl">{estimate.formattedAmount} {estimate.currency === "XOF" ? "FCFA" : estimate.currency === "EUR" ? "€" : estimate.currency === "CAD" ? "CA$" : estimate.currency === "CHF" ? "CHF" : "US$"}</div>
                        <p className="mt-2 font-inter text-xs leading-5 text-white/70">Ce montant couvre l’ensemble du document demandé, y compris les {totalDoneWords.toLocaleString("fr-FR")} mots déjà rédigés pour l’aperçu. Ces mots sont comptabilisés dans le prix global : ils ne sont ni gratuits ni facturés une seconde fois. Après paiement, la rédaction reprend au point d’arrêt et le document complet pourra être exporté.</p>
                      </div>
                    </div>
                  )}
                  <div className="mx-auto mt-5 grid max-w-[420px] gap-3">
                    {String(import.meta.env.VITE_PAYPAL_ENABLED || "").toLowerCase() === "true" ? (
                      <button onClick={() => void startPayment("paypal")} disabled={paymentLoading !== null} className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#D4A23A] font-inter text-sm font-semibold text-[#172554] disabled:opacity-60">
                        {paymentLoading === "paypal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
                        Payer pour continuer
                      </button>
                    ) : (
                      <button type="button" disabled className="flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-[#D4A23A]/50 font-inter text-sm font-semibold text-[#172554]" title="Le prestataire de paiement doit être activé dans la configuration de Trimémo.">
                        <LockKeyhole className="h-4 w-4" />
                        Payer pour continuer
                      </button>
                    )}
                    {String(import.meta.env.VITE_PAYPAL_ENABLED || "").toLowerCase() !== "true" && String(import.meta.env.VITE_MOBILE_MONEY_ENABLED || "").toLowerCase() !== "true" && (
                      <p className="text-center font-inter text-xs leading-5 text-white/70">Le paiement n’est pas encore activé. La configuration du prestataire est nécessaire pour encaisser les paiements.</p>
                    )}
                    {String(import.meta.env.VITE_MOBILE_MONEY_ENABLED || "").toLowerCase() === "true" && (
                      <button onClick={() => void startPayment("mobile-money")} disabled={paymentLoading !== null} className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 font-inter text-sm font-semibold text-white disabled:opacity-60">
                        {paymentLoading === "mobile-money" ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
                        Payer pour continuer par Mobile Money
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            
          
          {view === "premium" && premium && (
            <section>
              <div className="mb-6">
                <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">
                  Résultats du projet
                </div>
                <h1 className="mt-2 font-playfair text-4xl text-[#172554]">Problématiques, plans et rédaction</h1>
              </div>

              <div className="min-w-0">
                  {generationError && premiumSection === "problematic" && (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-inter text-sm leading-6 text-red-700">
                      <strong>Erreur de génération du plan :</strong> {generationError}
                    </div>
                  )}

                  {premiumSection === "problematic" && (() => {
                    const index = Number(premiumNav.replace("problematic-", "") || 0);
                    const item = premium.problematics[index] || premium.problematics[0];
                    return item ? (
                      <article className="rounded-[24px] border border-[#172554]/10 bg-white p-7 shadow-sm lg:p-10">
                        <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">
                          Problématique {index + 1}
                        </div>
                        <h2 className="mt-3 font-playfair text-3xl text-[#172554]">{item.title}</h2>
                        <p className="mt-6 font-inter text-base leading-[1.9] text-[#172554]/80">{item.question}</p>
                        {item.angle && <div className="mt-5 rounded-2xl bg-[#EAF7EE] p-5 font-inter text-sm leading-[1.8] text-[#172554]/80"><strong>Angle :</strong> {item.angle}</div>}
                        {item.rationale && <div className="mt-4 rounded-2xl bg-[#F7FAF8] p-5 font-inter text-sm leading-[1.8] text-[#172554]/70">{item.rationale}</div>}
                        <div className="mt-6 grid gap-3 rounded-2xl border border-[#172554]/10 bg-[#F7FAF8] p-4">
                          <div className="font-inter text-xs font-semibold uppercase tracking-wide text-[#172554]/65">Améliorer ou comparer la problématique</div>
                          <textarea value={problematicImprovementComments[item.id] || ""} onChange={(event) => setProblematicImprovementComments((current) => ({ ...current, [item.id]: event.target.value }))} rows={3} placeholder="Indiquez ce qui doit être précisé ou corrigé." className="w-full rounded-xl border border-[#172554]/10 bg-white px-4 py-3 font-inter text-sm" />
                          <div className="flex flex-wrap gap-2">
                            <button type="button" disabled={loading || problematicGenerationCount >= 3} onClick={() => void generateProblematicVariant("improve", item, problematicImprovementComments[item.id] || "")} className="rounded-full border border-[#172554]/15 bg-white px-4 py-2 font-inter text-xs font-semibold text-[#172554] disabled:opacity-50">Améliorer cette problématique</button>
                            <button type="button" disabled={loading || problematicGenerationCount >= 3} onClick={() => void generateProblematicVariant("alternative", item)} className="rounded-full border border-[#1D78C1]/30 bg-white px-4 py-2 font-inter text-xs font-semibold text-[#1D78C1] disabled:opacity-50">Proposer une autre</button>
                          </div>
                          <div className="font-inter text-[11px] text-[#172554]/55">{problematicGenerationCount}/3 propositions utilisées</div>
                        </div>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => void generatePlansForProblematic(item, ownerSessionValid)}
                          className="mt-7 rounded-full bg-[#1D78C1] px-6 py-3 font-inter text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {loading && selectedProblematic?.id === item.id ? "Génération du plan..." : "Générer un plan"}
                        </button>
                      </article>
                    ) : null;
                  })()}

                  {premiumSection === "plan" && (() => {
                    const index = Number(premiumNav.replace("plan-", "") || 0);
                    const plan = premium.plans[index] || premium.plans[0];
                    return plan ? (
                      <article className="rounded-[24px] border border-[#172554]/10 bg-white p-7 shadow-sm lg:p-10">
                        <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">
                          Plan {index + 1}
                        </div>
                        <h2 className="mt-3 font-playfair text-3xl text-[#172554]">{plan.title}</h2>
                        <div className="mt-7 space-y-5 font-inter">
                          {plan.parts.map((part) => (
                            <div key={part.id}>
                              <div className="font-bold uppercase text-[#172554]">PARTIE {part.number}. {part.title}</div>
                              <div className="mt-3 space-y-3 pl-4">
                                {part.chapters.map((chapter) => (
                                  <div key={chapter.id}>
                                    <div className="font-semibold text-[#172554]">Chapitre {chapter.number}. {chapter.title}</div>
                                    <div className="mt-2 space-y-2 pl-5">
                                      {chapter.sections.map((section) => (
                                        <div key={section.id}>
                                          <div className="text-sm font-semibold text-[#172554]/90">Section {chapter.number}.{section.number}. {section.title}</div>
                                          {section.subsections.map((subsection) => (
                                            <div key={subsection.id} className="mt-1 pl-5 text-xs text-[#172554]/70">
                                              § {chapter.number}.{section.number}.{subsection.number} {subsection.title}
                                              {subsection.internalTitles.map((internal) => (
                                                <div key={internal.id} className="pl-4 text-[11px] text-[#172554]/55">{internal.number}. {internal.title}</div>
                                              ))}
                                            </div>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-8 grid gap-3 rounded-2xl border border-[#172554]/10 bg-[#F7FAF8] p-5">
                          <div className="font-inter text-xs font-semibold uppercase tracking-[0.12em] text-[#172554]/60">Validation du plan</div>
                          <textarea
                            value={planImprovementComments[plan.id] || ""}
                            onChange={(event) => setPlanImprovementComments((current) => ({ ...current, [plan.id]: event.target.value }))}
                            rows={4}
                            placeholder="Décrivez précisément les modifications souhaitées pour améliorer ce plan."
                            className="w-full rounded-xl border border-[#172554]/10 bg-white px-4 py-3 font-inter text-sm"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button type="button" disabled={loading} onClick={() => void generatePlansForProblematic(selectedProblematic || premium.problematics[0], ownerRoute === true, undefined, { action: "improve", currentPlan: plan, comments: planImprovementComments[plan.id] || "" })} className="rounded-full border border-[#172554]/15 bg-white px-5 py-3 font-inter text-xs font-semibold text-[#172554] disabled:opacity-50">Demander une amélioration</button>
                            <button type="button" disabled={loading || premium.plans.length >= 3} onClick={() => void generatePlansForProblematic(selectedProblematic || premium.problematics[0], ownerRoute === true, undefined, { action: "alternative" })} className="rounded-full border border-[#1D78C1]/30 bg-white px-5 py-3 font-inter text-xs font-semibold text-[#1D78C1] disabled:opacity-50">Générer un autre plan</button>
                            <button type="button" disabled={loading} onClick={() => {
                              const problematic = selectedProblematic || premium.problematics[0];
                              if (!problematic) return;
                              setSelectedProblematic(problematic);
                              selectPremiumPlan(problematic, plan);
                              // Confirmer explicitement la navigation après la sélection du plan.
                              setView("writing");
                              setPremiumSection("writing");
                              pushToast("success", "Plan retenu. Les blocs de rédaction sont prêts.");
                            }} className="rounded-full bg-[#172554] px-5 py-3 font-inter text-xs font-semibold text-white disabled:opacity-50">Valider ce plan</button>
                          </div>
                          {selectedPlan?.id === plan.id && <div className="font-inter text-xs font-semibold text-[#2F6B45]">Plan retenu</div>}
                          <div className="font-inter text-[11px] text-[#172554]/55">{planGenerationCount}/3 génération(s) de plan utilisée(s)</div>
                        </div>
                      </article>
                    ) : (
                      <div className="rounded-[24px] bg-white p-8 font-inter text-sm text-[#172554]/65">
                        Aucun plan n’est encore disponible. Sélectionnez une problématique et générez un plan.
                      </div>
                    );
                  })()}
                </div>

            </section>
          )}
          {(view === "writing" || (view === "premium" && premiumSection === "writing")) && (!selectedPlan || !selectedProblematic) && (
            <section className="grid min-h-[60vh] gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <aside className="h-fit rounded-2xl border border-[#172554]/10 bg-white p-4">
                <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">Navigation du projet</div>
                <nav className="mt-4 space-y-2">
                  <button type="button" onClick={() => { setView("premium"); setPremiumSection("problematic"); setPremiumNav("problematic-0"); }} className="w-full rounded-xl px-4 py-3 text-left font-inter text-sm text-[#172554] hover:bg-[#EAF7EE]">1. Problématique</button>
                  <button type="button" onClick={() => { setView("premium"); setPremiumSection("plan"); setPremiumNav("plan-0"); }} className="w-full rounded-xl px-4 py-3 text-left font-inter text-sm text-[#172554] hover:bg-[#EAF7EE]">2. Plan validé</button>
                  <button type="button" onClick={() => { const p = selectedPlan || premium?.plans?.[0]; const q = selectedProblematic || premium?.problematics?.[0]; if (p && q) selectPremiumPlan(q, p); }} className="w-full rounded-xl bg-[#172554] px-4 py-3 text-left font-inter text-sm font-semibold text-white">3. Rédaction</button>
                </nav>
              </aside>
              <div className="rounded-2xl border border-amber-200 bg-white p-6 font-inter text-sm leading-6 text-[#172554]/75">
                <h2 className="font-playfair text-2xl text-[#172554]">Préparation de l’espace de rédaction</h2>
                <p className="mt-3">Le plan ou la problématique n’a pas été restauré correctement. Utilisez le menu de gauche pour revenir au plan, puis validez-le à nouveau.</p>
                {generationError && <p className="mt-3 text-red-700">{generationError}</p>}
              </div>
            </section>
          )}
          {(view === "writing" || (view === "premium" && premiumSection === "writing")) && selectedPlan && selectedProblematic && (
              <section className="min-h-full">
                <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <aside className="h-fit rounded-2xl border border-[#172554]/10 bg-white p-4 lg:sticky lg:top-5">
                    <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">Navigation du projet</div>
                    <nav className="mt-4 space-y-2">
                      <button type="button" onClick={() => { setView("premium"); setPremiumSection("problematic"); setPremiumNav("problematic-0"); setWritingTab("problematic"); }} className="w-full rounded-xl px-4 py-3 text-left font-inter text-sm text-[#172554] hover:bg-[#EAF7EE]">1. Problématique</button>
                      <button type="button" onClick={() => { setView("premium"); setPremiumSection("plan"); setPremiumNav("plan-0"); setWritingTab("plan"); }} className="w-full rounded-xl px-4 py-3 text-left font-inter text-sm text-[#172554] hover:bg-[#EAF7EE]">2. Plan validé</button>
                      <button type="button" onClick={() => { setView("writing"); setWritingTab("writing"); }} className="w-full rounded-xl bg-[#172554] px-4 py-3 text-left font-inter text-sm font-semibold text-white">3. Rédaction</button>
                      {ownerRoute || window.sessionStorage.getItem("trimemo_premium_token") ? (
                        <button type="button" onClick={() => { void exportDocument(); }} className="w-full rounded-xl border border-[#172554]/15 px-4 py-3 text-left font-inter text-sm text-[#172554] hover:bg-[#F7FAF8]">Exporter le document</button>
                      ) : totalDoneWords >= 2500 ? (
                        <button type="button" onClick={() => { void exportDocument(); }} className="w-full rounded-xl bg-[#D4A23A] px-4 py-3 text-left font-inter text-sm font-semibold text-[#172554] hover:bg-[#e0b24f]">Voir l’aperçu</button>
                      ) : (
                        <div className="rounded-xl border border-[#172554]/10 px-4 py-3 font-inter text-xs leading-5 text-[#172554]/60">L’aperçu se débloque à 2 500 mots.</div>
                      )}
                    </nav>
                    <div className="mt-5 rounded-xl bg-[#F7FAF8] p-3">
                      <div className="font-inter text-[11px] text-[#172554]/60">Progression rédactionnelle</div>
                      <div className="mt-1 font-inter text-sm font-semibold">{totalDoneWords.toLocaleString("fr-FR")} mots rédigés</div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E5E7EB]"><div className="h-full rounded-full bg-[#1D78C1]" style={{ width: `${Math.min(100, Math.round(totalDoneWords / 2500 * 100))}%` }} /></div>
                      <div className="mt-1 font-inter text-[10px] text-[#172554]/55">Aperçu indicatif à 2 500 mots cumulés</div>
                    </div>
                  </aside>
                  <div className="min-w-0">
                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                  <div>
                    <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">Rédaction</div>
                    <h1 className="mt-2 font-playfair text-4xl text-[#172554]">{selectedPlan.title}</h1>
                    <p className="mt-2 font-inter text-sm text-[#172554]/60">
                      Le mémoire est rédigé dans l'ordre exact du plan sélectionné.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={loading} onClick={() => { void exportDocument(); }} className="rounded-full bg-[#172554] px-5 py-3 font-inter text-xs font-semibold text-white transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70">
                      {loading ? "Vérification et préparation du document…" : "Exporter le document Word"}
                    </button>
                    {CONTACT_EMAIL && blocks.length > 0 && blocks.every((item) => item.status === "done" && item.content.trim()) && (
                      <button
                        type="button"
                        onClick={() => {
                          const subject = encodeURIComponent(`Demande de révision humaine · ${project.sujet || "Projet Trimémo"}`);
                          const body = encodeURIComponent(`Bonjour,\n\nJe souhaite demander une révision humaine de mon document Trimémo.\n\nSujet : ${project.sujet || "Non précisé"}\n\nMerci.`);
                          window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
                        }}
                        className="rounded-full border border-[#172554]/15 bg-white px-5 py-3 font-inter text-xs font-semibold text-[#172554]"
                      >
                        Demander une révision humaine
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-8 pb-20">
                  {blocks.map((block, index) => {
                    const isLast = index === blocks.length - 1;
                    const isGenerating = block.status === "generating";
                    return (
                      <article
                        key={block.id}
                        id={`writing-block-${block.id}`}
                        className="mx-auto max-w-[900px] overflow-hidden border border-[#D9D9D9] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
                      >
                        <div className="border-b border-[#E5E5E5] px-10 py-6 md:px-16">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">
                              Bloc {index + 1}
                            </div>
                            <button
                              type="button"
                              disabled={isGenerating || (activeBlockId !== null && activeBlockId !== block.id)}
                              onClick={() => {
                                setSelectedWritingBlockId(block.id);
                                void generateBlock(block.id);
                              }}
                              className="rounded-full bg-[#172554] px-5 py-2.5 font-inter text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isGenerating ? "Rédaction en cours…" : block.status === "done" ? "Régénérer ce bloc" : "Rédiger ce bloc"}
                            </button>
                          </div>

                          <h2 className="mt-4 font-playfair text-2xl text-[#172554]">{block.title}</h2>

                          <div className="mt-5 border-l-2 border-[#D4A23A] pl-4">
                            <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777]">
                              Trame du plan sélectionné
                            </div>
                            <div className="mt-2 space-y-1 font-inter text-[11px] leading-5 text-[#555]">
                              {block.structure.map((item, structureIndex) => (
                                <div key={`${block.id}-structure-${structureIndex}`}>{item}</div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="min-h-[720px] px-10 py-14 font-['Times_New_Roman'] text-[15px] leading-[1.85] text-[#111] md:px-[88px]">
                          {block.error && (
                            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 font-inter text-xs leading-5 text-red-700">
                              <strong>Erreur de rédaction :</strong> {block.error}
                            </div>
                          )}

                          {block.content ? (
                            <div>{renderAcademicText(block.content)}</div>
                          ) : (
                            <div className="flex min-h-[420px] items-center justify-center text-center">
                              <div>
                                <div className="font-playfair text-2xl text-[#172554]">{block.title}</div>
                                <div className="mt-3 font-inter text-sm text-[#777]">
                                  Ce bloc attend sa rédaction.
                                </div>
                                <button
                                  type="button"
                                  disabled={isGenerating || activeBlockId !== null}
                                  onClick={() => {
                                    setSelectedWritingBlockId(block.id);
                                    void generateBlock(block.id);
                                  }}
                                  className="mt-5 rounded-full bg-[#1D78C1] px-6 py-3 font-inter text-xs font-semibold text-white disabled:opacity-40"
                                >
                                  {isGenerating ? "Rédaction en cours…" : "Rédiger ce bloc"}
                                </button>
                              </div>
                            </div>
                          )}

                          {block.footnotes.length > 0 && (
                            <div className="mt-12 border-t border-[#222] pt-5 text-[11px] leading-[1.6]">
                              <div className="mb-2 font-bold">Notes</div>
                              <ol className="list-decimal space-y-1 pl-5">
                                {block.footnotes.map((note, noteIndex) => <li key={noteIndex}>{note}</li>)}
                              </ol>
                            </div>
                          )}

                          {block.sources.some((source) => source?.verified === true) && (
                            <div className="mt-10 border-t border-[#DDD] pt-5 font-inter text-[11px] leading-[1.6] text-[#555]">
                              <div className="mb-2 font-semibold uppercase tracking-[0.12em]">Sources utilisées</div>
                              <div className="space-y-1">
                                {block.sources.filter((source) => source?.verified === true).map((source, sourceIndex) => (
                                  <div key={`${block.id}-source-${sourceIndex}`}>
                                    {source.author ? `${source.author}. ` : ""}{source.title}{source.year ? ` (${source.year})` : ""}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {!isLast && (
                          <div className="border-t border-[#E5E5E5] bg-white px-10 py-5 text-center md:px-16">
                            <button
                              type="button"
                              disabled={activeBlockId !== null}
                              onClick={() => {
                                const next = blocks[index + 1];
                                setSelectedWritingBlockId(next.id);
                                document.getElementById(`writing-block-${next.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }}
                              className="rounded-full border border-[#172554]/15 bg-white px-6 py-2.5 font-inter text-xs font-semibold text-[#172554] hover:bg-[#F7FAF8] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Bloc suivant · {index + 2}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
                  </div>
                </div>
              </section>
            )}

            {(view === "premium" || view === "writing") && !premium && loading && (
              <div className="rounded-[24px] bg-white p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /><div className="mt-3 font-inter text-sm text-[#172554]/70">Préparation de votre espace académique…</div></div>
            )}

            {(view === "premium" || view === "writing") && !loading && !premium && (
              <div className="rounded-[24px] border border-red-200 bg-red-50 p-8 text-center"><LockKeyhole className="mx-auto h-6 w-6 text-red-500" /><div className="mt-3 font-inter text-sm text-red-800">Le déblocage premium doit être confirmé par le serveur de paiement.</div></div>
            )}
          </div>
        </div>
        </main>
      )}
      </>)}
    </div>
  );
}
