import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  LockKeyhole,
  Mail,
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
const BLOCK_API = `${API_BASE_URL}/api/generate-block`;
const WORDS_PER_PAGE = 320;
const LOGO_SRC = "/trimemo-logo.webp";
const OWNER_AUTH_API = `${API_BASE_URL}/api/owner-auth`;
const EXPORT_API = `${API_BASE_URL}/api/export`;
// Adresse configurée dans Vercel avec VITE_CONTACT_EMAIL.
const CONTACT_EMAIL = String(import.meta.env.VITE_CONTACT_EMAIL || "redacmemo78@gmail.com").trim();

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
  "3 problématiques + jusqu’à 3 plans générés un par un après paiement",
  "Sources bibliographiques contrôlées (DOI ou URL vérifiée lorsque disponible)",
  "Export Word",
  "Contact pour les demandes de correction",
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
  planPersonnel: string;
  consignes: string;
  niveau: string;
  typeDoc: string;
  pages: number;
  email: string;
  files: FileInput[];
  country?: string;
  pricingQuoteToken?: string;
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
  sources: { title: string; author?: string; year?: string; url?: string; doi?: string; citation?: string }[];
  footnotes: string[];
  structure: string[];
  kind: "introduction" | "chapter" | "conclusion";
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

// Le projet « en attente de paiement » est conservé SANS les fichiers (base64) : ils feraient dépasser le quota du navigateur.
function savePendingPreview(preview: Preview): boolean {
  try {
    window.localStorage.setItem("trimemo_preview_pending", JSON.stringify(preview));
    return true;
  } catch {
    return false;
  }
}

function savePendingProject(project: ProjectData): boolean {
  const metadata = { ...project, files: [] };
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
      return true;
    }
    window.localStorage.setItem("trimemo_pending_files", JSON.stringify({ projectId: project.projectId, files: project.files }));
    return true;
  } catch {
    return false;
  }
}

function loadStoredFiles(projectId: string): FileInput[] {
  try {
    const pending = JSON.parse(window.localStorage.getItem("trimemo_pending_files") || "null");
    return pending?.projectId === projectId && Array.isArray(pending.files) ? pending.files : [];
  } catch {
    return [];
  }
}

// Retrouve le projet au retour de PayPal, même si l'onglet a changé (sessionStorage perdu).
function loadPendingProject(stateKey: string): ProjectData | null {
  try {
    const raw = window.sessionStorage.getItem("trimemo_project") || window.localStorage.getItem("trimemo_project_pending");
    if (!raw) return null;
    const saved: ProjectData = JSON.parse(raw);
    let files: FileInput[] = [];
    try {
      const pending = JSON.parse(window.localStorage.getItem("trimemo_pending_files") || "null");
      if (pending?.projectId === saved.projectId) files = pending.files || [];
    } catch {}
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
  const [view, setView] = useState<"home" | "project" | "estimate" | "preview" | "premium" | "writing">("home");
  const [previewTab, setPreviewTab] = useState<"problematic" | "plan" | "introduction" | "chapter">("problematic");
  const [premiumNav, setPremiumNav] = useState<string>("problematic-0");
  const [premiumSection, setPremiumSection] = useState<"problematic" | "plan" | "writing">("problematic");
  const [selectedWritingBlockId, setSelectedWritingBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<"paypal" | "mobile-money" | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ownerRoute] = useState(() => typeof window !== "undefined" && window.location.pathname === "/owner");
  const stateStorageKey = ownerRoute ? "trimemo_state_v5_owner" : "trimemo_state_v5_public";
  const [ownerSessionValid, setOwnerSessionValid] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [ownerLoginError, setOwnerLoginError] = useState("");
  const [ownerBusy, setOwnerBusy] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [planImprovementComments, setPlanImprovementComments] = useState<Record<string,string>>({});
  const filesHydrated = useRef(false);

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
    } catch {
      window.localStorage.removeItem(stateStorageKey);
    } finally {
      filesHydrated.current = true;
    }
  }, [ownerRoute, stateStorageKey]);

  // Persistance des fichiers joints (clé séparée) une fois la restauration faite.
  useEffect(() => {
    if (!filesHydrated.current) return;
    storeProjectFiles(project);
  }, [project.files, project.projectId]);

  useEffect(() => {
    if (!ownerRoute && !window.localStorage.getItem("trimemo_premium_token")) {
      if (premium || view === "premium" || view === "writing") {
        setPremium(null);
        setSelectedProblematic(null);
        setSelectedPlan(null);
        setBlocks([]);
        setView("preview");
      }
    }
    if (ownerRoute && !ownerSessionValid) return;
    try {
      window.localStorage.setItem(stateStorageKey, JSON.stringify({
        project: { ...project, files: [] },
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
      }));
    } catch {}
  }, [ownerRoute, ownerSessionValid, stateStorageKey, project, formula, preview, estimate, premium, selectedProblematic, selectedPlan, blocks, view, previewTab, premiumNav, premiumSection, selectedWritingBlockId]);

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
    const id = params.get("order_id") || params.get("token") || params.get("transaction_id");
    if (!payment || !id) return;

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
        window.localStorage.setItem("trimemo_premium_token", String(data.premium_token));
        const saved = loadPendingProject(stateStorageKey);
        if (saved) {
          setProject(saved);
          let storedPreview: Preview | null = null;
          try {
            storedPreview = JSON.parse(window.localStorage.getItem("trimemo_preview_pending") || "null");
          } catch {}

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
            setBlocks(nextBlocks);
            setSelectedWritingBlockId(introductionBlock?.id || seededChapter.id);
            setView("writing");
            window.localStorage.removeItem("trimemo_project_pending");
            window.localStorage.removeItem("trimemo_preview_pending");
            pushToast("success", "Paiement confirmé. Le premier chapitre est conservé. La rédaction reprend avec l'introduction complète et les chapitres suivants.");
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
              window.localStorage.removeItem("trimemo_project_pending");
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
              setSelectedProblematic(null);
              setSelectedPlan(null);
              setBlocks([]);
              setView("premium");
              window.localStorage.removeItem("trimemo_project_pending");
              pushToast("success", "Paiement confirmé. Les trois problématiques sont disponibles. Sélectionnez-en une pour générer les plans un par un.");
            }
          }
        }
      } catch (error) {
        pushToast("error", error instanceof Error ? error.message : "Vérification du paiement impossible.");
      } finally {
        setLoading(false);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    })();
  }, []);

  function pushToast(type: Toast["type"], message: string) {
    const id = Date.now();
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
  }

  function goToProject() {
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
    const token = window.localStorage.getItem("trimemo_premium_token");
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
      window.sessionStorage.setItem("trimemo_owner_last_activity", String(Date.now()));
      setOwnerSessionValid(true);
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
    window.sessionStorage.removeItem("trimemo_owner_last_activity");
    setOwnerSessionValid(false);
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
      }, 180000);
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
    if ((action === "new" || action === "alternative") && existingPlans.length >= 3) {
      pushToast("info", "Vous avez atteint les trois plans disponibles. Améliorez ou validez l’un des plans existants.");
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
          project: requestProject,
          problematic,
          count: 1,
          ownerMode,
          planAction: action,
          currentPlan: currentPlan || null,
          improvementComments: comments,
          rejectedPlans,
        }),
      }, 180000);

      const data = await readApiResponse(response);
      const raw = data.plan || data.plans?.[0] || data.data?.plan || data.data?.plans?.[0];
      if (!raw) throw new Error("Le serveur n’a pas retourné de plan académique.");
      const generatedPlan = normalizePlan(raw, action === "improve" ? existingPlans.findIndex((item) => item.id === currentPlan?.id) : existingPlans.length);

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
      setEstimate(data.estimate as ProjectEstimate);
      setProject((current) => ({
        ...current,
        country: String(data.estimate.country || ""),
        pricingQuoteToken: String(data.estimate.pricingQuoteToken),
      }));
      setView("estimate");
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'analyser le projet.";
      setGenerationError(message);
      pushToast("error", message);
    } finally {
      setLoading(false);
    }
  }

  async function generateFreePreview() {
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
        body: JSON.stringify({ project, count: 1, freePreview: true }),
      }, 180000);
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
          wordCount: Math.min(320, countWords(introductionContent)),
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

  async function startPayment(method: "paypal" | "mobile-money") {
    if (!estimate || !project.pricingQuoteToken) {
      pushToast("error", "Relancez l'analyse du projet avant le paiement.");
      setView("project");
      return;
    }
    if (project.formula === "AUTRE") {
      pushToast("info", "La formule « Autre besoin » nécessite un devis personnalisé. Contactez-nous pour cette demande.");
      return;
    }
    setPaymentLoading(method);
    try {
      if (!savePendingProject(project) && project.files.length) {
        pushToast("info", "Espace de stockage du navigateur insuffisant : vos documents joints devront peut-être être rattachés à nouveau après le paiement.");
      }
      const response = await fetch(`${API_URL}?action=${method === "paypal" ? "create-paypal-order" : "create-mobile-money"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      });
      const data = await readApiResponse(response);
      if (!data.url) throw new Error("Aucune URL de paiement n’a été retournée.");
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

    const introductionWords = Math.min(1500, Math.max(100, Math.round(Number(plan.introductionGeneral.wordCount || 900))));
    const introductionBlock: Block = {
      id: `${plan.id}-introduction-generale`,
      title: plan.introductionGeneral.title || "Introduction générale",
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
    const chapterBlocks = plan.parts.flatMap((part) =>
      part.chapters.flatMap((chapter) => {
        /*
         * L'unité minimale de regroupement est la SECTION.
         * Une section et toutes ses sous-sections/titres internes restent ensemble.
         * Le seuil de 900 mots est une cible, jamais une contrainte.
         */
        const sectionUnits = chapter.sections.map((section) => ({
          id: section.id,
          title: section.title,
          structure: [
            partLabel(part),
            chapterLabel(chapter),
            sectionLabel(chapter, section),
            ...section.subsections.flatMap((subsection) => [
              subsectionLabel(chapter, section, subsection),
              ...subsection.internalTitles.map((internal) =>
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
            structure: [partLabel(part), chapterLabel(chapter)],
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
          const structure = group.flatMap((unit) => unit.structure);
          const title = group.length === 1
            ? group[0].title
            : group.map((unit) => unit.title).join(" + ");

          return {
            id: `${chapter.id}-bloc-${groupIndex + 1}`,
            title,
            expectedWords: Math.max(100, groupWords || 900),
            content: "",
            wordCount: 0,
            status: "pending" as const,
            sources: [],
            footnotes: [],
            structure,
            kind: "chapter" as const,
          };
        });
      }),
    );

    const conclusionBlock: Block = {
      id: `${plan.id}-conclusion-generale`,
      title: plan.conclusionGeneral.title || "Conclusion générale",
      expectedWords: Math.min(1500, Math.max(300, Math.round(Number(plan.conclusionGeneral.wordCount || 600)))),
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
    setSelectedProblematic(problematic);
    setSelectedPlan(plan);
    prepareBlocks(plan);
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
      const preceding = blocks
        .filter((item) => item.status === "done")
        .slice(-3)
        .map((item) => ({ title: item.title, content: item.content, sources: item.sources || [] }));

      const payload = {
        project,
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

  async function exportDocument() {
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
        .flatMap((block) => block.sources || [])
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
      const papers = doneBlocks.flatMap((block) => block.sources || []);
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
          project,
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
      URL.revokeObjectURL(url);
      const missingLinks = Number(response.headers.get("X-Trimemo-Bibliography-Missing-Links") || 0);
      if (missingLinks > 0) {
        pushToast("info", `${missingLinks} référence(s) n’ont ni DOI ni lien : vérifiez-les manuellement avant de remettre le document.`);
      } else {
        pushToast("success", "Document Word académique généré avec bibliographie et mise en forme.");
      }
      try { window.localStorage.removeItem("trimemo_project_pending"); } catch {}
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
            {view === "estimate" && estimate && (
              <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <article className="rounded-[24px] border border-[#172554]/10 bg-white p-7 lg:p-9">
                  <div className="font-inter text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">Analyse du projet</div>
                  <h3 className="mt-3 font-playfair text-3xl text-[#172554]">Estimation du coût</h3>
                  <p className="mt-4 font-inter text-sm leading-[1.8] text-[#172554]/75">Trimémo a analysé le sujet, le niveau, les consignes et les documents fournis. Le montant est provisoire et inclut les générations prévues pour le projet, y compris les problématiques, le plan, l'introduction et le premier chapitre consultables avant paiement.</p>
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
                  <div className="mt-2 font-playfair text-4xl">{estimate.formattedAmount} {estimate.currency === "XOF" ? "FCFA" : estimate.currency === "EUR" ? "€" : "$"}</div>
                  <div className="mt-3 font-inter text-xs leading-[1.7] text-white/65">Tarif de base {estimate.baseRate} {estimate.currency === "XOF" ? "FCFA" : estimate.currency === "EUR" ? "€" : "$"} par page × coefficient de niveau {estimate.levelCoefficient} × coefficient de complexité {estimate.complexityCoefficient}.</div>
                  {estimate.currency === "XOF" && <div className="mt-3 rounded-xl bg-white/10 p-3 font-inter text-xs leading-[1.6] text-white/80">Si vous payez par PayPal, le montant sera converti en euros selon la parité fixe FCFA/euro : environ {estimate.checkoutAmount} €.</div>}
                  <div className="mt-5 rounded-xl border border-white/15 p-3 font-inter text-xs leading-[1.7] text-white/75">L'estimation comprend le projet complet. Le travail présenté avant paiement est déjà comptabilisé et ne sera pas facturé une seconde fois.</div>
                  <button onClick={() => void generateFreePreview()} disabled={loading} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#D4A23A] font-inter text-sm font-semibold text-[#172554] disabled:opacity-50">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Continuer la rédaction
                  </button>
                  <button onClick={() => { setEstimate(null); setView("project"); }} className="mt-3 w-full rounded-full border border-white/20 px-4 py-3 font-inter text-xs font-semibold text-white">Modifier les informations</button>
                </aside>
              </section>
            )}


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

          
          
          {view === "premium" && premium && (
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
                            pushToast("success", "Plan retenu. La rédaction peut maintenant commencer.");
                          }} className="rounded-full bg-[#172554] px-5 py-3 font-inter text-xs font-semibold text-white disabled:opacity-50">Valider ce plan</button>
                        </div>
                        {selectedPlan?.id === plan.id && <div className="font-inter text-xs font-semibold text-[#2F6B45]">Plan retenu</div>}
                        <div className="font-inter text-[11px] text-[#172554]/55">{premium.plans.length}/3 plan(s) généré(s)</div>
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
                    <button type="button" onClick={exportDocument} className="rounded-full bg-[#172554] px-5 py-3 font-inter text-xs font-semibold text-white">
                      Exporter le document Word
                    </button>
                    {blocks.length > 0 && blocks.every((item) => item.status === "done" && item.content.trim()) && (
                      <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Demande de révision humaine - " + (project.sujet || "Document Trimémo"))}`} className="rounded-full border border-[#172554]/15 bg-white px-5 py-3 font-inter text-xs font-semibold text-[#172554]">
                        Demander une révision humaine
                      </a>
                    )}
                  </div>
                  {blocks.length > 0 && blocks.every((item) => item.status === "done" && item.content.trim()) && (
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
                            <div className="whitespace-pre-wrap">{block.content}</div>
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

                          {block.sources.length > 0 && (
                            <div className="mt-10 border-t border-[#DDD] pt-5 font-inter text-[11px] leading-[1.6] text-[#555]">
                              <div className="mb-2 font-semibold uppercase tracking-[0.12em]">Sources utilisées</div>
                              <div className="space-y-1">
                                {block.sources.map((source, sourceIndex) => (
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

      <header className="sticky top-0 z-50 border-b border-white/15 bg-[#172554] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 lg:px-8">
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
              onClick={goToProject}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#D4A23A] px-5 font-inter text-[13px] font-medium"
            >
              Commencer <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="sticky top-[72px] z-40 border-b border-white/15 bg-[#172554] px-6 py-4 shadow-sm md:hidden">
          <div className="flex flex-col gap-1 font-inter text-sm text-white">
            <button onClick={() => navigateToSection("fonctionnement")} className="rounded-xl px-4 py-3 text-left hover:bg-white/10">Fonctionnement</button>
            <button onClick={() => navigateToSection("formules")} className="rounded-xl px-4 py-3 text-left hover:bg-white/10">Formules</button>
            <button onClick={() => { setMobileMenuOpen(false); setView("project"); }} className="rounded-xl px-4 py-3 text-left hover:bg-white/10">Mon projet</button>
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
                  ["03", "Aperçu avant paiement", "Une problématique, un plan, un extrait de l’introduction et le premier chapitre pour évaluer la qualité."],
                  ["04", "Accès complet", "Après paiement : trois problématiques, des plans générés un par un puis la rédaction séquentielle par blocs de longueur variable."],
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
                  Forfaits actuels
                </h2>
                <p className="mt-3 max-w-[760px] font-inter text-sm leading-[1.7] text-[#172554]/70">
                  Des forfaits adaptés aux travaux de Licence, de Master et de Doctorat,
                  avec paiement en euros ou en francs CFA.
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

      {view !== "home" && (
        <main className={`min-h-[calc(100vh-72px)] bg-[#EAF7EE] px-6 py-8 lg:px-8 lg:py-10 ${view === "writing" ? "h-[calc(100vh-72px)] overflow-y-auto overscroll-contain" : ""}`}>
          <div className="mx-auto max-w-[1220px]">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                {view !== "home" && (
                  <button
                    onClick={() => setView("home")}
                    className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#172554]/10 bg-white"
                    aria-label="Retour à l'accueil"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </button>
                )}
                <div>
                <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#D4A23A]">Projet académique</div>
                <h2 className="mt-2 font-playfair text-3xl">{view === "project" ? "Définissez votre demande" : view === "estimate" ? "Analyse du projet · Estimation du coût" : view === "preview" ? "Votre aperçu avant paiement" : view === "premium" ? "Vos options premium" : "Rédaction complète"}</h2>
              </div>
              <div className="font-inter text-xs text-[#172554]/75">1 page = {WORDS_PER_PAGE} mots</div>
            </div>

            {generationError && view === "project" && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-inter text-sm leading-6 text-red-700">
                <strong>Erreur de génération :</strong> {generationError}
              </div>
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
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">E-mail *</label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-[#172554]/30" />
                        <input type="email" value={project.email} onChange={(e) => setProject({ ...project, email: e.target.value })} className="h-11 w-full rounded-[12px] border border-[#172554]/10 pl-10 pr-4 font-inter text-sm" placeholder="vous@exemple.com" />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => void analyzeProject()} disabled={loading} className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1D78C1] font-inter text-sm font-medium text-white disabled:opacity-50">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[#D4A23A]" />}
                    Analyser le projet et estimer le coût
                  </button>
                </aside>
              </div>
            )}

            {view === "preview" && preview && (
              <div className="grid gap-6 lg:grid-cols-[245px_minmax(0,1fr)]">
                <aside className="h-fit rounded-[24px] border border-[#172554]/10 bg-white p-4 lg:sticky lg:top-[96px]">
                  <div className="px-3 pb-3 font-inter text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">
                    Navigation de l’aperçu
                  </div>
                  <div className="space-y-2">
                    <button onClick={() => setPreviewTab("problematic")} className={`w-full rounded-[14px] px-4 py-4 text-left font-inter text-sm font-semibold transition ${previewTab === "problematic" ? "bg-[#172554] text-white" : "bg-[#EAF7EE] text-[#172554] hover:bg-[#DDEFE3]"}`}>Problématique</button>
                    <button onClick={() => setPreviewTab("plan")} className={`w-full rounded-[14px] px-4 py-4 text-left font-inter text-sm font-semibold transition ${previewTab === "plan" ? "bg-[#172554] text-white" : "bg-[#EAF7EE] text-[#172554] hover:bg-[#DDEFE3]"}`}>Plan</button>
                    <button onClick={() => setPreviewTab("introduction")} className={`w-full rounded-[14px] px-4 py-4 text-left font-inter text-sm font-semibold transition ${previewTab === "introduction" ? "bg-[#172554] text-white" : "bg-[#EAF7EE] text-[#172554] hover:bg-[#DDEFE3]"}`}>Introduction</button>
                    <button onClick={() => setPreviewTab("chapter")} className={`w-full rounded-[14px] px-4 py-4 text-left font-inter text-sm font-semibold transition ${previewTab === "chapter" ? "bg-[#172554] text-white" : "bg-[#EAF7EE] text-[#172554] hover:bg-[#DDEFE3]"}`}>Chapitre 1</button>
                  </div>
                  <div className="mt-5 rounded-[14px] bg-[#FFF8E7] p-4 font-inter text-xs leading-[1.6] text-[#6B4B08]">Sélectionnez une rubrique pour consulter son contenu.</div>
                </aside>
                <section className="min-w-0 rounded-[24px] border border-[#172554]/10 bg-white p-6 sm:p-8 lg:p-10">
                  {previewTab === "problematic" && (
                    <div>
                      <div className="flex items-center justify-between gap-4"><div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#D4A23A]">Problématique proposée avant paiement</div><Search className="h-5 w-5 text-[#172554]/45" /></div>
                      <h3 className="mt-5 font-playfair text-2xl leading-tight text-[#172554] sm:text-3xl">{preview.problematic.title}</h3>
                      <p className="mt-6 font-inter text-base leading-[1.9] text-[#172554]/80">{preview.problematic.question || "La problématique n’a pas été retournée par le service."}</p>
                      {preview.problematic.angle && <p className="mt-6 font-inter text-sm leading-[1.8] text-[#172554]/80"><strong>Angle :</strong> {preview.problematic.angle}</p>}
                      {preview.problematic.rationale && <div className="mt-6 rounded-[16px] bg-[#EAF7EE] p-5 font-inter text-sm leading-[1.8] text-[#172554]/80">{preview.problematic.rationale}</div>}
                    </div>
                  )}
                  {previewTab === "plan" && (
                    <div>
                      <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#D4A23A]">Plan proposé avant paiement</div>
                      <h3 className="mt-5 font-playfair text-2xl leading-tight text-[#172554] sm:text-3xl">{preview.plan.title}</h3>
                      <div className="mt-7 font-inter text-[#172554]">
                        <div className="border-b border-[#172554]/10 pb-4 text-base font-semibold">Introduction générale <span className="text-xs font-normal text-[#172554]/60">≈ {Number(preview.plan.introductionGeneral?.wordCount || Math.round(project.pages * WORDS_PER_PAGE * 0.1)).toLocaleString("fr-FR")} mots (10 % du volume)</span></div>
                        <div className="mt-5 space-y-5">
                          {preview.plan.parts.map((part) => <div key={part.id}>
                            <div className="text-base font-bold uppercase">PARTIE {part.number}. {part.title}</div>
                            <div className="mt-3 space-y-3 pl-4">
                              {part.chapters.map((chapter) => <div key={chapter.id}>
                                <div className="text-sm font-bold">Chapitre {chapter.number}. {chapter.title}</div>
                                <div className="mt-2 space-y-1 pl-5">
                                  {chapter.sections.map((section) => <div key={section.id}>
                                    <div className="text-sm font-semibold">Section {chapter.number}.{section.number}. {section.title}</div>
                                    <div className="mt-1 space-y-1 pl-5">
                                      {section.subsections.map((subsection) => <div key={subsection.id} className="text-xs">§ {chapter.number}.{section.number}.{subsection.number} {subsection.title}</div>)}
                                    </div>
                                  </div>)}
                                </div>
                              </div>)}
                            </div>
                          </div>)}
                        </div>
                        <div className="mt-6 border-t border-[#172554]/10 pt-4 text-base font-semibold">Conclusion générale</div>
                        <div className="mt-4 rounded-xl bg-[#FFF8E7] p-3 text-xs leading-[1.7] text-[#6B4B08]">Le plan présente la structure du mémoire. L’onglet Introduction montre un extrait ; le chapitre 1 permet d’évaluer la qualité de rédaction avant paiement.</div>
                      </div>
                    </div>
                  )}
                  {previewTab === "chapter" && (
                    <div>
                      <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#D4A23A]">Premier chapitre · aperçu de validation</div>
                      <h3 className="mt-5 font-playfair text-2xl leading-tight text-[#172554] sm:text-3xl">{preview.chapterOne.title}</h3>
                      <div className="mt-3 font-inter text-xs text-[#172554]/55">{preview.chapterOne.partTitle ? "PARTIE I · " + preview.chapterOne.partTitle + " · " : ""}{preview.chapterOne.wordCount.toLocaleString("fr-FR")} mots environ</div>
                      <div className="mt-6 whitespace-pre-wrap font-inter text-base leading-[1.95] text-[#172554]/80">{preview.chapterOne.content}</div>
                    </div>
                  )}
                  {previewTab === "introduction" && (
                    <div>
                      <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#D4A23A]">Extrait de l’introduction générale · 320 mots</div>
                      <h3 className="mt-5 font-playfair text-2xl leading-tight text-[#172554] sm:text-3xl">{preview.introduction.title}</h3>
                      <p className="mt-6 whitespace-pre-wrap font-inter text-base leading-[1.95] text-[#172554]/80">{preview.introduction.content}</p>
                      <div className="mt-6 rounded-[14px] bg-[#FFF8E7] p-4 font-inter text-sm leading-[1.7] text-[#6B4B08]"><strong>Extrait de validation :</strong> 320 mots de l’introduction générale. Le volume complet est produit dans la suite du projet.</div>
                    </div>
                  )}
                </section>
              </div>
            )}

            {view === "preview" && preview && (
              <section className="mt-8 rounded-[24px] border border-[#172554]/5 bg-[#172554] p-7 text-white lg:p-9">
                <div className="grid gap-8 lg:grid-cols-[1fr_390px] lg:items-center">
                  <div>
                    <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#D4A23A]">Débloquer la suite</div>
                    <h3 className="mt-3 font-playfair text-3xl">Validez la qualité avant de poursuivre</h3>
                    <p className="mt-3 max-w-[720px] font-inter text-sm leading-[1.7] text-white/65">Le montant estimé couvre le projet selon le type de document, le niveau, la complexité détectée et le volume demandé. Les problématiques, le plan, l’extrait d’introduction et le premier chapitre présentés ici sont déjà comptabilisés.</p>
                  </div>
                  <div className="grid gap-3">
                    {estimate && <div className="rounded-2xl bg-white/10 p-4 text-center"><div className="font-inter text-xs text-white/65">Montant estimé du projet</div><div className="mt-1 font-playfair text-2xl">{estimate.formattedAmount} {estimate.currency === "XOF" ? "FCFA" : estimate.currency === "EUR" ? "€" : "$"}</div><div className="mt-1 font-inter text-[11px] text-white/60">Le paiement autorise la poursuite de la rédaction. Aucun travail déjà comptabilisé ne sera facturé deux fois.</div></div>}
                    {String(import.meta.env.VITE_PAYPAL_ENABLED || "").toLowerCase() === "true" ? (
                      <button onClick={() => void startPayment("paypal")} disabled={paymentLoading !== null} className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#D4A23A] font-inter text-sm font-semibold text-[#172554] disabled:opacity-60">
                        {paymentLoading === "paypal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
                        Payer avec PayPal
                      </button>
                    ) : (
                      <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-center font-inter text-xs leading-[1.7] text-white/70">
                        Le paiement en ligne sera activé après la configuration sécurisée du compte marchand.
                      </div>
                    )}
                    {String(import.meta.env.VITE_MOBILE_MONEY_ENABLED || "").toLowerCase() === "true" ? (
                      <button onClick={() => void startPayment("mobile-money")} disabled={paymentLoading !== null} className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 font-inter text-sm font-semibold text-white disabled:opacity-60">
                        {paymentLoading === "mobile-money" ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
                        Payer par Mobile Money
                      </button>
                    ) : (
                      <div className="rounded-full border border-white/15 bg-white/5 px-4 py-3 text-center font-inter text-xs text-white/60">
                        Mobile Money : prestataire à connecter
                      </div>
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
                              pushToast("success", "Plan retenu. La rédaction peut maintenant commencer.");
                            }} className="rounded-full bg-[#172554] px-5 py-3 font-inter text-xs font-semibold text-white disabled:opacity-50">Valider ce plan</button>
                          </div>
                          {selectedPlan?.id === plan.id && <div className="font-inter text-xs font-semibold text-[#2F6B45]">Plan retenu</div>}
                          <div className="font-inter text-[11px] text-[#172554]/55">{premium.plans.length}/3 plan(s) généré(s)</div>
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
          {view === "writing" && selectedPlan && selectedProblematic && (
              <section className="min-h-full">
                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                  <div>
                    <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">Rédaction</div>
                    <h1 className="mt-2 font-playfair text-4xl text-[#172554]">{selectedPlan.title}</h1>
                    <p className="mt-2 font-inter text-sm text-[#172554]/60">
                      Le mémoire est rédigé dans l'ordre exact du plan sélectionné.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={exportDocument} className="rounded-full bg-[#172554] px-5 py-3 font-inter text-xs font-semibold text-white">
                      Exporter le document Word
                    </button>
                    {blocks.length > 0 && blocks.every((item) => item.status === "done" && item.content.trim()) && (
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
                            <div className="whitespace-pre-wrap">{block.content}</div>
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

                          {block.sources.length > 0 && (
                            <div className="mt-10 border-t border-[#DDD] pt-5 font-inter text-[11px] leading-[1.6] text-[#555]">
                              <div className="mb-2 font-semibold uppercase tracking-[0.12em]">Sources utilisées</div>
                              <div className="space-y-1">
                                {block.sources.map((source, sourceIndex) => (
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
    </div>
  );
}
