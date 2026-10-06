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

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "https://trimemo-api.vercel.app").replace(/\/$/, "");
const API_URL = `${API_BASE_URL}/api/academic`;
const PROBLEMATICS_API = `${API_BASE_URL}/api/generate-problematics`;
const PLANS_API = `${API_BASE_URL}/api/generate-plans`;
const FREE_PREVIEW_API = `${API_BASE_URL}/api/generate-free-preview`;
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

const pricing = {
  individual: [
    { id: "LICENCE", title: "Mémoire Licence", pages: "10 à 45 pages", eur: "27 €", fcfa: "18 000 FCFA", badge: "Licence 3", details: "Génération complète du document académique." },
    { id: "MASTER", title: "Mémoire Master", pages: "10 à 80 pages", eur: "38 €", fcfa: "25 000 FCFA", badge: "Le plus choisi", details: "Génération complète du document académique." },
    { id: "DOCTORAT", title: "Thèse", pages: "10 à 100 pages", eur: "76 €", fcfa: "50 000 FCFA", badge: "Doctorat", details: "Génération complète du document académique." },
  ],
};

const pricingInclusions = [
  "3 problématiques + 3 plans après paiement",
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
  contexte: string;
  problematiquePersonnelle: string;
  planPersonnel: string;
  consignes: string;
  niveau: string;
  typeDoc: string;
  pages: number;
  email: string;
  files: FileInput[];
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

function maxPagesForFormula(formula: FormulaId) {
  if (formula === "LICENCE") return 45;
  if (formula === "DOCTORAT") return 100;
  if (formula === "MASTER") return 80;
  return 80;
}

// Le projet « en attente de paiement » est conservé SANS les fichiers (base64) : ils feraient dépasser le quota du navigateur.
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
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;

  const patterns: Record<string, RegExp> = {
    part: /^part(?:ie)?\s+(?:[IVXLCDM]+|\d+)\s*[.\-–—:]?\s*/i,
    chapter: /^chap(?:itre|ter)?\s+\d+(?:\.\d+)?\s*[.\-–—:]?\s*/i,
    section: /^section\s+\d+(?:\.\d+)?\s*[.\-–—:]?\s*/i,
    subsection: /^sous[- ]section\s+\d+(?:\.\d+)*\s*[.\-–—:]?\s*/i,
  };

  return raw.replace(patterns[kind], "").trim() || fallback;
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
          description: "",
          subsections: rawSubsections.map((item: any, subsectionIndex: number) => ({
            id: String(item?.id || `subsection-${partNumber}-${chapterNumber}-${sectionNumber}-${subsectionIndex + 1}`),
            number: subsectionIndex + 1,
            title: normalizeStructuralTitle(typeof item === "string" ? item : item?.title || item?.titre, "subsection", `Sous-section ${subsectionIndex + 1}`),
            description: "",
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
        description: "",
        wordCount: Number(chapter?.wordCount || 0),
        sections
      };
    });

    return {
      id: String(part?.id || `part-${partNumber}`),
      number: partNumber,
      title: normalizeStructuralTitle(part?.title || part?.titre, "part", `Partie ${partNumber}`),
      description: "",
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
    description: "",
    approach: "",
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
    contexte: "",
    problematiquePersonnelle: "",
    planPersonnel: "",
    consignes: "",
    niveau: "",
    typeDoc: "Mémoire",
    pages: 30,
    email: "",
    files: [],
  });
  const [preview, setPreview] = useState<Preview | null>(null);
  const [premium, setPremium] = useState<PremiumOptions | null>(null);
  const [selectedProblematic, setSelectedProblematic] = useState<Problematic | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [view, setView] = useState<"home" | "project" | "preview" | "premium" | "writing">("home");
  const [previewTab, setPreviewTab] = useState<"problematic" | "plan" | "introduction">("problematic");
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
  }, [ownerRoute, ownerSessionValid, stateStorageKey, project, formula, preview, premium, selectedProblematic, selectedPlan, blocks, view, previewTab, premiumNav, premiumSection, selectedWritingBlockId]);

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
            pushToast("success", "Paiement confirmé. Les trois problématiques sont disponibles. Sélectionnez-en une pour générer les trois plans.");
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
    if (!formula) {
      document.getElementById("formules")?.scrollIntoView({ behavior: "smooth" });
      pushToast("info", "Choisissez d’abord la formule correspondant à votre niveau ou à votre besoin.");
      return;
    }
    setProject((current) => ({ ...current, formula, pages: Math.min(current.pages || 30, maxPagesForFormula(formula)) }));
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
      if (!allowed.includes(file.type) && !/\.(pdf|docx|txt|md)$/i.test(file.name)) {
        pushToast("error", `${file.name} n’est pas un format accepté.`);
        continue;
      }
      const alreadyUsed = [...project.files, ...files].reduce((sum, item) => sum + dataUrlBytes(item.content), 0);
      if (alreadyUsed + file.size > MAX_TOTAL_FILES_BYTES) {
        pushToast("error", `${file.name} dépasse la limite de 3 Mo pour l’ensemble des documents joints. Joignez un extrait (pages utiles) ou un fichier plus léger.`);
        continue;
      }
      try {
        const category: FileCategory = /(methodolog|méthodolog|guide|consigne|instruction|norme|jury)/i.test(file.name) ? "methodology" : "reference";
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
        throw new Error("La génération a dépassé le délai prévu. Vérifiez le déploiement de l’API et réessayez.");
      }
      throw error;
    } finally {
      window.clearTimeout(timer);
    }
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
      const detail = data?.details ? " — " + String(data.details) : "";
      throw new Error((data?.error || data?.message || `Erreur serveur HTTP ${response.status}.`) + detail);
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
      pages: project.pages || 30,
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
      const response = await fetch(PROBLEMATICS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify({ project: ownerProject, count: 3, ownerMode: true }),
      });
      const data = await readApiResponse(response);
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

  async function generatePlansForProblematic(problematic: Problematic, ownerMode = false, projectOverride?: ProjectData) {
    if (ownerMode && !ownerSessionValid) {
      pushToast("error", "Connectez-vous à l’espace administrateur.");
      return;
    }
    if (!premium && !ownerMode) {
      pushToast("error", "Le projet premium n’est pas encore disponible.");
      return;
    }

    const baseProject = projectOverride || project;
    const requestProject: ProjectData = {
      ...baseProject,
      email: baseProject.email || (ownerMode ? "owner@trimemo.local" : baseProject.email),
    };

    setSelectedProblematic(problematic);
    setGenerationError("");
    setLoading(true);

    try {
      const response = await fetchWithTimeout(
        PLANS_API,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(ownerMode ? ownerAuthHeaders() : premiumAuthHeaders()),
          },
          body: JSON.stringify({
            project: requestProject,
            problematic,
            count: 3,
            ownerMode,
          }),
        },
        180000,
      );

      const data = await readApiResponse(response);
      const rawList = data.plans || data.data?.plans || data.data || [];

      if (!Array.isArray(rawList) || rawList.length < 3) {
        throw new Error("Le serveur n’a pas retourné les trois plans académiques attendus.");
      }

      const generatedPlans = rawList
        .slice(0, 3)
        .map((item: any, index: number) => normalizePlan(item, index));

      // Si le client a fourni son plan, le serveur le reprend fidèlement dans le plan n°1.
      const plans = generatedPlans;

      setPremium((current) =>
        current
          ? { ...current, problematics: current.problematics, plans }
          : { problematics: [problematic], plans },
      );
      setPremiumNav("plan-0");
      setPremiumSection("plan");
      setSelectedPlan(null);
      setBlocks([]);

      pushToast(
        "success",
        "Les trois plans ont été construits à partir du sujet, de la problématique, des consignes et des documents fournis.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de générer les plans.";
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

  async function generateFreePreview() {
    if (!project.sujet.trim()) {
      pushToast("error", "Le sujet est obligatoire.");
      return;
    }
    // Le sujet est la seule donnée obligatoire pour l’aperçu gratuit.
    // Le niveau, la discipline, les consignes, le contexte et l’e-mail sont facultatifs.
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
        throw new Error("La problématique gratuite n’a pas été retournée par le serveur.");
      }
      if (!planRaw?.parts?.length) {
        throw new Error("Le plan gratuit n’a pas été retourné par le serveur.");
      }
      if (!introductionRaw?.content) {
        throw new Error("L’aperçu de l’introduction n’a pas été retourné par le serveur.");
      }

      const problematic = normalizeProblematic(problematicRaw, 0);
      const plan = normalizePlan(planRaw, 0);
      const introductionContent = String(introductionRaw.content).trim();

      setPreview({
        problematic,
        plan,
        introduction: {
          title: introductionRaw.title || "Introduction générale",
          content: introductionContent,
          wordCount: Math.min(320, countWords(introductionContent)),
          incomplete: true,
        },
      });
      savePendingProject(project);
      setPreviewTab("problematic");
      setView("preview");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de générer l’aperçu gratuit.";
      setGenerationError(message);
      pushToast("error", message);
    } finally {
      setLoading(false);
    }
  }

  async function startPayment(method: "paypal" | "mobile-money") {
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
    const subsectionLabel = (chapter: PlanChapter, section: PlanSection, subsection: PlanSubsection) => `Sous-section ${chapter.number}.${section.number}.${subsection.number} : ${subsection.title}`;
    const internalLabel = (chapter: PlanChapter, section: PlanSection, subsection: PlanSubsection, internal: PlanInternalTitle) => `Titre interne ${chapter.number}.${section.number}.${subsection.number}.${internal.number} : ${internal.title}`;

    const distributeVariableWords = (totalWords: number, count: number, seed: number) => {
      const total = Math.max(count * 300, Math.round(Number(totalWords) || count * 300));
      if (count <= 1) return [Math.min(1500, total)];

      const patterns = [
        [0.82, 1.16, 0.94, 1.08, 1.02, 0.88],
        [1.12, 0.86, 1.06, 0.96, 1.14, 0.90],
        [0.92, 1.10, 0.84, 1.18, 0.98, 1.06],
        [1.04, 0.90, 1.14, 0.88, 1.08, 0.96],
      ];
      const pattern = patterns[seed % patterns.length];
      const average = total / count;
      const raw = Array.from({ length: count }, (_, index) =>
        Math.max(300, Math.round(average * pattern[(index + seed) % pattern.length]))
      );
      const rawSum = raw.reduce((sum, value) => sum + value, 0);
      const scaled = raw.map((value) => Math.max(300, Math.min(1500, Math.round(value * total / rawSum))));
      return scaled;
    };

    const introductionWords = Math.min(1500, Math.max(300, Math.round(Number(plan.introductionGeneral.wordCount || 900))));
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

    const chapterBlocks = plan.parts.flatMap((part, partIndex) =>
      part.chapters.flatMap((chapter, chapterIndex) => {
        const units = chapter.sections.flatMap((section) =>
          section.subsections.length
            ? section.subsections.flatMap((subsection) =>
                subsection.internalTitles.length
                  ? subsection.internalTitles.map((internal) => ({
                      id: internal.id,
                      title: internal.title,
                      structure: [
                        partLabel(part),
                        chapterLabel(chapter),
                        sectionLabel(chapter, section),
                        subsectionLabel(chapter, section, subsection),
                        internalLabel(chapter, section, subsection, internal),
                      ],
                    }))
                  : [{
                      id: subsection.id,
                      title: subsection.title,
                      structure: [
                        partLabel(part),
                        chapterLabel(chapter),
                        sectionLabel(chapter, section),
                        subsectionLabel(chapter, section, subsection),
                      ],
                    }]
              )
            : [{
                id: section.id,
                title: section.title,
                structure: [
                  partLabel(part),
                  chapterLabel(chapter),
                  sectionLabel(chapter, section),
                ],
              }]
        );

        const targets = distributeVariableWords(
          Number(chapter.wordCount || 0),
          Math.max(1, units.length),
          partIndex + chapterIndex + 2,
        );

        return units.map((unit, unitIndex) => ({
          id: `${chapter.id}-${unit.id}`,
          title: unit.title,
          expectedWords: targets[unitIndex] || 300,
          content: "",
          wordCount: 0,
          status: "pending" as const,
          sources: [],
          footnotes: [],
          structure: unit.structure,
          kind: "chapter" as const,
        }));
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

    setBlocks([introductionBlock, ...chapterBlocks, conclusionBlock]);
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
                    <label className="font-inter text-xs font-semibold text-[#172554]/75">
                      Niveau
                    </label>
                    <input
                      value={project.niveau}
                      onChange={(event) =>
                        setProject((current) => ({
                          ...current,
                          niveau: event.target.value,
                        }))
                      }
                      placeholder="Ex. Master 2"
                      className="mt-2 h-11 w-full rounded-xl border border-[#172554]/10 px-4 font-inter text-sm"
                    />
                  </div>

                  <div>
                    <label className="font-inter text-xs font-semibold text-[#172554]/75">
                      Type de document
                    </label>
                    <input
                      value={project.typeDoc}
                      onChange={(event) =>
                        setProject((current) => ({
                          ...current,
                          typeDoc: event.target.value,
                        }))
                      }
                      placeholder="Mémoire, thèse, rapport..."
                      className="mt-2 h-11 w-full rounded-xl border border-[#172554]/10 px-4 font-inter text-sm"
                    />
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
                      accept=".pdf,.docx,.txt,.md"
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
                        onClick={() => void generatePlansForProblematic(item, true)}
                        className="mt-7 rounded-full bg-[#1D78C1] px-6 py-3 font-inter text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading && selectedProblematic?.id === item.id ? "Génération des 3 plans..." : "Générer les 3 plans"}
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
                      <button
                        type="button"
                        onClick={() => {
                          const problematic = selectedProblematic || premium.problematics[0];
                          if (!problematic) return;
                          setSelectedProblematic(problematic);
                          selectPremiumPlan(problematic, plan);
                        }}
                        className="mt-8 rounded-full bg-[#172554] px-6 py-3 font-inter text-xs font-semibold text-white"
                      >
                        Choisir ce plan et passer à la rédaction
                      </button>
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
              <div className="mt-7 font-inter text-xs text-[#172554]/75">1 page = {WORDS_PER_PAGE} mots · Aperçu gratuit · Paiement avant génération complète</div>
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
                  ["03", "Aperçu gratuit", "Une problématique, un plan et une introduction incomplète de 320 mots."],
                  ["04", "Accès complet", "Après paiement : trois problématiques, trois plans puis la rédaction séquentielle par blocs de longueur variable."],
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
                  <button
                    key={item.id}
                    onClick={() => {
                      setFormula(item.id as FormulaId);
                      setProject((current) => ({
                        ...current,
                        formula: item.id as FormulaId,
                      }));
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

                    <div className="mt-5 font-inter text-xs font-semibold">
                      Sélectionner cette formule →
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-10 rounded-[22px] border border-[#172554]/10 bg-white p-6">
                <div className="font-playfair text-xl">
                  Inclus dans tous les forfaits
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
                <h2 className="mt-2 font-playfair text-3xl">{view === "project" ? "Définissez votre demande" : view === "preview" ? "Votre aperçu gratuit" : view === "premium" ? "Vos options premium" : "Rédaction complète"}</h2>
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
                          <input type="file" multiple accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown" onChange={(e) => void handleFiles(e.target.files)} className="hidden" />
                        </label>
                      </div>
                      <div className="mt-3 rounded-[16px] border border-dashed border-[#172554]/15 bg-[#FFFFFF] p-5">
                        <div className="font-inter text-xs text-[#172554]/70">PDF, DOCX, TXT ou Markdown. Les documents transmis sont envoyés au moteur OpenAI avec votre demande.</div>
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
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">Niveau</label>
                      <input value={project.niveau} onChange={(e) => setProject({ ...project, niveau: e.target.value })} className="mt-2 h-11 w-full rounded-[12px] border border-[#172554]/10 px-4 font-inter text-sm" placeholder="Ex. Master 2" />
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">Type de document</label>
                      <input value={project.typeDoc} onChange={(e) => setProject({ ...project, typeDoc: e.target.value })} className="mt-2 h-11 w-full rounded-[12px] border border-[#172554]/10 px-4 font-inter text-sm" />
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">Nombre de pages</label>
                      <input type="number" min={1} max={maxPagesForFormula(project.formula)} value={project.pages} onChange={(e) => setProject({ ...project, pages: Math.max(1, Math.min(maxPagesForFormula(project.formula), Number(e.target.value) || 1)) })} className="mt-2 h-11 w-full rounded-[12px] border border-[#172554]/10 px-4 font-inter text-sm" />
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
                  <button onClick={() => void generateFreePreview()} disabled={loading} className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1D78C1] font-inter text-sm font-medium text-white disabled:opacity-50">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[#D4A23A]" />}
                    Générer mon aperçu gratuit
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
                  </div>
                  <div className="mt-5 rounded-[14px] bg-[#FFF8E7] p-4 font-inter text-xs leading-[1.6] text-[#6B4B08]">Sélectionnez une rubrique pour consulter son contenu.</div>
                </aside>
                <section className="min-w-0 rounded-[24px] border border-[#172554]/10 bg-white p-6 sm:p-8 lg:p-10">
                  {previewTab === "problematic" && (
                    <div>
                      <div className="flex items-center justify-between gap-4"><div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#D4A23A]">Problématique gratuite</div><Search className="h-5 w-5 text-[#172554]/45" /></div>
                      <h3 className="mt-5 font-playfair text-2xl leading-tight text-[#172554] sm:text-3xl">{preview.problematic.title}</h3>
                      <p className="mt-6 font-inter text-base leading-[1.9] text-[#172554]/80">{preview.problematic.question || "La problématique n’a pas été retournée par le service."}</p>
                      {preview.problematic.angle && <p className="mt-6 font-inter text-sm leading-[1.8] text-[#172554]/80"><strong>Angle :</strong> {preview.problematic.angle}</p>}
                      {preview.problematic.rationale && <div className="mt-6 rounded-[16px] bg-[#EAF7EE] p-5 font-inter text-sm leading-[1.8] text-[#172554]/80">{preview.problematic.rationale}</div>}
                    </div>
                  )}
                  {previewTab === "plan" && (
                    <div>
                      <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#D4A23A]">Plan gratuit</div>
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
                        <div className="mt-4 rounded-xl bg-[#FFF8E7] p-3 text-xs leading-[1.7] text-[#6B4B08]">Aperçu gratuit : le plan présente la structure du mémoire. Les 320 mots affichés dans l’onglet Introduction constituent seulement un extrait de l’introduction générale.</div>
                      </div>
                    </div>
                  )}
                  {previewTab === "introduction" && (
                    <div>
                      <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#D4A23A]">Extrait de l’introduction générale · 320 mots</div>
                      <h3 className="mt-5 font-playfair text-2xl leading-tight text-[#172554] sm:text-3xl">{preview.introduction.title}</h3>
                      <p className="mt-6 whitespace-pre-wrap font-inter text-base leading-[1.95] text-[#172554]/80">{preview.introduction.content}</p>
                      <div className="mt-6 rounded-[14px] bg-[#FFF8E7] p-4 font-inter text-sm leading-[1.7] text-[#6B4B08]"><strong>Extrait gratuit :</strong> 320 mots maximum affichés sur une introduction générale complète prévu.</div>
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
                    <h3 className="mt-3 font-playfair text-3xl">3 problématiques · 3 plans · rédaction complète</h3>
                    <p className="mt-3 max-w-[720px] font-inter text-sm leading-[1.7] text-white/65">Le paiement débloque les options complètes et la génération du document selon votre sujet, votre contexte, vos consignes et vos fichiers. Le tarif est calculé selon la formule et le volume.</p>
                  </div>
                  <div className="grid gap-3">
                    <button onClick={() => void startPayment("paypal")} disabled={paymentLoading !== null} className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#D4A23A] font-inter text-sm font-semibold text-[#172554] disabled:opacity-60">
                      {paymentLoading === "paypal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
                      Payer avec PayPal
                    </button>
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
                          onClick={() => void generatePlansForProblematic(item, ownerRoute)}
                          className="mt-7 rounded-full bg-[#1D78C1] px-6 py-3 font-inter text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {loading && selectedProblematic?.id === item.id ? "Génération des 3 plans..." : "Générer les 3 plans"}
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
                        <button
                          type="button"
                          onClick={() => {
                            const problematic = selectedProblematic || premium.problematics[0];
                            if (!problematic) return;
                            setSelectedProblematic(problematic);
                            selectPremiumPlan(problematic, plan);
                          }}
                          className="mt-8 rounded-full bg-[#172554] px-6 py-3 font-inter text-xs font-semibold text-white"
                        >
                          Choisir ce plan et passer à la rédaction
                        </button>
                      </article>
                    ) : (
                      <div className="rounded-[24px] bg-white p-8 font-inter text-sm text-[#172554]/65">
                        Aucun plan n'est encore disponible. Sélectionnez une problématique et générez les 3 plans.
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
