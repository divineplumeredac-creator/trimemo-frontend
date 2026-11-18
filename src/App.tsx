Warning: truncated output (original token count: 80295)
Total output lines: 4993

import React, { useEffect, useMemo, useRef, useState } from "react";
import AdminDashboard from "./AdminDashboard";
import MarketingHome from "./MarketingHome";
import AmbassadorProgram from "./AmbassadorProgram";
import {rememberReferralFromUrl,attributeReferralToProject} from "./ambassador-referral";
import { registerOwnedProject, recoverMatchingAttachments } from "./project-account";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  Paperclip,
  Search,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";

const API_BASE_URL = import.meta.env.PROD ? "" : String(import.meta.env.VITE_API_BASE_URL || "https://trimemo-api.vercel.app").replace(/\/$/, "");
const API_URL = `${API_BASE_URL}/api/academic`;
const FEDAPAY_SANDBOX_ENABLED = String(import.meta.env.VITE_FEDAPAY_SANDBOX_ENABLED || "").toLowerCase() === "true";
const PROBLEMATICS_API = `${API_BASE_URL}/api/generate-problematics`;
const PLANS_API = `${API_BASE_URL}/api/generate-plans`;
const FREE_PREVIEW_API = `${API_BASE_URL}/api/generate-free-preview`;
const ESTIMATE_API = `${API_BASE_URL}/api/estimate-project`;
const PROJECT_STATE_API = `${API_BASE_URL}/api/project-state`;
const BLOCK_API = `${API_BASE_URL}/api/generate-block`;
const PREVIEW_CONTINUATION_API = `${API_BASE_URL}/api/preview-continuation`;
const WORDS_PER_PAGE = 320;
function BrandLogo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return <img
    src={light ? "/trimemo-tm-inverse.svg" : "/trimemo-tm.svg"}
    alt="Logo TM de Trimémo"
    width={320}
    height={240}
    loading="eager"
    draggable={false}
    className={`block shrink-0 object-contain ${className}`}
  />;
}

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
  recoveryDigest?: string;
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
  previewRemainder?: string;
  continuationId?: string;
  previewLimitReached?: boolean;
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

function isWritingProtected(owner: boolean, token: string | null, tokenProjectId: string | null, projectId: string) {
  return !owner && !(token && projectId && tokenProjectId === projectId);
}


function previewWordLimit(pages: number) {
  const n = Number(pages);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(2500, Math.max(1, Math.round(2500 * n / 30)));
}

function hasMatchingIntroRecovery(projectId: string, local: any, pending: any) {
  return Boolean(projectId && String(local?.project?.projectId || "") === projectId && Array.isArray(pending) && Array.isArray(local?.blocks) && pending.some((block: Block) => block.kind === "introduction" && Boolean(block.content?.trim())) && pending.every((block: Block) => local.blocks.some((savedBlock: Block) => savedBlock.id === block.id && savedBlock.content === block.content)));
}

function hasMatchingRemoteRecovery(projectId: string, preview: Preview, state: any) {
  if (!projectId || String(state?.project?.projectId || "") !== projectId || state?.selectedPlan?.id !== preview.plan?.id || state?.selectedProblematic?.id !== preview.problematic?.id || !Array.isArray(state?.blocks)) return false;
  const intro = state.blocks.find((block: Block) => block.kind === "introduction" && block.status === "done");
  const displayed = String(preview.introduction?.content || "").trim();
  return Boolean(displayed && intro && String(intro.content || "").trim().startsWith(displayed) && state.blocks.every((block: Block) => typeof block?.id === "string" && typeof block?.content === "string"));
}

function canonicalSnapshot(value: any): string {
  const normalized = JSON.parse(JSON.stringify(value));
  const sort = (item: any): any => Array.isArray(item) ? item.map(sort) : item && typeof item === "object" ? Object.fromEntries(Object.keys(item).sort().map(key => [key, sort(item[key])])) : item;
  return JSON.stringify(sort(normalized));
}

async function snapshotDigest(blocks: Block[]) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalSnapshot(blocks)));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
}

function isCurrentRemoteSnapshot(projectId: string, preview: Preview, state: any, blocks: Block[]) {
  return hasMatchingRemoteRecovery(projectId, preview, state) && canonicalSnapshot(state.blocks) === canonicalSnapshot(blocks);
}

function isPreviewReady(blocks: Block[], limit = 2500) {
  const finished = blocks.filter(block => block.status === "done" && block.content.trim());
  if (!finished.length) return false;
  return (limit > 0 && finished.reduce((sum, block) => sum + countWords(block.content), 0) >= limit) ||
    finished.some(block => block.previewLimitReached) ||
    (blocks.length > 0 && blocks.every(block => block.status === "done" && block.content.trim()));
}

function shouldRestoreSavedView(pathname: string, search: string, hash: string, ownerRoute: boolean, reloading = false) {
  if (ownerRoute || pathname !== "/") return true;
  const params = new URLSearchParams(search);
  return Boolean(reloading || params.get("view") || params.get("payment") || params.get("account") || params.get("reset-password") || params.get("project") || hash);
}

function trimToWordsPreservingLayout(value: string, limit: number) {
  const source = String(value || "");
  if (limit <= 0) return "";
  const words = [...source.matchAll(/\S+/gu)];
  if (words.length <= limit) return source;
  const lastWord = words[limit - 1];
  const end = (lastWord.index || 0) + lastWord[0].length;
  const candidate = source.slice(0, end);
  const boundaries = [...candidate.matchAll(/[.!?…](?:[»”"')\]]*)?(?=\s|$)/gu)];
  if (!boundaries.length) return "";
  const last = boundaries[boundaries.length - 1];
  return candidate.slice(0, (last.index || 0) + last[0].length).trimEnd();
}

function restorePreviewRemainder(block: Block): Block {
  if (!block.previewRemainder) return block;
  const content = block.content + block.previewRemainder;
  return { ...block, content, wordCount: countWords(content), previewRemainder: undefined, previewLimitReached: undefined };
}

function restoreServerContinuation(block: Block, continuationId: string, visible: string, remainder: string, footnotes: string[]): Block {
  if (block.continuationId !== continuationId || block.content !== visible) return block;
  const content = visible + remainder;
  return { ...block, content, wordCount: countWords(content), footnotes, continuationId: undefined, previewLimitReached: undefined };
}

function wordsToPages(words: number) {
  return words / WORDS_PER_PAGE;
}

const MAX_TOTAL_FILES_BYTES = 3 * 1024 * 1024; // les fonctions Vercel refusent les requêtes > 4,5 Mo (base64 inclus)

function dataUrlBytes(value: string) {
  return Math.round(String(value || "").length * 0.75);
}

function createProjectId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {}
  const bytes = new Uint8Array(16);
  try {
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  } catch {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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
  const latestProject = useRef(project);
  const latestBlocks = useRef(blocks);
  latestProject.current = project;
  latestBlocks.current = blocks;
  const [clientProjectFlow, setClientProjectFlow] = useState(false);
  const ambassadorOrigin = useRef<"home" | "dashboard">("home");
  const [view, setView] = useState<"home" | "project" | "estimate" | "preview" | "premium" | "writing" | "account" | "dashboard" | "ambassadors">(() => { const params = new URLSearchParams(window.location.search); return ["signup", "confirmed"].includes(params.get("account") || "") || params.get("reset-password") === "1" || (params.has("token_hash") && ["email", "signup"].includes(params.get("type") || "")) || (new URLSearchParams(window.location.hash.replace(/^#/, "")).get("type") === "signup" && new URLSearchParams(window.location.hash.replace(/^#/, "")).has("access_token")) ? "account" : ["home", "project", "estimate", "preview", "premium", "writing", "account", "dashboard", "ambassadors"].includes(params.get("view") || "") ? params.get("view") as "home" | "project" | "estimate" | "preview" | "premium" | "writing" | "account" | "dashboard" | "ambassadors" : "home"; });
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
  const [showConfirmationResend, setShowConfirmationResend] = useState(false);
  const [clientAuthBusy, setClientAuthBusy] = useState(false);
  const [clientLogoutBusy, setClientLogoutBusy] = useState(false);
  const authIntent = useRef(new URLSearchParams(window.location.search).get("next") === "ambassadors" || window.sessionStorage.getItem("trimemo_auth_intent") === "ambassador" ? "ambassador" : new URLSearchParams(window.location.search).get("start") === "1" ? "project" : "dashboard");
  const confirmationHandled = useRef(false);
  const startProjectRef = useRef<() => Promise<void>>(async () => {});
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<"paypal" | "mobile-money" | null>(null);
  const [clientProjects, setClientProjects] = useState<Array<{project_id:string;subject:string;payment_status:string;updated_at:string}>>([]);
  const [localDraftKeys, setLocalDraftKeys] = useState<string[]>(() => Object.keys(window.localStorage).filter(key => key.startsWith("trimemo_draft_backup_")).sort().reverse());
  const [clientRevisions, setClientRevisions] = useState<any[]>([]);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [clientDashboardTab, setClientDashboardTab] = useState<"documents" | "in_progress" | "pending" | "completed">("documents");
  const [revisionInstructions, setRevisionInstructions] = useState("");
  const [revisionTier, setRevisionTier] = useState<"essential" | "standard" | "deep">("standard");
  const [revisionBillingCountry, setRevisionBillingCountry] = useState("");
  const [revisionPages, setRevisionPages] = useState(0);
  const [revisionQuote, setRevisionQuote] = useState<{unitPrice:number;estimatedAmount:number;currency:string;deliveryLabel:string;detectedWordCount:number}|null>(null);
  const [revisionQuoteLoading, setRevisionQuoteLoading] = useState(false);
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState("");
  const [revisionError, setRevisionError] = useState("");
  const [revisionTargetProjectId, setRevisionTargetProjectId] = useState<string | null>(null);
  const [revisionTargetTitle, setRevisionTargetTitle] = useState("");
  const [clientEmailDisplay, setClientEmailDisplay] = useState("");
  const [clientNameDisplay, setClientNameDisplay] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ownerRoute] = useState(() => typeof window !== "undefined" && window.location.pathname === "/owner");
  // Le lien de parrainage n'accorde aucun droit : il est vérifié par le serveur
  // au moment de rattacher un nouveau projet au compte client.
  useEffect(() => { if (!ownerRoute) rememberReferralFromUrl(window.location.search,window.localStorage); }, [ownerRoute]);
  const protectWriting = isWritingProtected(ownerRoute, window.sessionStorage.getItem("trimemo_premium_token"), window.sessionStorage.getItem("trimemo_premium_project_id"), String(project.projectId || ""));
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
  const creatingProject = useRef(false);
  const activeOwnedProject = useRef<{projectId:string; userId:string} | null>(null);
  // Un aperçu local ne prouve jamais l'appartenance du document au compte :
  // seul un projet ouvert après vérification du serveur peut être affiché.
  const canViewClientPreview = (() => {
    if (ownerRoute) return true;
    try {
      const session = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null");
      return Boolean(
        session?.token && session?.userId &&
        activeOwnedProject.current?.userId === session.userId &&
        activeOwnedProject.current?.projectId === project.projectId
      );
    } catch { return false; }
  })();
  const cloudSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const [cloudSaveStatus, setCloudSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const recoveringContinuations = useRef(new Set<string>());

  const totalDoneWords = useMemo(
    () => blocks.filter((b) => b.status === "done").reduce((sum, b) => sum + b.wordCount, 0),
    [blocks],
  );
  const previewLimit = previewWordLimit(project.pages);
  useEffect(() => {
    const projectId = String(project.projectId || "");
    if (!projectId || !blocks.some(block => block.previewRemainder) || !window.sessionStorage.getItem("trimemo_premium_token") || window.sessionStorage.getItem("trimemo_premium_project_id") !== projectId) return;
    setBlocks(current => current.map(restorePreviewRemainder));
  }, [blocks, project.projectId]);
  useEffect(() => {
    const projectId = String(project.projectId || "");
    const token = window.sessionStorage.getItem("trimemo_premium_token");
    if (!projectId || !token || window.sessionStorage.getItem("trimemo_premium_project_id") !== projectId) return;
    let session: any = null;
    try { session = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
    if (!session?.token || !session?.userId || activeOwnedProject.current?.projectId !== projectId || activeOwnedProject.current?.userId !== session.userId) return;
    for (const block of blocks) {
      const continuationId = block.continuationId;
      if (!continuationId || recoveringContinuations.current.has(continuationId)) continue;
      recoveringContinuations.current.add(continuationId);
      void (async () => {
        try {
          const response = await fetch(PREVIEW_CONTINUATION_API, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Trimemo-Client-Token": String(session.token), "X-Trimemo-Premium-Token": token },
            body: JSON.stringify({ project: projectPayloadWithoutFiles(project), blockId: block.id, continuationId }),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok || typeof result.visible !== "string" || typeof result.remainder !== "string") throw new Error("La suite du document n’a pas pu être récupérée. Rouvrez le projet pour réessayer ; ne régénérez pas ce bloc.");
          if (block.content !== result.visible) throw new Error("Le bloc enregistré diffère de sa sauvegarde sécurisée. Contactez le support ; votre texte reste conservé.");
          let currentSession: any = null;
          try { currentSession = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
          if (currentSession?.userId !== session.userId || activeOwnedProject.current?.projectId !== projectId || activeOwnedProject.current?.userId !== session.userId) throw new Error("Le compte ou le projet a changé. Rouvrez le projet pour reprendre la récupération.");
          setBlocks(current => current.map(item => {
            if (item.id !== block.id) return item;
            return restoreServerContinuation(item, continuationId, result.visible, result.remainder, Array.isArray(result.footnotes) ? result.footnotes : item.footnotes);
          }));
        } catch (error) {
          recoveringContinuations.current.delete(continuationId);
          pushToast("error", error instanceof Error ? error.message : "Impossible de récupérer la suite du document.");
        }
      })();
    }
  }, [blocks, project]);
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
      if (saved?.view && new URLSearchParams(window.location.search).get("account") !== "confirmed" && !new URLSearchParams(window.location.search).get("payment") && new URLSearchParams(window.location.search).get("view") !== "ambassadors" && shouldRestoreSavedView(window.location.pathname, window.location.search, window.location.hash, ownerRoute, performance.getEntriesByType("navigation").some(entry => (entry as PerformanceNavigationTiming).type === "reload"))) setView(saved.view);
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
        let hasCreatedClientSession = false;
        try {
          const session = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null");
          hasCreatedClientSession = Boolean(session?.token);
        } catch {}
        // Signup may have created the auth account before project linking failed.
        // On refresh, route that recoverable session to login so the same project
        // can be linked without attempting to create the account a second time.
        setClientAuthMode(hasCreatedClientSession ? "login" : "signup");
      }
    } catch {
      pushToast("error", "La sauvegarde locale ne peut pas être lue. Contactez le support pour tenter de récupérer votre projet.");
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
        let cloudSession: any = null;
        try { cloudSession = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
        if (!cloudSession?.token) {
          pushToast("error", "Connectez-vous pour restaurer ce projet.");
          cloudHydrated.current = true;
          filesHydrated.current = true;
          setView("account");
          return;
        }
        const response = await fetch(`${PROJECT_STATE_API}?projectId=${encodeURIComponent(sharedProjectId)}`, {
          headers: { Authorization: "Bearer " + String(cloudSession.token) },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || "Impossible de récupérer le projet distant.");
        const activeSession = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null");
        if (!cloudSession?.userId || activeSession?.userId !== cloudSession.userId) throw new Error("Le compte a changé pendant le chargement du projet.");
        if (data.found && data.state) {
          const saved = data.state;
          if (cloudSession?.userId) activeOwnedProject.current = { projectId: sharedProjectId, userId: String(cloudSession.userId) };
          const remoteProject = saved.project ? { ...saved.project, projectId: sharedProjectId, files: [] } : null;
          if (remoteProject) setProject(remoteProject);
          if (saved.formula) setFormula(saved.formula);
          if (saved.preview) setPreview(saved.preview);
          if (saved.estimate) setEstimate(saved.estimate);
          if (saved.premium) setPremium(saved.premium);
          if (saved.selectedProblematic) setSelectedProblematic(saved.selectedProblematic);
          if (saved.selectedPlan) setSelectedPlan(saved.selectedPlan);
          if (Array.isArray(saved.blocks)) setBlocks(saved.blocks);
          // An unfinished project without a validated plan must reopen at the
          // appropriate earlier step rather than a blank writing screen.
          setView(saved.selectedPlan && saved.selectedProblematic ? "writing" : saved.premium ? "premium" : "project");
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
    let cloudSession: any = null;
    try { cloudSession = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
    // Les invités conservent leur travail localement. La sauvegarde cloud exige un compte lié.
    // L'espace propriétaire conserve sa persistance locale et ne passe pas par l'API client.
    if (!cloudHydrated.current || !filesHydrated.current || ownerRoute || !cloudSession?.token || !cloudSession?.userId || activeOwnedProject.current?.projectId !== project.projectId || activeOwnedProject.current?.userId !== cloudSession.userId || !String(project.sujet || "").trim()) return;
    if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current);
    cloudSaveTimer.current = setTimeout(async () => {
      const { paidPreviewSnapshot, ...persistedProject } = project;
      const state = {
        schemaVersion: 2,
        project: { ...persistedProject, files: project.files.map(({ name, type, category }) => ({ name, type, category, content: "" })) },
        formula, preview, estimate, premium, selectedProblematic, selectedPlan, blocks,
        // Ne jamais sauvegarder l'écran du tableau de bord comme écran de reprise du mémoire.
        view: view === "dashboard" || view === "account" || view === "home" || view === "ambassadors" ? "writing" : view,
        previewTab,
        premiumNav, premiumSection, selectedWritingBlockId, problematicImprovementComments,
        planImprovementComments, problematicGenerationCount, planGenerationCount,
      };
      cloudSaveQueue.current = cloudSaveQueue.current.catch(() => {}).then(async () => {
        setCloudSaveStatus("saving");
        const saveWithToken = async (token: string) => fetch(PROJECT_STATE_API, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ projectId: project.projectId, state }),
        });
        try {
          let currentSession = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null");
          if (!currentSession?.token || currentSession.userId !== cloudSession.userId || activeOwnedProject.current?.projectId !== project.projectId || activeOwnedProject.current?.userId !== currentSession.userId) return;
          let token = String(currentSession.token);
          const refreshToken = async () => {
            if (!currentSession?.refreshToken) return false;
            const refreshResponse = await fetch(CLIENT_ACCOUNT_API, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "refresh", refreshToken: currentSession.refreshToken }),
            });
            const refreshed = await refreshResponse.json().catch(() => ({}));
            if (!refreshResponse.ok || !refreshed.token || refreshed.user?.id !== cloudSession.userId) return false;
            const active = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null");
            if (active?.userId !== cloudSession.userId || activeOwnedProject.current?.projectId !== project.projectId) return false;
            currentSession = { ...currentSession, token: String(refreshed.token), refreshToken: String(refreshed.refresh_token || currentSession.refreshToken), expiresAt: refreshed.expires_at || null };
            token = currentSession.token;
            window.localStorage.setItem("trimemo_client_session", JSON.stringify(currentSession));
            return true;
          };
          let response = await saveWithToken(token);
          if (response.status === 401 && await refreshToken()) response = await saveWithToken(token);
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data?.error || "Échec de la sauvegarde serveur.");
          const active = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null");
          if (active?.userId !== cloudSession.userId || activeOwnedProject.current?.projectId !== project.projectId) return;
          // The state write above is owner-authorized; updating the listing
          // afterwards cannot claim a project for the current account.
          const listing = await fetch(CLIENT_ACCOUNT_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "link", token, projectId: project.projectId, subject: project.sujet }) });
          if (!listing.ok) throw new Error("Le projet est enregistré, mais son nom n’a pas pu être actualisé dans la liste.");
          setCloudSaveStatus("saved");
          window.dispatchEvent(new CustomEvent("trimemo-cloud-save", { detail: { ok: true, savedAt: data.savedAt } }));
        } catch (error) {
          console.error("TRIMEMO_CLOUD_PROJECT_SAVE_FAILED", String(error));
          setCloudSaveStatus("error");
          window.dispatchEvent(new CustomEvent("trimemo-cloud-save", { detail: { ok: false } }));
        }
      });
    }, 900);
    return () => { if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current); };
  }, [ownerRoute, ownerSessionValid, project, formula, preview, estimate, premium, selectedProblematic, selectedPlan, blocks, view, previewTab, premiumNav, premiumSection, selectedWritingBlockId, problematicImprovementComments, planImprovementComments, problematicGenerationCount, planGenerationCount]);

  // Keep navigation explicit so a refresh opens the same screen.
  useEffect(() => {
    if (!filesHydrated.current || ownerRoute) return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("payment") || url.searchParams.has("account") || url.searchParams.has("reset-password") || url.hash) return;
    if (view === "home") url.searchParams.delete("view");
    else url.searchParams.set("view", view);
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, [view, ownerRoute]);

  // Refuser les aperçus issus d'une ancienne session, d'une URL directe
  // (?view=preview) ou d'un état local non vérifié côté serveur.
  useEffect(() => {
    if (view !== "preview" || canViewClientPreview) return;
    setPendingPaymentMethod(null);
    let hasSession = false;
    try {
      const session = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null");
      hasSession = Boolean(session?.token && session?.userId);
    } catch {}
    if (!hasSession) {
      setClientAuthMode("login");
      setClientAuthNotice("Connectez-vous pour retrouver votre projet depuis votre espace client.");
    }
    setView(hasSession ? "dashboard" : "account");
  }, [view, canViewClientPreview]);

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
    const queryOrderId = params.get("order_id") || params.get("token") || params.get("transaction_id") || (payment === "fedapay" ? params.get("id") : null);
    // Certains retours PayPal intégrés ne transmettent pas immédiatement le token dans l'URL.
    // La référence de commande est sauvegardée avant la redirection et sert de reprise sécurisée.
    const id = queryOrderId || (payment === "paypal" ? window.sessionStorage.getItem("trimemo_pending_paypal_order") : payment === "fedapay" ? window.sessionStorage.getItem("trimemo_pending_fedapay_order") : null);
    if (!payment || payment === "paypal_cancelled" || payment === "fedapay_cancelled") {
      if (payment === "paypal_cancelled" || payment === "fedapay_cancelled") {
        window.sessionStorage.removeItem("trimemo_pending_paypal_order");
        window.sessionStorage.removeItem("trimemo_pending_fedapay_order");
        pushToast("info", "Paiement annulé. Votre projet est conservé ; vous pouvez reprendre le paiement.");
        let session: any = null;
        try { session = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
        const destination = session?.token ? "preview" : "account";
        if (session?.token) {
          setClientEmailDisplay(String(session.email || ""));
          setClientNameDisplay(String(session.fullName || "Mon compte"));
        } else {
          setClientAuthMode("login");
          setClientAuthNotice("Reconnectez-vous pour retrouver votre projet après l’annulation du paiement.");
        }
        setView(destination);
        const returnUrl = new URL(window.location.href);
        for (const key of ["payment", "token", "PayerID", "order_id", "transaction_id", "id"]) returnUrl.searchParams.delete(key);
        returnUrl.searchParams.set("view", destination);
        window.history.replaceState({}, document.title, returnUrl.pathname + returnUrl.search);
      }
      return;
    }
    if (!id) {
      pushToast("error", "Le retour de paiement ne contient pas la référence de transaction. Votre projet est conservé ; relancez le paiement ou contactez le support.");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const action = payment === "paypal" ? "verify-paypal" : "verify-mobile-money";
        let verificationSession: any = null;
        try { verificationSession = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
        if ((payment === "paypal" || payment === "fedapay") && !verificationSession?.token) {
          setClientAuthMode("login");
          setView("account");
          throw new Error("Connectez-vous au compte associé au projet pour reprendre la vérification du paiement.");
        }
        const verify = (token: string) => fetch(`${API_URL}?action=${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ id, action: "verify", project: loadPendingProject(stateStorageKey) }),
        });
        let response = await verify(String(verificationSession?.token || ""));
        if ((payment === "paypal" || payment === "fedapay") && response.status === 401 && verificationSession?.refreshToken) {
          const refresh = await fetch(CLIENT_ACCOUNT_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "refresh", refreshToken: verificationSession.refreshToken }) });
          const renewed = await refresh.json().catch(() => ({}));
          if (refresh.ok && renewed.token && renewed.user?.id === verificationSession.userId) {
            const current = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null");
            if (!current || current.userId !== verificationSession.userId) throw new Error("Le compte a changé. Reconnectez-vous au compte associé au projet.");
            verificationSession = { ...verificationSession, token: String(renewed.token), refreshToken: String(renewed.refresh_token || verificationSession.refreshToken), expiresAt: renewed.expires_at || null };
            window.localStorage.setItem("trimemo_client_session", JSON.stringify(verificationSession));
            response = await verify(verificationSession.token);
          }
        }
        if ((payment === "paypal" || payment === "fedapay") && response.status === 401) { setClientAuthMode("login"); setView("account"); }
        const data = await readApiResponse(response);
        if (payment === "fedapay" && data.status === "CANCELLED") {
          // FedaPay has verified that this attempt cannot be paid. Keep the
          // existing preview and draft; never grant premium access.
          window.sessionStorage.removeItem("trimemo_pending_fedapay_order");
          pushToast("info", "Paiement annulé ou refusé. Votre projet et son aperçu sont conservés ; vous pouvez réessayer.");
          let currentSession: any = null;
          try { currentSession = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
          const destination = currentSession?.token ? "preview" : "account";
          if (!currentSession?.token) {
            setClientAuthMode("login");
            setClientAuthNotice("Reconnectez-vous pour retrouver votre projet et réessayer le paiement.");
          }
          setView(destination);
          const returnUrl = new URL(window.location.href);
          for (const key of ["payment", "token", "PayerID", "order_id", "transaction_id", "id", "status"]) returnUrl.searchParams.delete(key);
          returnUrl.searchParams.set("view", destination);
          window.history.replaceState({}, document.title, returnUrl.pathname + returnUrl.search);
          return;
        }
        if (data.status === "PENDING") {
          pushToast("info", "Paiement en cours de confirmation. Aucun montant n'est considéré encaissé avant validation FedaPay.");
          return;
        }
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
        if (payment === "paypal" || payment === "fedapay") {
          const activeSession = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null");
          if (!verificationSession?.userId || activeSession?.userId !== verificationSession.userId) throw new Error("Le compte a changé. Reconnectez-vous au compte associé au projet.");
          activeOwnedProject.current = { projectId: String(saved.projectId || ""), userId: verificationSession.userId };
        }
        if (saved) {
          let storedPreview: Preview | null = data.preview || null;
          if (!storedPreview) { try { storedPreview = JSON.parse(window.sessionStorage.getItem("trimemo_preview_pending") || window.localStorage.getItem("trimemo_preview_pending") || "null"); } catch {} }
          if (!storedPreview && saved.paidPreviewSnapshot) storedPreview = saved.paidPreviewSnapshot;

          if (storedPreview?.problematic?.question && storedPreview?.plan?.parts?.length && (storedPreview?.chapterOne?.content || storedPreview?.introduction?.content)) {
            let remoteRecoveryBlocks: Block[] = [];
            if (!storedPreview?.chapterOne?.content) {
              let safeRecovery = false;
              try {
                const local = JSON.parse(window.localStorage.getItem(stateStorageKey) || "null");
                const pending = JSON.parse(window.sessionStorage.getItem("trimemo_blocks_pending") || "null");
                safeRecovery = hasMatchingIntroRecovery(String(saved.projectId || ""), local, pending) && Boolean(storedPreview.recoveryDigest) && await snapshotDigest(pending) === storedPreview.recoveryDigest;
              } catch {}
              if (!safeRecovery) {
                // Do not let autosave overwrite the remote copy while recovery is in progress.
                cloudHydrated.current = false;
                let session: any = null;
                try { session = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
                if (session?.token) {
                  const response = await fetch(`${PROJECT_STATE_API}?projectId=${encodeURIComponent(String(saved.projectId || ""))}`, { headers: { Authorization: "Bearer " + String(session.token) } });
                  const result = await response.json().catch(() => ({}));
                  if (response.ok && result.found && hasMatchingRemoteRecovery(String(saved.projectId || ""), storedPreview, result.state) && storedPreview.recoveryDigest && await snapshotDigest(result.state.blocks) === storedPreview.recoveryDigest) remoteRecoveryBlocks = result.state.blocks;
                }
                if (!remoteRecoveryBlocks.length) throw new Error("Paiement confirmé. La sauvegarde du projet n’a pas pu être vérifiée ; connectez-vous au compte associé et ouvrez le projet depuis votre espace client. Ne régénérez pas le document.");
              }
            }
            setProject(saved);
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
            const recoveryBlocks = remoteRecoveryBlocks.length ? remoteRecoveryBlocks : savedBlocks;
            if (remoteRecoveryBlocks.length && remoteRecoveryBlocks.some(block => !prepared.some(item => item.id === block.id))) throw new Error("Paiement confirmé. La structure du projet sauvegardé a changé ; ouvrez le projet depuis votre espace client pour éviter toute perte.");
            const restoredBlocks = recoveryBlocks.length
              ? prepared.map((block) => {
                  const savedBlock = recoveryBlocks.find((item) => item.id === block.id);
                  return savedBlock ? { ...block, ...savedBlock, id: block.id } : block;
                })
              : nextBlocks;
            setBlocks(restoredBlocks);
            cloudHydrated.current = true;
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
        let clientSession = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null");
        if (!clientSession?.token || !saved?.projectId) {
          throw new Error("Paiement confirmé. Connectez-vous à votre compte pour rattacher le mémoire et reprendre la rédaction.");
        }
        const linkPaidProject = (token: string) => fetch(CLIENT_ACCOUNT_API, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "link", token, projectId: saved.projectId, subject: saved.sujet || "Projet académique", orderId: data.order_id || id }),
        });
        let linkResponse = await linkPaidProject(clientSession.token);
        if (linkResponse.status === 401 && clientSession.refreshToken) {
          const refreshResponse = await fetch(CLIENT_ACCOUNT_API, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "refresh", refreshToken: clientSession.refreshToken }),
          });
          const refreshed = await refreshResponse.json().catch(() => ({}));
          if (refreshResponse.ok && refreshed.token) {
            clientSession = { ...clientSession, token: String(refreshed.token), refreshToken: String(refreshed.refresh_token || clientSession.refreshToken), expiresAt: refreshed.expires_at || null };
            window.localStorage.setItem("trimemo_client_session", JSON.stringify(clientSession));
            linkResponse = await linkPaidProject(clientSession.token);
          }
        }
        const linkData = await readApiResponse(linkResponse);
        if (!linkData.success) throw new Error("Paiement confirmé, mais le mémoire n’a pas encore été rattaché. Vos données sont conservées; reconnectez-vous pour reprendre.");
        window.sessionStorage.removeItem("trimemo_pending_paypal_order");
        window.sessionStorage.removeItem("trimemo_pending_fedapay_order");
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

  async function startNewClientProject() {
    if (creatingProject.current) return;
    let session: any = null;
    try { session = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
    if (!session?.token || !session?.userId) {
      setClientAuthMode("login"); setClientAuthNotice("Connectez-vous ou créez votre compte avant de commencer un projet."); setView("account"); return;
    }
    const next: ProjectData = {
      projectId: createProjectId(), formula: formula || "MASTER", sujet: "", domaine: "", contexte: "",
      problematiquePersonnelle: "", planPersonnel: "", consignes: "", niveau: "", typeDoc: "Mémoire",
      pages: 0, email: "", files: [],
    };
    creatingProject.current = true;
    try {
      // Preserve the complete in-memory draft before replacing it. If the
      // browser cannot store the backup, leave the current project untouched.
      archiveCurrentDraft();
      await registerOwnedProject(CLIENT_ACCOUNT_API, session, next, () => {
        try { return JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch { return null; }
      });
      if (latestProject.current !== project || latestBlocks.current !== blocks) throw new Error("Le projet affiché a changé pendant la création. Votre travail est conservé ; ouvrez le nouveau projet depuis votre compte.");
      activeOwnedProject.current = { projectId: next.projectId, userId: session.userId };
      // Attribution facultative : un problème de parrainage n'interrompt
      // jamais la création du projet et ne modifie pas son prix.
      try {
        const activeReferralSession = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null");
        if (activeReferralSession?.userId === session.userId && activeReferralSession?.token) {
          await attributeReferralToProject(next.projectId, String(activeReferralSession.token), window.localStorage);
        }
      } catch { console.warn("TRIMEMO_AMBASSADOR_ATTRIBUTION_UNAVAILABLE"); }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de créer le projet dans votre compte.";
      if (/session a expiré|session ne peut plus être renouvelée|connectez-vous à nouveau|session doit être renouvelée/i.test(message)) {
        authIntent.current = "project";
        setClientAuthMode("login");
        setClientAuthError("");
        setClientAuthNotice("Votre session a expiré. Connectez-vous à nouveau pour commencer votre projet.");
        setView("account");
      } else {
        pushToast("error", message);
      }
      return;
    } finally { creatingProject.current = false; }
    // Le formulaire s’ouvre dans le parcours client, sans retour à l’accueil.
    setClientProjectFlow(true);
    // Nouveau projet = nouvel identifiant et nouveau droit de paiement.
    window.sessionStorage.removeItem("trimemo_premium_token");
    window.sessionStorage.removeItem("trimemo_premium_project_id");
    setProject(next);
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
  startProjectRef.current = startNewClientProject;

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const emailConfirmation = ["email", "signup"].includes(query.get("type") || "") && query.has("token_hash");
    const implicitConfirmation = ["signup", "email"].includes(fragment.get("type") || "") && fragment.has("access_token");
    if ((query.get("account") !== "confirmed" && !emailConfirmation && !implicitConfirmation) || confirmationHandled.current) return;
    confirmationHandled.current = true;
    const tokenFromUrl = fragment.get("access_token") || query.get("access_token") || "";
    const tokenHash = query.get("token_hash") || fragment.get("token_hash") || "";
    const tokenType = query.get("type") || fragment.get("type") || "email";
    const refreshFromUrl = fragment.get("refresh_token") || "";
    const linkError = fragment.get("error_code") || query.get("error_code") || fragment.get("error") || query.get("error") || "";
    // Éviter d'exposer les jetons dans l'historique du navigateur.
    window.history.replaceState({}, document.title, window.location.pathname);
    setView("account");
    setClientAuthMode("login");
    if (query.get("next") === "ambassadors") {
      authIntent.current = "ambassador";
      window.sessionStorage.setItem("trimemo_auth_intent", "ambassador");
    }
    if (linkError) {
      setClientAuthError("Ce lien de confirmation est expiré ou invalide. Connectez-vous si votre compte est déjà activé, ou demandez un nouveau lien.");
      setShowConfirmationResend(true);
      return;
    }
    if (!tokenFromUrl && !tokenHash) {
      setClientAuthNotice("Votre adresse peut déjà être confirmée. Connectez-vous pour poursuivre votre inscription.");
      setShowConfirmationResend(true);
      return;
    }
    void (async () => {
      try {
        const response = await fetch(CLIENT_ACCOUNT_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tokenFromUrl
            ? { action: "confirm-session", token: tokenFromUrl }
            : { action: "verify-email", tokenHash, type: tokenType }),
        });
        const data = await readApiResponse(response);
        if (!data.user?.id) throw new Error("La confirmation de votre compte n’a pas pu être vérifiée.");
        const token = String(data.token || tokenFromUrl);
        const refreshToken = String(data.refresh_token || refreshFromUrl);
        if (!token) throw new Error("La session de confirmation est incomplète.");
        const fullName = [data.user.firstName, data.user.lastName].filter(Boolean).join(" ");
        // Signup metadata is used for navigation only, never for authorization.
        const confirmedSignupIntent = ["ambassador", "project"].includes(data.user.signupIntent) ? data.user.signupIntent : "";
        window.localStorage.setItem("trimemo_client_session", JSON.stringify({ token, refreshToken, expiresAt: data.expires_at || null, userId: data.user.id, email: data.user.email || "", fullName }));
        setClientEmailDisplay(String(data.user.email || "")); setClientNameDisplay(fullName || "Mon compte");
        window.sessionStorage.removeItem("trimemo_auth_intent");
        if (query.get("next") === "ambassadors" || authIntent.current === "ambassador" || confirmedSignupIntent === "ambassador") {
          authIntent.current = "dashboard";
          setView("ambassadors");
        } else if (query.get("start") === "1" || confirmedSignupIntent === "project") {
          authIntent.current = "dashboard";
          await startProjectRef.current();
        } else {
          setView("dashboard");
          await loadClientProjects();
        }
      } catch (error) {
        setClientAuthError(error instanceof Error ? error.message : "Le lien n’a pas pu être vérifié. Connectez-vous ou demandez un nouveau lien.");
        setShowConfirmationResend(true);
      }
    })();
  }, []);

  function archiveCurrentDraft() {
    if (!String(project.sujet || "").trim()) return;
    const key = `trimemo_draft_backup_${project.projectId}_${Date.now()}`;
    const hasLocalFiles = project.files?.some((file: FileInput) => Boolean(file?.content));
    // Les contenus de pièces jointes restent limités à la session du navigateur.
    const attachmentBackupKey = hasLocalFiles ? `${key}_files` : undefined;
    if (attachmentBackupKey) window.sessionStorage.setItem(attachmentBackupKey, JSON.stringify(project.files));
    const backupProject = { ...project, files: project.files?.map(({ content, ...file }: FileInput) => file) };
    const backup = { schemaVersion: 2, project: backupProject, attachmentBackupKey, formula, preview, estimate, premium, selectedProblematic, selectedPlan, blocks, previewTab, premiumNav, premiumSection, selectedWritingBlockId, problematicImprovementComments, planImprovementComments, problematicGenerationCount, planGenerationCount };
    try { window.localStorage.setItem(key, JSON.stringify(backup)); }
    catch (error) { if (attachmentBackupKey) window.sessionStorage.removeItem(attachmentBackupKey); throw error; }
    setLocalDraftKeys(keys => [key, ...keys]);
  }

  async function recoverLocalDraft(key: string) {
    let session: any = null;
    try { session = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
    if (!session?.token || !session?.userId) { setView("account"); pushToast("error", "Connectez-vous au compte du projet avant de reprendre ce brouillon."); return; }
    setLoading(true);
    try {
      const draft = JSON.parse(window.localStorage.getItem(key) || "null");
      const projectId = String(draft?.project?.projectId || "");
      if (!projectId || !draft?.project?.sujet) throw new Error("Ce brouillon ne peut pas être lu. Les données restent sur cet appareil.");
      // A local browser copy cannot prove ownership. Ask the server to verify
      // the existing account association before showing or transmitting it.
      const response = await fetch(CLIENT_ACCOUNT_API, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"resume", token:session.token, projectId }) });
      const data = await readApiResponse(response);
      if (!data.success || !data.state?.project) throw new Error("Le propriétaire du brouillon ne peut pas être confirmé. Le contenu reste sur cet appareil ; contactez le support.");
      const current = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null");
      if (current?.userId !== session.userId) throw new Error("Le compte a changé. Le brouillon reste conservé sur cet appareil.");
      const storedFiles = draft.attachmentBackupKey ? JSON.parse(window.sessionStorage.getItem(draft.attachmentBackupKey) || "null") : null;
      recoverMatchingAttachments(draft, data.state, storedFiles);
      await openClientProject(projectId, { draft, storedFiles });
    } catch (error) { pushToast("error", error instanceof Error ? error.message : "La reprise a échoué. Le brouillon est conservé."); }
    finally { setLoading(false); }
  }

  async function logoutClient() {
    if (clientLogoutBusy || loading) return;
    setClientLogoutBusy(true);
    try {
      const session = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null");
      const active = activeOwnedProject.current;
      if (session?.token && session?.userId && active?.projectId === project.projectId && active?.userId === session.userId && String(project.sujet || "").trim()) {
        const snapshotProject = project;
        const snapshotBlocks = blocks;
        // Preserve the current work even if the server is unavailable.
        archiveCurrentDraft();
        if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current);
        await cloudSaveQueue.current.catch(() => {});
        const currentSession = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null");
        if (currentSession?.userId !== session.userId || activeOwnedProject.current?.projectId !== project.projectId || latestProject.current !== snapshotProject || latestBlocks.current !== snapshotBlocks) throw new Error("Le projet a changé pendant la sauvegarde. Réessayez de vous déconnecter.");
        const { paidPreviewSnapshot, ...persistedProject } = snapshotProject;
        const state = { schemaVersion: 2, project: { ...persistedProject, files: snapshotProject.files.map(({ name, type, category }) => ({ name, type, category, content: "" })) }, formula, preview, estimate, premium, selectedProblematic, selectedPlan, blocks: snapshotBlocks, view: view === "dashboard" || view === "account" || view === "home" || view === "ambassadors" ? "writing" : view, previewTab, premiumNav, premiumSection, selectedWritingBlockId, problematicImprovementComments, planImprovementComments, problematicGenerationCount, planGenerationCount };
        const response = await fetch(PROJECT_STATE_API, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + currentSession.token }, body: JSON.stringify({ projectId: snapshotProject.projectId, state }) });
        if (!response.ok || latestProject.current !== snapshotProject || latestBlocks.current !== snapshotBlocks) throw new Error("La dernière sauvegarde n’a pas pu être confirmée. Votre projet reste ouvert ; vérifiez votre connexion et réessayez.");
      }
      activeOwnedProject.current = null;
      window.localStorage.removeItem("trimemo_client_session");
      window.sessionStorage.removeItem("trimemo_premium_token");
      window.sessionStorage.removeItem("trimemo_premium_project_id");
      setClientEmailDisplay(""); setClientNameDisplay(""); setClientProjects([]); setClientRevisions([]); setClientProjectFlow(false); setMobileMenuOpen(false); setView("home");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Déconnexion impossible. Votre projet reste ouvert.");
    } finally { setClientLogoutBusy(false); }
  }

  function goToProject() {
    let session: any = null;
    try { session = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
    if (!ownerRoute && (!session?.token || !session?.userId)) {
      authIntent.current = "project";
      setClientAuthMode("login");
      setClientAuthNotice("Connectez-vous ou créez votre compte avant de commencer un projet.");
      setView("account");
      return;
    }
    if (!ownerRoute) { void startNewClientProject(); return; }
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

  async function reviseProjectInputs() {
    if (creatingProject.current) return;
    const next: ProjectData = { ...project, projectId: createProjectId(), pricingQuoteToken: undefined };
    if (!ownerRoute) {
      let session: any = null;
      try { session = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
      if (!session?.token || !session?.userId) { setClientAuthMode("login"); setView("account"); return; }
      creatingProject.current = true;
      try {
        archiveCurrentDraft();
        await registerOwnedProject(CLIENT_ACCOUNT_API, session, projectPayloadWithoutFiles(next), () => {
          try { return JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch { return null; }
        });
        if (latestProject.current !== project || latestBlocks.current !== blocks) throw new Error("Le projet affiché a changé. Votre travail est conservé ; ouvrez le nouveau projet depuis votre compte.");
        activeOwnedProject.current = { projectId: next.projectId, userId: session.userId };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Impossible de préparer le projet.";
        if (/session a expiré|session ne peut plus être renouvelée|connectez-vous à nouveau|session doit être renouvelée/i.test(message)) {
          authIntent.current = "dashboard";
          setClientAuthMode("login");
          setClientAuthError("");
          setClientAuthNotice("Votre session a expiré. Connectez-vous à nouveau pour reprendre vos projets.");
          setView("account");
        } else {
          pushToast("error", message);
        }
        return;
      }
      finally { creatingProject.current = false; }
    }
    window.sessionStorage.removeItem("trimemo_premium_token"); window.sessionStorage.removeItem("trimemo_premium_project_id");
    setProject(next); setEstimate(null); setPremium(null); setPreview(null); setSelectedProblematic(null); setSelectedPlan(null); setBlocks([]); setProblematicGenerationCount(0); setPlanGenerationCount(0); setView("project");
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
      "text/csv",
      "text/tab-separated-values",
    ];
    const files: FileInput[] = [];
    for (const file of Array.from(fileList)) {
      if (!allowed.includes(file.type) && !/\.(pdf|docx|txt|md|csv|tsv|jpe?g|png|webp|gif|bmp|tiff?)$/i.test(file.name)) {
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
      const protectedRoutes = [ESTIMATE_API, PROBLEMATICS_API, PLANS_API, FREE_PREVIEW_API, BLOCK_API];
      let headers = init.headers;
      if (!ownerRoute && typeof input === "string" && protectedRoutes.includes(input)) {
        let session: any = null;
        try { session = JSON.parse(window.localStorage.getItem("trimemo_client_session") || "null"); } catch {}
        if (!session?.token || !session?.userId || activeOwnedProject.current?.userId !== session.userId || activeOwnedProject.current?.projectId !== project.projectId) throw new Error("Ouvrez ce projet depuis votre espace client avant de poursuivre ; votre travail local est conservé.");
        const nextHeaders = new Headers(init.headers);
        nextHeaders.set("X-Trimemo-Client-Token", String(session.token));
        headers = nextHeaders;
      }
      return await fetch(input, { ...init, headers, signal: controller.signal });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("La demande prend plus de temps que prévu. Votre travail est conservé ; veuillez réessayer.");
      }
      if (error instanceof TypeError && /fetch/i.test(error.message || "")) {
        throw new Error("Le service est momentanément inaccessible. Vérifiez votre connexion et réessayez.");
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

  // Ne jamais afficher les détails du fournisseur ou de l'infrastructure aux clients.
  function clientSafeError(message: string, status: number): string {
    const value = String(message || "").trim();
    if (/credit balance|insufficient_quota|no credits|crédits? (?:claude|anthropic|api)|billing|quota fournisseur|solde (?:api|claude)|recharg(?:ez|er).*anthropic/i.test(value)) {
      return "La rédaction est momentanément indisponible. Votre projet et votre progression sont conservés. Veuillez réessayer ultérieurement ou contacter notre assistance.";
    }
    if (status === 429 || /rate.?limit|too many requests|limite de requêtes/i.test(value)) {
      return "Le service reçoit actuellement de nombreuses demandes. Votre travail est conservé ; veuillez réessayer dans quelques instants.";
    }
    if (status >= 500 || /anthropic|claude|openai|api[_ -]?key|supabase|vercel|upstash|redis|json|stack|traceback|endpoint|proxy \/api|tokens?|modèle (?:ia|api)/i.test(value)) {
      return "Une difficulté technique empêche momentanément cette opération. Votre travail est conservé ; veuillez réessayer ou contacter notre assistance.";
    }
    return value || "Cette opération n'a pas pu aboutir. Veuillez réessayer.";
  }

  async function readApiResponse(response: Response) {
    const raw = await response.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      throw new Error("Le service est momentanément indisponible. Veuillez réessayer.");
    }
    if (!response.ok) {
      throw new Error(clientSafeError(stringifyApiError(data?.error || data?.message), response.status));
    }
    return data;
  }

  function navigateToSection(id: "fonctionnement" | "revision-humaine") {
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

  function startNewOwnerProject() {
    if (!ownerSessionValid || loading) return;
    setProject({
      projectId: createProjectId(), formula: "MASTER", sujet: "", domaine: "", contexte: "…30295 tokens truncated…caleString("fr-FR")} mots ({totalDoneWords.toLocaleString("fr-FR")}/{previewLimit.toLocaleString("fr-FR")})
                      </div>
                    )}

                  </div>

                </div>

                <div className="space-y-4 pb-8">
                  {blocks.map((block, index) => {
                    const isLast = index === blocks.length - 1;
                    const isGenerating = block.status === "generating";
                    return (
                      <article
                        key={block.id}
                        id={`writing-block-${block.id}`}
                        className="studio-writing-sheet mx-auto max-w-[900px] overflow-hidden border border-[#E6E1D8] bg-white shadow-[0_15px_45px_-30px_rgba(23,63,77,0.30)]"
                      >
                        <div className="border-b border-[#173F4D]/20 px-5 py-4 sm:px-8">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="font-playfair text-xl font-semibold leading-snug text-[#173F4D]">{block.title}</h2>
                            <button
                              type="button"
                              aria-label={`${block.content ? "Régénérer" : "Générer"} le bloc : ${block.title}`}
                              disabled={isGenerating || (activeBlockId !== null && activeBlockId !== block.id)}
                              onClick={() => {
                                setSelectedWritingBlockId(block.id);
                                void generateBlock(block.id);
                              }}
                              className="shrink-0 rounded-full bg-[#173F4D] px-5 py-2.5 font-inter text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isGenerating ? "Génération en cours…" : block.content ? "Régénérer" : "Générer"}
                            </button>
                          </div>
                          {isGenerating && <p role="status" className="mt-3 font-inter text-xs leading-5 text-[#5E6B73]">Votre texte est en préparation. Selon les besoins du projet, Trimémo recherche des sources, rédige et effectue des vérifications. Cela peut prendre quelques instants.</p>}
                          {block.structure.length > 0 && (
                            <details className="mt-2 font-inter text-xs text-[#5E6B73]">
                              <summary className="w-fit cursor-pointer font-medium">Voir la structure du bloc</summary>
                              <ul className="mt-2 list-disc space-y-1 pl-5 leading-5">
                                {block.structure.map((item, structureIndex) => (
                                  <li key={`${block.id}-structure-${structureIndex}`}>{item}</li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </div>

                        <div
                          className="studio-document-page min-h-0 bg-white px-5 py-6 font-['Times_New_Roman'] text-[12pt] leading-[1.5] text-[#27323A] sm:px-8 sm:py-8 md:px-12 md:py-10"
                          style={protectWriting ? { userSelect: "none", WebkitUserSelect: "none" } : undefined}
                          onCopy={protectWriting ? (event) => event.preventDefault() : undefined}
                          onCut={protectWriting ? (event) => event.preventDefault() : undefined}
                        >
                          {block.error && (
                            <div className="mb-6 rounded-lg border border-[#B42318]/30 bg-[#B42318]/10 p-4 font-inter text-xs leading-5 text-[#173F4D]">
                              <strong>Erreur de rédaction :</strong> {block.error}
                            </div>
                          )}

                          {block.content ? (
                            <div>{renderAcademicText(block.content, false, block.structure, block.kind)}</div>
                          ) : (
                            <p className="font-inter text-sm text-[#5E6B73]">Ce bloc attend sa rédaction. Cliquez sur « Générer » ci-dessus.</p>
                          )}

                          {block.footnotes.length > 0 && (
                            <div className="mt-12 border-t border-[#173F4D] pt-5 text-[11px] leading-[1.6]">
                              <div className="mb-2 font-bold">Notes</div>
                              <ol className="list-decimal space-y-1 pl-5">
                                {block.footnotes.map((note, noteIndex) => <li key={noteIndex}>{note}</li>)}
                              </ol>
                            </div>
                          )}

                          {block.sources.some((source) => source?.verified === true) && (
                            <div className="mt-10 border-t border-[#173F4D]/20 pt-5 font-inter text-[11px] leading-[1.6] text-[#5E6B73]">
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
                          <div className="border-t border-[#173F4D]/20 bg-white px-5 py-3 text-center sm:px-8">
                            <button
                              type="button"
                              disabled={activeBlockId !== null}
                              onClick={() => {
                                const next = blocks[index + 1];
                                if (!ownerRoute && !window.sessionStorage.getItem("trimemo_premium_token") && isPreviewReady(blocks, previewLimit)) {
                                  setSelectedWritingBlockId(next.id);
                                  void exportDocument();
                                  return;
                                }
                                setSelectedWritingBlockId(next.id);
                                document.getElementById(`writing-block-${next.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }}
                              className="rounded-full border border-[#173F4D]/15 bg-white px-6 py-2.5 font-inter text-xs font-semibold text-[#173F4D] hover:bg-[#173F4D]/20 disabled:cursor-not-allowed disabled:opacity-40"
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
            <section className="rounded-[28px] border border-[#173F4D]/10 bg-white p-6 shadow-sm">
              <h1 className="font-playfair text-3xl">Tableau de bord</h1>
              <p className="mt-2 font-inter text-sm text-[#5E6B73]">
                Préparez un test pour lancer la génération.
              </p>
              <button
                type="button"
                onClick={() => setView("project")}
                className="mt-5 rounded-full bg-[#173F4D] px-5 py-3 font-inter text-xs font-semibold text-white"
              >
                Nouveau test
              </button>
            </section>
          )}
          </main>
        </div>

        <div className="fixed bottom-4 right-4 z-[90] max-w-sm rounded-2xl bg-[#173F4D] px-4 py-3 font-inter text-[11px] text-white shadow-xl">
          MODE ADMINISTRATEUR · PAIEMENT NEUTRALISÉ · ESPACE SÉPARÉ
        </div>
      </div>
    );
  }

  return (
    <div className="studio-shell min-h-screen bg-[#F7F5EF] text-[#173F4D]">
      <style>{`
        .font-playfair { font-family: 'Playfair Display', Georgia, serif; }
        .font-inter { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; }
      `}</style>

      <div className="fixed right-4 top-4 z-[100] flex max-w-md flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="rounded-xl border bg-white px-4 py-3 text-sm shadow-lg">
            <div className="flex items-start gap-2">
              <span className={`mt-1 h-2 w-2 rounded-full ${toast.type === "error" ? "bg-[#173F4D]" : toast.type === "success" ? "bg-[#173F4D]" : "bg-[#173F4D]"}`} />
              <span>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>

      {ownerRoute && ownerSessionValid && (
        <aside className="fixed bottom-4 right-4 z-[90] w-[min(340px,calc(100vw-2rem))] rounded-[22px] border border-[#173F4D]/10 bg-white p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#173F4D]">Espace propriétaire</div>
              <div className="mt-1 font-playfair text-xl text-[#173F4D]">Tests rapides</div>
            </div>
            <button onClick={handleOwnerLogout} className="rounded-full border border-[#173F4D]/10 px-3 py-1.5 font-inter text-[11px]">Quitter</button>
          </div>
          <button type="button" onClick={startNewOwnerProject} className="mt-4 w-full rounded-xl bg-[#173F4D]/10 px-3 py-3 font-inter text-xs font-semibold text-[#173F4D]">Nouveau projet de test</button>
          <button onClick={() => void generateOwnerFirstProblematic()} disabled={loading} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#173F4D] font-inter text-xs font-semibold text-white disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-white" />}
            Générer une problématique
          </button>
          <div className="mt-3 rounded-xl bg-[#173F4D]/10 p-3 font-inter text-[10px] leading-[1.6] text-[#173F4D]">
            Les projets de test peuvent être rédigés et exportés sans paiement.
          </div>
        </aside>
      )}

      {ownerRoute && !ownerSessionValid && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#173F4D] px-5">
          <form onSubmit={(event) => { event.preventDefault(); void handleOwnerLogin(); }} className="w-full max-w-md rounded-[26px] bg-white p-7 text-[#173F4D] shadow-2xl">
            <BrandLogo className="mx-auto h-16 w-16" />
            <div className="mt-4 text-center font-inter text-[10px] font-semibold uppercase tracking-[0.2em] text-[#173F4D]">Accès privé</div>
            <h1 className="mt-2 text-center font-playfair text-3xl text-[#173F4D]">Espace propriétaire</h1>
            <p className="mt-3 text-center font-inter text-sm leading-[1.7] text-[#5E6B73]">Accédez aux tests de Trimémo sans paiement réel.</p>
            <label htmlFor="owner-email" className="mt-6 block font-inter text-xs font-semibold text-[#5E6B73]">E-mail</label>
            <input id="owner-email" type="email" required autoComplete="username" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#173F4D]/20 bg-white px-4 font-inter text-sm text-[#173F4D] caret-[#173F4D] outline-none focus:border-[#173F4D] focus:ring-2 focus:ring-[#173F4D]/10" />
            <label htmlFor="owner-password" className="mt-4 block font-inter text-xs font-semibold text-[#5E6B73]">Mot de passe</label>
            <div className="relative mt-2">
              <input
                id="owner-password"
                type={showOwnerPassword ? "text" : "password"}
                required
                value={ownerPassword}
                onChange={(event) => setOwnerPassword(event.target.value)}
                autoComplete="current-password"
                className="h-11 w-full rounded-xl border border-[#173F4D]/20 bg-white px-4 pr-12 font-inter text-sm text-[#173F4D] caret-[#173F4D] outline-none transition focus:border-[#173F4D] focus:ring-2 focus:ring-[#173F4D]/10"
              />
              <button
                type="button"
                onClick={() => setShowOwnerPassword((visible) => !visible)}
                aria-label={showOwnerPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                aria-pressed={showOwnerPassword}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-[#5E6B73] transition hover:underline hover:decoration-[#173F4D] hover:underline-offset-4 focus:outline-none focus:ring-2 focus:ring-[#173F4D]"
              >
                {showOwnerPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {ownerLoginError && <div className="mt-3 rounded-xl bg-[#B42318]/10 p-3 font-inter text-xs text-[#B42318]">{ownerLoginError}</div>}
            <button type="submit" disabled={ownerBusy} className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[#173F4D] font-inter text-sm font-semibold text-white disabled:opacity-50">
              {ownerBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Se connecter"}
            </button>
            <button type="button" onClick={() => { window.location.href = "/"; }} className="mt-3 w-full font-inter text-xs text-[#5E6B73]">Retour à la plateforme</button>
          </form>
        </div>
      )}

      {view !== "dashboard" && (<>
      <header className={`studio-site-header sticky top-0 z-50 border-b border-white/15 bg-[#173F4D] backdrop-blur-xl ${view === "home" ? "studio-header--home" : ""}`}>
        {view !== "home" ? (
          <div className="mx-auto flex min-h-[72px] max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <BrandLogo className="h-12 w-12" light />
              <span className="studio-brand-wordmark font-playfair text-xl font-semibold tracking-tight text-white sm:text-2xl">Trimémo</span>
            </div>
            <div className="flex items-center gap-2">
            {view !== "account" && <button type="button" onClick={() => setMobileMenuOpen(value => !value)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white md:hidden" aria-label={mobileMenuOpen ? "Fermer la navigation du projet" : "Ouvrir la navigation du projet"} aria-expanded={mobileMenuOpen}>{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>}
            <button type="button" onClick={() => { setMobileMenuOpen(false); if (view === "account") { setView("home"); } else { setClientProjectFlow(false); setView("dashboard"); void loadClientProjects(); } }} className="rounded-full border border-white/25 px-4 py-2 text-center font-inter text-xs font-semibold text-white hover:bg-white/10">
              {view === "account" ? "Retour à l’accueil" : "Tableau de bord"}
            </button>
            {view !== "account" && <button type="button" disabled={clientLogoutBusy || loading} onClick={() => void logoutClient()} className="rounded-full border border-white/25 px-3 py-2 text-center font-inter text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-60 sm:px-4">{clientLogoutBusy ? "Sauvegarde…" : "Déconnexion"}</button>}
            </div>
          </div>
        ) : (
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 lg:px-8">
          <button onClick={() => setView("home")} className="flex items-center gap-3" aria-label="Retour à l’accueil">
            <BrandLogo className="h-11 w-11 sm:h-12 sm:w-12" light />
            <span className="studio-brand-wordmark font-playfair text-xl font-semibold tracking-tight text-white sm:text-2xl">Trimémo</span>
          </button>
          <div className="hidden items-center gap-6 font-inter text-sm text-white lg:flex xl:gap-8">
            <button className="text-white hover:underline hover:decoration-[#173F4D] hover:underline-offset-4" onClick={() => navigateToSection("fonctionnement")}>{view === "home" ? "Comment ça marche" : "Fonctionnement"}</button>
            <button className="text-white hover:underline hover:decoration-[#173F4D] hover:underline-offset-4" onClick={() => navigateToSection("revision-humaine")}>Révision humaine</button>
            <button className="text-white hover:underline" onClick={() => { ambassadorOrigin.current = "home"; setView("ambassadors"); }}>Ambassadeurs</button>
            {view !== "home" && <button
              onClick={() => {
                setMobileMenuOpen(false);
                setView("dashboard");
                void loadClientProjects();
              }}
            >
              <span className="text-white hover:underline hover:decoration-[#173F4D] hover:underline-offset-4">Mon projet</span>
            </button>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white lg:hidden"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <button
              onClick={() => { setMobileMenuOpen(false); setView("dashboard"); void loadClientProjects(); }}
              className="hidden rounded-full border border-white/25 px-4 py-2 font-inter text-[12px] text-white lg:inline-flex"
            >
              {view === "home" ? "Se connecter" : "Mon compte"}
            </button>
            {view === "home" && <button onClick={() => { authIntent.current = "dashboard"; setClientAuthMode("signup"); setClientAuthError(""); setClientAuthNotice(""); setView("account"); }} className="hidden rounded-lg border border-white px-4 py-2 font-inter text-sm font-semibold text-white lg:inline-flex">Créer un compte</button>}
            <button
              onClick={goToProject}
              className="studio-primary-nav-action hidden h-10 items-center gap-2 rounded-full bg-white px-5 font-inter text-[13px] font-semibold text-[#173F4D] sm:inline-flex"
            >
              Commencer <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        )}
      </header>

      {view !== "account" && mobileMenuOpen && (
        <div className={`studio-mobile-menu sticky top-[72px] z-40 border-b border-[#C6A477]/50 bg-[#173F4D] px-6 py-4 shadow-sm lg:hidden`}>
          <div className="flex flex-col gap-1 font-inter text-sm text-white">
            {view === "home" && <><button onClick={() => navigateToSection("fonctionnement")} className="rounded-xl px-4 py-3 text-left hover:bg-white/10">Fonctionnement</button>
            <button onClick={() => navigateToSection("revision-humaine")} className="rounded-xl px-4 py-3 text-left hover:bg-white/10">Révision humaine</button>
            <button onClick={() => {setMobileMenuOpen(false);ambassadorOrigin.current="home";setView("ambassadors");}} className="rounded-xl px-4 py-3 text-left hover:bg-white/10">Devenir ambassadeur</button>
            <button onClick={() => { setMobileMenuOpen(false); setView("dashboard"); void loadClientProjects(); }} className="rounded-xl px-4 py-3 text-left hover:bg-white/10">Mon projet</button>
            <button onClick={() => { setMobileMenuOpen(false); setView("dashboard"); void loadClientProjects(); }} className="rounded-xl px-4 py-3 text-left hover:bg-white/10">Mon compte client</button>
            <button onClick={() => { setMobileMenuOpen(false); authIntent.current = "dashboard"; setClientAuthMode("signup"); setView("account"); }} className="rounded-xl px-4 py-3 text-left hover:bg-white/10">Créer un compte</button></>}
            {view === "preview" && preview && canViewClientPreview && (
              <>
                <div className="mt-2 border-t border-white/10 pt-2 text-[10px] uppercase tracking-[0.18em] text-[#E8D3AC]">Aperçu</div>
                {(["problematic","plan","introduction"] as const).map((tab) => (
                  <button key={tab} onClick={() => { setMobileMenuOpen(false); setPreviewTab(tab); }} className="rounded-xl px-4 py-2 text-left hover:bg-white/10">
                    {tab === "problematic" ? "Problématique" : tab === "plan" ? "Plan" : "Introduction"}
                  </button>
                ))}
              </>
            )}
            {view === "premium" && premium && (
              <>
                <div className="mt-2 border-t border-white/10 pt-2 text-[10px] uppercase tracking-[0.18em] text-[#E8D3AC]">Problématiques</div>
                {premium.problematics.map((item,index) => (
                  <button key={item.id} onClick={() => { setMobileMenuOpen(false); setPremiumSection("problematic"); setPremiumNav("problematic-"+index); setSelectedProblematic(item); }} className="rounded-xl px-4 py-2 text-left hover:bg-white/10">Problématique {index+1}</button>
                ))}
                <div className="mt-2 border-t border-white/10 pt-2 text-[10px] uppercase tracking-[0.18em] text-[#E8D3AC]">Plans</div>
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
        <section className="studio-auth bg-gradient-to-b from-[#F7F5EF] via-white to-[#F7F5EF] px-4 py-6 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-xl rounded-3xl border border-[#173F4D]/10 bg-white p-5 shadow-sm sm:p-7">
            {authIntent.current === "ambassador" && <p className="text-sm font-medium text-[#5E6B73]">Programme Ambassadeurs Trimémo</p>}
            <h1 className="mt-3 font-playfair text-3xl font-bold text-[#173F4D]">{clientAuthMode === "signup" ? "Créez votre compte" : clientAuthMode === "login" ? "Connectez-vous" : clientAuthMode === "forgot" ? "Mot de passe oublié" : "Choisissez un nouveau mot de passe"}</h1>
            <p className="mt-3 font-inter text-sm leading-6 text-[#5E6B73]">{clientAuthMode === "signup" ? authIntent.current === "ambassador" ? "Si vous avez déjà un compte Trimémo, connectez-vous plutôt : un seul compte suffit pour participer au programme." : "Créez votre compte avec votre prénom, votre nom, votre adresse e-mail et un mot de passe. Votre projet sera enregistré avant l’ouverture du paiement." : clientAuthMode === "login" ? "Connectez-vous pour retrouver vos projets et poursuivre votre travail." : clientAuthMode === "forgot" ? "Saisissez l’adresse e-mail associée à votre compte. Si un compte correspond, vous recevrez un lien de réinitialisation." : "Saisissez un nouveau mot de passe d’au moins 8 caractères."}</p>
            <form className="mt-5 space-y-3" onSubmit={(event) => { event.preventDefault(); void submitClientAuth(); }}>
              {clientAuthMode === "signup" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block font-inter text-sm font-medium text-[#173F4D]">Prénom
                    <input type="text" required autoComplete="given-name" value={clientFirstName} onChange={(event) => setClientFirstName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#173F4D]/15 px-4 py-3 font-normal outline-none focus:border-[#173F4D]" placeholder="Votre prénom" />
                  </label>
                  <label className="block font-inter text-sm font-medium text-[#173F4D]">Nom
                    <input type="text" required autoComplete="family-name" value={clientLastName} onChange={(event) => setClientLastName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#173F4D]/15 px-4 py-3 font-normal outline-none focus:border-[#173F4D]" placeholder="Votre nom" />
                  </label>
                </div>
              )}
              {clientAuthMode !== "reset" && <label className="block font-inter text-sm font-medium text-[#173F4D]">Adresse e-mail
              <input type="email" required autoComplete="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-[#173F4D]/15 px-4 py-3 font-normal outline-none focus:border-[#173F4D]" placeholder="vous@exemple.com" />
              </label>}
              {clientAuthMode !== "forgot" && <label className="block font-inter text-sm font-medium text-[#173F4D]">{clientAuthMode === "reset" ? "Nouveau mot de passe" : "Mot de passe"}
                <input type="password" required minLength={8} autoComplete={clientAuthMode === "signup" || clientAuthMode === "reset" ? "new-password" : "current-password"} value={clientPassword} onChange={(event) => setClientPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-[#173F4D]/15 px-4 py-3 font-normal outline-none focus:border-[#173F4D]" placeholder="8 caractères minimum" />
              </label>}
              {clientAuthError && <div role="alert" className="rounded-xl bg-[#B42318]/10 p-3 font-inter text-sm text-[#B42318]">{clientAuthError}</div>}
              {clientAuthNotice && <div role="status" className="rounded-xl bg-[#173F4D]/10 p-3 font-inter text-sm text-[#173F4D]">{clientAuthNotice}</div>}
              <button type="submit" disabled={clientAuthBusy || (clientAuthMode === "reset" && !clientRecoveryToken)} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#173F4D] px-5 py-3 font-inter text-sm font-semibold text-white disabled:opacity-60">
                {clientAuthBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : clientAuthMode === "signup" ? (authIntent.current === "ambassador" ? "Créer mon compte" : "Créer mon compte et continuer") : clientAuthMode === "login" ? "Se connecter" : clientAuthMode === "forgot" ? "Envoyer le lien de réinitialisation" : "Modifier mon mot de passe"}
              </button>
              {clientAuthMode === "reset" && !clientRecoveryToken && <p className="font-inter text-sm text-[#173F4D]">Ce lien est invalide ou incomplet. Demandez un nouveau lien de réinitialisation.</p>}
            </form>
            {clientAuthMode === "login" && <button type="button" onClick={() => { setClientAuthMode("forgot"); setClientAuthError(""); setClientAuthNotice(""); }} className="mt-5 w-full font-inter text-sm text-[#173F4D]">Mot de passe oublié ?</button>}
            {clientAuthMode === "login" && showConfirmationResend && <button type="button" disabled={clientAuthBusy} onClick={() => void resendClientConfirmation()} className="mt-4 w-full font-inter text-sm text-[#173F4D] disabled:opacity-60">Renvoyer le lien de confirmation</button>}
            {clientAuthMode !== "reset" && <button type="button" onClick={() => { setClientAuthMode(clientAuthMode === "signup" ? "login" : clientAuthMode === "login" ? "signup" : "login"); setClientAuthError(""); setClientAuthNotice(""); }} className="mt-5 w-full font-inter text-sm text-[#173F4D]">
              {clientAuthMode === "signup" ? "J’ai déjà un compte : me connecter" : clientAuthMode === "login" ? "Je n’ai pas encore de compte : m’inscrire" : "Retour à la connexion"}
            </button>}
            <button type="button" onClick={() => { setPendingPaymentMethod(null); setClientAuthError(""); setClientAuthNotice(""); setView("home"); }} className="mt-4 w-full font-inter text-xs text-[#5E6B73]">Retour à l’accueil</button>
          </div>
        </section>
      )}

            </>)}

      {view === "dashboard" && (
        <section className="studio-dashboard bg-[#F7F5EF] px-4 py-5 sm:px-6 sm:py-7">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl bg-[#173F4D] p-5 text-white shadow-[0_18px_40px_-26px_rgba(23,63,77,0.5)] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><h1 className="font-playfair text-3xl font-bold text-white sm:text-4xl">Mon tableau de bord</h1><p className="mt-2 font-inter text-sm text-white/90">{clientNameDisplay && clientNameDisplay !== "Mon compte" ? `Bienvenue, ${clientNameDisplay}. Retrouvez vos projets et suivez leur avancement.` : "Retrouvez vos projets et suivez leur avancement."}</p></div>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => { ambassadorOrigin.current = "dashboard"; setMobileMenuOpen(false); setView("ambassadors"); }} className="rounded-full bg-white px-5 py-3 font-inter text-sm font-semibold text-[#173F4D] shadow-sm hover:bg-[#F7F5EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Devenir ambassadeur</button>
                  <button type="button" disabled={clientLogoutBusy || loading} onClick={() => void logoutClient()} className="rounded-full border border-white/30 px-5 py-3 font-inter text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60">{clientLogoutBusy ? "Sauvegarde…" : "Déconnexion"}</button>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#173F4D]/20 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <h2 className="font-inter text-base font-bold text-[#173F4D]">Besoin d’aide ?</h2>
                <p className="mt-1 font-inter text-sm text-[#5E6B73]">Une question sur votre projet, votre paiement ou votre document ? Contactez-nous directement.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <a href="https://wa.me/447418359309" target="_blank" rel="noopener noreferrer" aria-label="Contacter Trimémo sur WhatsApp" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#173F4D] px-5 py-2.5 font-inter text-sm font-semibold text-white hover:bg-[#173F4D]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173F4D]">Contacter sur WhatsApp</a>
                <a href="mailto:redacmemo78@gmail.com?subject=Assistance%20Trim%C3%A9mo" aria-label="Envoyer un e-mail à Trimémo" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#173F4D] bg-white px-5 py-2.5 font-inter text-sm font-semibold text-[#173F4D] hover:bg-[#173F4D]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173F4D]">Envoyer un e-mail</a>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <button type="button" onClick={() => setClientDashboardTab("documents")} className={`rounded-2xl border border-[#173F4D]/20 bg-white p-4 text-left shadow-sm hover:bg-[#173F4D]/20 sm:p-5 ${clientDashboardTab==="documents"?"ring-2 ring-[#173F4D] ring-offset-2":""}`}><span className="block font-inter text-xs font-semibold text-[#173F4D] sm:text-sm">Mes projets</span><span className="mt-2 block font-playfair text-3xl font-bold text-[#173F4D]">{clientProjects.length}</span><span className="mt-1 block font-inter text-[11px] text-[#5E6B73]">Projets enregistrés</span></button>
              <button type="button" onClick={() => setClientDashboardTab("in_progress")} className={`rounded-2xl border border-[#173F4D]/20 bg-[#173F4D]/10 p-4 text-left shadow-sm hover:bg-[#173F4D]/20 sm:p-5 ${clientDashboardTab==="in_progress"?"ring-2 ring-[#173F4D] ring-offset-2":""}`}><span className="block font-inter text-xs font-semibold text-[#173F4D] sm:text-sm">Révisions en cours</span><span className="mt-2 block font-playfair text-3xl font-bold text-[#173F4D]">{clientRevisions.filter((r:any)=>r.status==="in_progress").length}</span><span className="mt-1 block font-inter text-[11px] text-[#5E6B73]">Traitement en cours</span></button>
              <button type="button" onClick={() => setClientDashboardTab("pending")} className={`rounded-2xl border border-[#173F4D]/20 bg-[#173F4D]/10 p-4 text-left shadow-sm hover:bg-[#173F4D]/20 sm:p-5 ${clientDashboardTab==="pending"?"ring-2 ring-[#173F4D] ring-offset-2":""}`}><span className="block font-inter text-xs font-semibold text-[#173F4D] sm:text-sm">Révisions en attente</span><span className="mt-2 block font-playfair text-3xl font-bold text-[#173F4D]">{clientRevisions.filter((r:any)=>["pending","requested","submitted"].includes(String(r.status||"").toLowerCase())).length}</span><span className="mt-1 block font-inter text-[11px] text-[#5E6B73]">À traiter</span></button>
              <button type="button" onClick={() => setClientDashboardTab("completed")} className={`rounded-2xl border border-[#173F4D]/20 bg-[#173F4D]/10 p-4 text-left shadow-sm hover:bg-[#173F4D]/20 sm:p-5 ${clientDashboardTab==="completed"?"ring-2 ring-[#173F4D] ring-offset-2":""}`}><span className="block font-inter text-xs font-semibold text-[#173F4D] sm:text-sm">Révisions terminées</span><span className="mt-2 block font-playfair text-3xl font-bold text-[#173F4D]">{clientRevisions.filter((r:any)=>r.status==="completed").length}</span><span className="mt-1 block font-inter text-[11px] text-[#5E6B73]">Documents livrés</span></button>
            </div>
            <div className="mt-6 rounded-3xl border border-[#173F4D]/20 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-playfair text-2xl font-bold text-[#173F4D]">{clientDashboardTab==="documents"?"Mes projets et documents":clientDashboardTab==="in_progress"?"Demandes de révision en cours":clientDashboardTab==="pending"?"Demandes de révision en attente":"Révisions terminées et livrées"}</h2><p className="mt-1 font-inter text-sm text-[#5E6B73]">{clientDashboardTab==="documents"?"Retrouvez vos projets et poursuivez votre rédaction.":"Suivez l'avancement et récupérez les documents corrigés."}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={()=>{setClientDashboardTab("documents");void loadClientProjects();}} className="rounded-full border border-[#173F4D]/15 px-4 py-2 font-inter text-xs font-semibold text-[#173F4D] hover:bg-[#173F4D]/20">Actualiser</button><button type="button" onClick={startNewClientProject} className="rounded-full bg-[#173F4D] px-4 py-2 font-inter text-xs font-semibold text-white">Nouveau projet</button>
              {clientDashboardTab === "documents" && (localDraftKeys.length > 0 || Boolean(project.sujet?.trim())) && (
                <details className="group relative">
                  <summary aria-label="Options de sauvegarde" title="Options de sauvegarde" className="flex h-9 w-9 list-none cursor-pointer items-center justify-center rounded-full border border-[#173F4D]/15 bg-white text-[#173F4D] hover:border-[#C6A477] hover:bg-[#F7F5EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C6A477] [&::-webkit-details-marker]:hidden">
                    <MoreHorizontal className="h-5 w-5" aria-hidden="true"/>
                    <span className="sr-only">Options de sauvegarde</span>
                  </summary>
                  <div className="absolute right-0 top-full z-30 mt-2 w-[min(300px,calc(100vw-3rem))] rounded-2xl border border-[#E6E1D8] bg-white p-3 shadow-xl">
                    <p className="border-b border-[#E6E1D8] px-3 pb-2 font-inter text-xs font-semibold text-[#173F4D]">Options de sauvegarde</p>
                    <div className="mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto">
                      {Boolean(project.sujet?.trim()) && (
                        <button type="button" onClick={() => { try { archiveCurrentDraft(); pushToast("success", "Une copie de votre projet a été conservée."); } catch { pushToast("error", "Impossible d’enregistrer une copie. Vérifiez l’espace disponible."); } }} className="rounded-lg px-3 py-2.5 text-left font-inter text-xs font-medium text-[#173F4D] hover:bg-[#F7F5EF]">Conserver une copie du projet</button>
                      )}
                      {localDraftKeys.map((key,index) => (
                        <button key={key} type="button" disabled={loading} onClick={() => void recoverLocalDraft(key)} className="rounded-lg px-3 py-2.5 text-left font-inter text-xs font-medium text-[#173F4D] hover:bg-[#F7F5EF] disabled:opacity-50">Reprendre un brouillon {index + 1}</button>
                      ))}
                    </div>
                  </div>
                </details>
              )}
              </div></div>
              {clientDashboardTab==="documents"?<div className="mt-5 grid gap-4">{clientProjects.length?clientProjects.map((item)=><article key={item.project_id} className="flex flex-col gap-4 rounded-2xl border border-[#173F4D]/20 bg-white p-5 shadow-sm transition hover:border-[#173F4D] hover:shadow-md sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={()=>{void openClientProject(item.project_id);}} className="min-w-0 flex-1 text-left"><span className="block font-playfair text-xl font-semibold text-[#173F4D]">{item.subject||"Projet académique"}</span><span className="mt-2 block font-inter text-xs text-[#5E6B73]">Dernière mise à jour : {item.updated_at?new Date(item.updated_at).toLocaleString("fr-FR"):"Non disponible"}</span><span className="mt-2 inline-block rounded-full bg-[#173F4D]/10 px-3 py-2 font-inter text-xs font-semibold text-[#173F4D]">{String(item.payment_status||"").trim().toLowerCase()==="paid"?"Paiement confirmé":"Paiement non confirmé"}</span></button><button type="button" disabled={loading} onClick={()=>void openHumanRevisionForProject(item)} className="rounded-full border border-[#173F4D]/20 px-4 py-3 font-inter text-xs font-semibold text-[#173F4D] hover:border-[#173F4D] hover:bg-[#173F4D]/20 disabled:opacity-50">{String(item.payment_status||"").trim().toLowerCase()==="paid"?"Demander une révision humaine":"Révision après rédaction et paiement"}</button></article>):<div className="rounded-2xl border border-dashed border-[#173F4D]/20 bg-white p-8 font-inter text-sm text-[#5E6B73]">Aucun projet enregistré pour le moment.</div>}</div>:<div className="mt-5 grid gap-3">{clientRevisions.filter((r:any)=>clientDashboardTab==="in_progress"?r.status==="in_progress":clientDashboardTab==="pending"?["pending","requested","submitted"].includes(String(r.status||"").toLowerCase()):r.status==="completed").length?clientRevisions.filter((r:any)=>clientDashboardTab==="in_progress"?r.status==="in_progress":clientDashboardTab==="pending"?["pending","requested","submitted"].includes(String(r.status||"").toLowerCase()):r.status==="completed").map((revision:any)=><article key={revision.id} className={`rounded-2xl border p-4 sm:p-5 ${revision.status==="completed"?"border-[#173F4D]/20 bg-[#173F4D]/10":revision.status==="in_progress"?"border-[#173F4D]/20 bg-[#173F4D]/10":"border-[#173F4D]/20 bg-[#173F4D]/10"}`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-playfair text-lg font-bold text-[#173F4D]">{revision.document_title}</h3><p className="mt-1 font-inter text-xs text-[#5E6B73]">{revision.created_at?new Date(revision.created_at).toLocaleString("fr-FR"):""} · {revision.status==="completed"?"Terminée":revision.status==="in_progress"?"En cours":"En attente"}</p></div>{revision.status==="completed"&&<button type="button" onClick={()=>void downloadClientRevision(String(revision.id))} className="rounded-full bg-[#173F4D] px-4 py-2 font-inter text-xs font-semibold text-white">Télécharger le document corrigé</button>}</div></article>):<p className="rounded-xl bg-white p-5 font-inter text-sm text-[#5E6B73]">Aucune demande dans cette catégorie pour le moment.</p>}</div>}
            </div>
            {revisionModalOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#173F4D]/60 p-4" role="dialog" aria-modal="true" aria-labelledby="revision-modal-title"><form onSubmit={submitHumanRevision} className="max-h-[90vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8"><div className="flex items-start justify-between gap-4"><div><p className="font-inter text-[10px] font-bold uppercase tracking-[0.2em] text-[#173F4D]">Assistance humaine</p><h2 id="revision-modal-title" className="mt-2 font-playfair text-2xl font-bold text-[#173F4D]">Demande de révision</h2><p className="mt-2 font-inter text-sm text-[#5E6B73]">Document sélectionné : {revisionTargetTitle}</p></div><button type="button" onClick={()=>setRevisionModalOpen(false)} className="rounded-full border px-3 py-1 text-[#5E6B73]" aria-label="Fermer">✕</button></div><div className="grid gap-4 sm:grid-cols-2"><label className="block font-inter text-sm font-semibold text-[#173F4D]">Niveau de révision<select value={revisionTier} onChange={e=>{const tier=e.target.value as "essential"|"standard"|"deep";setRevisionTier(tier);if(revisionFile)void calculateHumanRevisionQuote(revisionFile,tier);}} className="mt-2 w-full rounded-xl border border-[#173F4D]/20 bg-white p-3 text-sm font-normal"><option value="essential">Correction essentielle</option><option value="standard">Révision standard</option><option value="deep">Révision approfondie</option></select><span className="mt-1 block text-xs font-normal text-[#5E6B73]">{revisionTier==="essential"?"Orthographe, grammaire, ponctuation et typographie.":revisionTier==="standard"?"Correction essentielle, reformulation, fluidité et réduction des répétitions.":"Révision standard, restructuration ciblée et contrôle de cohérence méthodologique."}</span></label><div className="rounded-xl border border-[#173F4D]/20 bg-white p-4"><div className="font-inter text-sm font-semibold text-[#173F4D]">Estimation de votre révision</div>{revisionQuoteLoading?<p className="mt-2 text-sm text-[#5E6B73]">Analyse du document et calcul du devis…</p>:revisionQuote?<div className="mt-3 grid gap-2 text-sm text-[#173F4D]"><div className="flex justify-between gap-3"><span>Nombre de pages estimé</span><strong>{revisionPages}</strong></div><div className="flex justify-between gap-3"><span>Tarif par page</span><strong>{revisionQuote.unitPrice.toLocaleString("fr-FR")} {revisionQuote.currency}</strong></div><div className="flex justify-between gap-3 border-t border-[#173F4D]/20 pt-2"><span>Coût estimé</span><strong className="text-lg text-[#173F4D]">{revisionQuote.estimatedAmount.toLocaleString("fr-FR")} {revisionQuote.currency}</strong></div><div className="flex justify-between gap-3"><span>Délai de livraison estimé</span><strong>{revisionQuote.deliveryLabel}</strong></div></div>:<p className="mt-2 text-sm text-[#5E6B73]">Joignez votre document Word pour afficher le volume, le tarif et le délai de livraison.</p>}</div></div><label className="block font-inter text-sm font-semibold text-[#173F4D]">Corrections demandées<textarea required minLength={10} value={revisionInstructions} onChange={e=>setRevisionInstructions(e.target.value)} rows={5} placeholder="Précisez les passages à corriger et les consignes à respecter…" className="mt-2 w-full rounded-xl border border-[#173F4D]/20 p-3 text-sm font-normal outline-none focus:border-[#173F4D]"/></label><div className="rounded-xl border border-[#173F4D]/20 bg-white p-3 text-sm text-[#5E6B73]"><label className="block font-inter text-sm font-semibold text-[#173F4D]">Document Word exporté depuis Trimémo<input type="file" required accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e=>{const file=e.target.files?.[0]||null;setRevisionFile(file);setRevisionQuote(null);setRevisionPages(0);if(file)void calculateHumanRevisionQuote(file,revisionTier);else setRevisionError("");}} className="mt-2 block w-full rounded-xl border border-[#173F4D]/20 bg-white p-3 text-sm font-normal file:mr-3 file:rounded-full file:border-0 file:bg-[#173F4D]/10 file:px-3 file:py-2 file:text-xs file:font-semibold"/></label><span className="mt-2 block text-xs">Exportez d’abord le document Word final depuis votre projet, puis joignez-le ici. Format accepté : .docx. Taille maximale : 3 Mo.</span>{revisionFile&&<span className="mt-2 block text-xs font-semibold text-[#173F4D]">Fichier sélectionné : {revisionFile.name}</span>}</div>{revisionError&&<p role="alert" className="rounded-xl bg-[#173F4D]/15 p-3 text-sm text-[#173F4D]">{revisionError}</p>}{revisionMessage&&<p role="status" className="rounded-xl bg-[#173F4D]/10 p-3 text-sm text-white">{revisionMessage}</p>}<div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={()=>setRevisionModalOpen(false)} className="rounded-full border px-5 py-3 text-sm">Annuler</button><button type="submit" disabled={revisionSubmitting} className="rounded-full bg-[#173F4D] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{revisionSubmitting?"Envoi en cours…":"Envoyer la demande"}</button></div></form></div>}
          </div>
        </section>
      )}
      {view !== "dashboard" && (<>
      {view === "ambassadors" && <AmbassadorProgram backLabel={ambassadorOrigin.current === "dashboard" ? "Retour au tableau de bord" : "Retour à l’accueil"} onBack={() => { const origin = ambassadorOrigin.current; ambassadorOrigin.current = "home"; setView(origin); if (origin === "dashboard") void loadClientProjects(); }} onLogin={() => { authIntent.current="ambassador"; window.sessionStorage.setItem("trimemo_auth_intent","ambassador"); setClientAuthMode("login"); setClientAuthError(""); setClientAuthNotice(""); setView("account"); }} onSignup={() => { authIntent.current="ambassador"; window.sessionStorage.setItem("trimemo_auth_intent","ambassador"); setClientAuthMode("signup"); setClientAuthError(""); setClientAuthNotice(""); setView("account"); }} />}
      {view === "home" && (
        <>
          <MarketingHome onStart={goToProject} onRevision={() => { setClientDashboardTab("documents"); setView("dashboard"); void loadClientProjects(); }} onAmbassadors={() => { ambassadorOrigin.current = "home"; setView("ambassadors"); window.scrollTo({top:0,behavior:"smooth"}); }} />

        </>
      )}

      {(view === "project" || view === "estimate" || view === "preview" || view === "premium" || view === "writing") && (
        <main className={`studio-workspace min-h-[calc(100vh-72px)] bg-[#F7F5EF] px-4 py-5 sm:px-6 lg:px-8 lg:py-6 ${view === "writing" ? "h-[calc(100vh-72px)] overflow-y-auto overscroll-contain" : ""}`}>
          <div className="mx-auto max-w-[1220px]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                {(
                  <button
                    onClick={() => { setClientProjectFlow(false); setView("dashboard"); void loadClientProjects(); }}
                    className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#173F4D]/10 bg-white"
                    aria-label="Retour au tableau de bord"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </button>
                )}
                <div>
                <h2 className="mt-1 font-playfair text-2xl sm:text-3xl">{view === "project" ? "Définissez votre demande" : view === "estimate" ? "Analyse du projet · Estimation du coût" : view === "preview" ? "Votre aperçu avant paiement" : view === "premium" ? "Vos options premium" : selectedPlan && selectedProblematic ? "Rédaction" : ""}</h2>
              </div>
              
            </div>

            {generationError && view === "project" && (
              <div className="mb-5 rounded-2xl border border-[#B42318]/30 bg-[#B42318]/10 p-4 font-inter text-sm leading-6 text-[#173F4D]">
                <strong>Une difficulté est survenue :</strong> {generationError}
              </div>
            )}

              {view === "estimate" && estimate && (
              <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <article className="rounded-[24px] border border-[#173F4D]/10 bg-white p-5 lg:p-7">
                  <h3 className="mt-3 font-playfair text-3xl text-[#173F4D]">Estimation du coût</h3>
                  <p className="mt-4 font-inter text-sm leading-[1.8] text-[#5E6B73]">Trimémo a analysé le sujet, le niveau, les consignes et les documents fournis. Le montant est provisoire et couvre le service automatisé prévu pour le projet, y compris les propositions, les améliorations, les contrôles automatiques et l’aperçu avant paiement. La correction humaine est une prestation distincte, non comprise dans ce prix.</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#173F4D]/10 p-4"><div className="font-inter text-xs text-[#5E6B73]">Type de document</div><div className="mt-1 font-inter text-sm font-semibold text-[#173F4D]">{project.typeDoc}</div></div>
                    <div className="rounded-2xl bg-[#173F4D]/10 p-4"><div className="font-inter text-xs text-[#5E6B73]">Niveau académique</div><div className="mt-1 font-inter text-sm font-semibold text-[#173F4D]">{project.niveau}</div></div>
                    <div className="rounded-2xl bg-[#173F4D]/10 p-4"><div className="font-inter text-xs text-[#5E6B73]">Volume demandé</div><div className="mt-1 font-inter text-sm font-semibold text-[#173F4D]">{estimate.pages} pages · {(estimate.pages * estimate.wordsPerPage).toLocaleString("fr-FR")} mots</div></div>
                    <div className="rounded-2xl bg-[#173F4D]/10 p-4"><div className="font-inter text-xs text-[#5E6B73]">Complexité détectée</div><div className="mt-1 font-inter text-sm font-semibold capitalize text-[#173F4D]">{estimate.complexity === "elevee" ? "Élevée" : estimate.complexity}</div></div>
                  </div>
                  <div className="mt-6 rounded-2xl border border-[#173F4D]/10 p-5">
                    <div className="font-inter text-xs font-semibold uppercase tracking-wide text-[#5E6B73]">Critères pris en compte</div>
                    <ul className="mt-3 space-y-2 font-inter text-sm leading-[1.7] text-[#5E6B73]">
                      {(estimate.detectedRequirements || []).map((item, index) => <li key={index}>• {item}</li>)}
                      {(estimate.reasons || []).map((item, index) => <li key={"reason-"+index}>• {item}</li>)}
                    </ul>
                  </div>
                  {!estimate.countryDetected && <p className="mt-4 rounded-xl bg-[#173F4D]/10 p-3 font-inter text-xs leading-[1.6] text-[#173F4D]">Le pays n'a pas pu être détecté automatiquement. Le prix utilise provisoirement le marché international. Vérifiez le pays avant le paiement si ce tarif ne correspond pas à votre situation.</p>}
                </article>
                <aside className="h-fit rounded-[24px] bg-[#173F4D] p-7 text-white lg:sticky lg:top-[98px]">
                  <div className="font-inter text-[11px] uppercase tracking-[0.18em] text-white">{estimate.marketLabel}</div>
                  <div className="mt-5 font-inter text-xs text-white/90">Coût approximatif du projet</div>
                  <div className="mt-2 font-playfair text-4xl">{estimate.formattedAmount} {estimate.currency === "XOF" ? "FCFA" : estimate.currency === "EUR" ? "€" : estimate.currency === "CAD" ? "CA$" : estimate.currency === "CHF" ? "CHF" : estimate.currency === "USD" ? "US$" : estimate.currency}</div>
                  <div className="mt-3 font-inter text-xs leading-[1.7] text-white/90">Tarif de base {estimate.baseRate} {estimate.currency === "XOF" ? "FCFA" : estimate.currency === "EUR" ? "€" : estimate.currency === "CAD" ? "CA$" : estimate.currency === "CHF" ? "CHF" : estimate.currency === "USD" ? "US$" : estimate.currency} par page × coefficient de niveau {estimate.levelCoefficient} × coefficient de complexité {estimate.complexityCoefficient}.</div>
                  <div className="mt-3 font-inter text-xs leading-[1.6] text-white/85">Les prix sont exprimés dans la devise du marché Trimémo applicable, qui peut différer de votre monnaie locale. La devise effectivement débitée est précisée avant la confirmation du paiement.</div>
                  {estimate.currency === "XOF" && <div className="mt-3 rounded-xl bg-white/10 p-3 font-inter text-xs leading-[1.6] text-white/90">Si vous payez par PayPal, le montant sera converti en euros selon la parité fixe FCFA/euro : environ {estimate.checkoutAmount} €.</div>}
                  <div className="mt-5 rounded-xl border border-white/15 p-3 font-inter text-xs leading-[1.7] text-white/90">Le montant affiché couvre le document complet. Les mots de l’aperçu sont inclus dans ce prix global : ils ne sont pas gratuits et ne seront pas facturés une seconde fois.</div>
                  <button onClick={() => void generatePublicProblematics()} disabled={loading} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white font-inter text-sm font-semibold text-[#173F4D] disabled:opacity-50">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Commencer les problématiques
                  </button>
                  <button onClick={() => void reviseProjectInputs()} className="mt-3 w-full rounded-full border border-white/20 px-4 py-3 font-inter text-xs font-semibold text-white">Modifier les informations</button>
                </aside>
              </section>
            )}



          {view === "project" && (
              <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
                <section className="rounded-[24px] border border-[#173F4D]/5 bg-white p-7 lg:p-9">
                  <div className="grid gap-6">
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#5E6B73]">Sujet exact *</label>
                      <textarea value={project.sujet} onChange={(e) => setProject({ ...project, sujet: e.target.value })} className="mt-2 min-h-[110px] w-full rounded-[16px] border border-[#173F4D]/10 bg-[#FFFFFF] p-4 font-inter text-sm outline-none focus:border-[#173F4D]/30" placeholder="Saisissez le sujet tel qu’il vous a été attribué." />
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#5E6B73]">Contexte de recherche</label>
                      <textarea value={project.contexte} onChange={(e) => setProject({ ...project, contexte: e.target.value })} className="mt-2 min-h-[110px] w-full rounded-[16px] border border-[#173F4D]/10 bg-[#FFFFFF] p-4 font-inter text-sm outline-none focus:border-[#173F4D]/30" placeholder="Terrain, organisation, population, période, secteur, problématique déjà envisagée, ou toute précision utile. Ne renseignez qu’un pays s’il fait réellement partie du sujet." />
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#5E6B73]">Problématique personnelle (facultatif)</label>
                      <textarea value={project.problematiquePersonnelle} onChange={(e) => setProject({ ...project, problematiquePersonnelle: e.target.value })} className="mt-2 min-h-[100px] w-full rounded-[16px] border border-[#173F4D]/10 bg-[#FFFFFF] p-4 font-inter text-sm outline-none focus:border-[#173F4D]/30" placeholder="Si vous avez déjà une problématique, saisissez-la ici. Elle sera conservée et vérifiée." />
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#5E6B73]">Plan personnel (facultatif)</label>
                      <textarea value={project.planPersonnel} onChange={(e) => setProject({ ...project, planPersonnel: e.target.value })} className="mt-2 min-h-[120px] w-full rounded-[16px] border border-[#173F4D]/10 bg-[#FFFFFF] p-4 font-inter text-sm outline-none focus:border-[#173F4D]/30" placeholder="Si vous avez déjà un plan, saisissez-le ici. Il sera utilisé après vérification de sa cohérence." />
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#5E6B73]">Consignes de l’établissement ou du client</label>
                      <textarea value={project.consignes} onChange={(e) => setProject({ ...project, consignes: e.target.value })} className="mt-2 min-h-[150px] w-full rounded-[16px] border border-[#173F4D]/10 bg-[#FFFFFF] p-4 font-inter text-sm outline-none focus:border-[#173F4D]/30" placeholder="Collez ici les consignes textuelles, méthodologiques ou de mise en forme." />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#5E6B73]">Documents du projet</label>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#173F4D]/10 bg-white px-3 py-2 font-inter text-xs">
                          <Paperclip className="h-3.5 w-3.5" /> Ajouter des fichiers
                          <input type="file" multiple accept=".pdf,.docx,.txt,.md,.csv,.tsv,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff" onChange={(e) => void handleFiles(e.target.files)} className="hidden" />
                        </label>
                      </div>
                      <div className="mt-3 rounded-[16px] border border-dashed border-[#173F4D]/15 bg-[#FFFFFF] p-5">
                        <div className="font-inter text-xs text-[#5E6B73]">PDF, DOCX, TXT, Markdown, CSV, TSV et images.</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {project.files.map((file, index) => (
                            <span key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-[#173F4D]/10 bg-white px-3 py-1.5 font-inter text-[11px]">
                              <FileText className="h-3.5 w-3.5" /> <span className="max-w-[180px] truncate">{file.name}</span>
                              <select value={file.category || "reference"} onChange={(event) => {
                              const category = event.target.value as FileCategory;
                              setProject((current) => ({
                                ...current,
                                files: current.files.map((item, itemIndex) => itemIndex === index ? { ...item, category } : item),
                              }));
                            }} className="rounded-lg border border-[#173F4D]/10 bg-white px-2 py-1 text-[11px]">
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

                <aside className="h-fit rounded-[24px] border border-[#173F4D]/5 bg-white p-7 lg:sticky lg:top-[98px]">
                  <div className="font-playfair text-xl">Paramètres du projet</div>
                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#5E6B73]">Niveau *</label>
                      <select value={project.niveau} onChange={(e) => setProject({ ...project, niveau: e.target.value })} className="mt-2 h-11 w-full rounded-[12px] border border-[#173F4D]/10 bg-white px-4 font-inter text-sm">
                        <option value="">Sélectionnez un niveau</option>
                        <option>Licence 1</option><option>Licence 2</option><option>Licence 3</option>
                        <option>Master 1</option><option>Master 2</option><option>Doctorat</option><option>Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#5E6B73]">Domaine *</label>
                      <select value={project.domaine} onChange={(e) => setProject({ ...project, domaine: e.target.value })} className="mt-2 h-11 w-full rounded-[12px] border border-[#173F4D]/10 bg-white px-4 font-inter text-sm">
                        <option value="">Sélectionnez un domaine</option>
                        {domainOptions.map((domain) => <option key={domain} value={domain}>{domain}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#5E6B73]">Type de document *</label>
                      <select value={project.typeDoc} onChange={(e) => setProject({ ...project, typeDoc: e.target.value })} className="mt-2 h-11 w-full rounded-[12px] border border-[#173F4D]/10 bg-white px-4 font-inter text-sm">
                        <option value="">Sélectionnez un type</option>
                        <option>Mémoire</option><option>Thèse</option><option>Rapport</option><option>Dissertation</option><option>Devoir</option><option>Article scientifique</option><option>Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#5E6B73]">Nombre de pages</label>
                      <input type="number" min={1} max={maxPagesForFormula(project.formula)} value={project.pages || ""} onChange={(e) => {
                        const raw = e.target.value;
                        setProject({ ...project, pages: raw === "" ? 0 : Math.min(maxPagesForFormula(project.formula), Number(raw)) });
                      }} className="mt-2 h-11 w-full rounded-[12px] border border-[#173F4D]/10 px-4 font-inter text-sm" />
                      <div className="mt-2 font-inter text-[11px] text-[#5E6B73]">Objectif de rédaction : {targetWords.toLocaleString("fr-FR")} mots</div>
                    </div>
                  </div>
                  <button onClick={() => void analyzeProject()} disabled={loading} className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#173F4D] font-inter text-sm font-medium text-white disabled:opacity-50">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-white" />}
                    Analyser le projet et estimer le coût
                  </button>
                </aside>
              </div>
            )}

            {view === "preview" && preview && !ownerRoute && canViewClientPreview && (
            <section
              className="mb-7 mx-auto max-w-[900px] select-none rounded-lg border border-[#173F4D]/10 bg-[#173F4D]/10 p-3 sm:p-8"
              onCopy={(event) => event.preventDefault()}
              onCut={(event) => event.preventDefault()}
              onContextMenu={(event) => event.preventDefault()}
            >
              <div className="mx-auto bg-white px-6 py-10 text-[#173F4D] shadow-lg sm:px-14 sm:py-16" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "11pt", lineHeight: 1.55, fontWeight: 400 }}>
                <div className="mb-8 border-b pb-5 text-center">
                  <div className="text-xs uppercase tracking-[0.12em] text-[#5E6B73]">Aperçu du document académique</div>
                  <h2 className="mt-4 text-xl font-bold">{project.sujet || selectedPlan?.title || "Projet académique"}</h2>
                  <div className="mx-auto mt-4 max-w-[620px] border-t border-b border-[#173F4D]/20 py-3 text-left text-sm">
                    <div><strong>Problématique :</strong> {preview.problematic.question}</div>
                    <div className="mt-2"><strong>Plan retenu :</strong> {preview.plan.title}</div>
                  </div>
                  <div className="mt-3 text-sm">{academicPreviewSegments().reduce((sum, segment) => sum + segment.words, 0).toLocaleString("fr-FR")} / {previewLimit.toLocaleString("fr-FR")} mots rédigés</div>
                </div>
                <section className="mb-10 border-b border-[#173F4D]/20 pb-8">
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
                    <div className="font-normal text-[11pt] leading-[1.55] text-[#173F4D]">
                      {renderAcademicText(
                        segment.content,
                        true
                      )}
                    </div>
                  </article>
                ))}
                <div className="mt-10 border-t pt-4 text-center text-xs italic text-[#5E6B73]">Fin de l’aperçu. Le paiement permet de poursuivre la rédaction au point d’arrêt.</div>
              </div>
            </section>
          )}
            {view === "preview" && preview && canViewClientPreview && (
              <section className="studio-payment mx-auto mt-6 max-w-[900px] rounded-[24px] border-t-4 border-[#C6A477] bg-[#173F4D] p-6 text-white shadow-[0_18px_38px_-28px_rgba(23,63,77,0.6)] sm:p-8">
                <div className="text-center">
                  <h3 className="mt-2 font-playfair text-2xl sm:text-3xl">Votre aperçu est terminé</h3>
                  <p className="mx-auto mt-3 max-w-[650px] font-inter text-sm leading-6 text-white/90">Le paiement débloque la suite de la rédaction au point d’arrêt, en conservant la problématique et le plan choisis.</p>
                  {estimate && (
                    <div className="mx-auto mt-5 max-w-[560px] rounded-2xl border border-white/15 bg-white/5 p-4 text-left">
                      <div className="font-inter text-xs font-semibold uppercase tracking-wide text-white">Récapitulatif de l’analyse initiale</div>
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 font-inter text-xs leading-5">
                        <div><dt className="text-white/90">Document</dt><dd className="font-semibold text-white">{estimate.documentType || project.typeDoc}</dd></div>
                        <div><dt className="text-white/90">Niveau</dt><dd className="font-semibold text-white">{estimate.level || project.niveau}</dd></div>
                        <div><dt className="text-white/90">Volume demandé</dt><dd className="font-semibold text-white">{estimate.pages || project.pages} pages</dd></div>
                        <div><dt className="text-white/90">Complexité évaluée</dt><dd className="font-semibold text-white">{estimate.complexity || "À confirmer"}</dd></div>
                      </dl>
                      {estimate.reasons?.length > 0 && <div className="mt-4"><div className="font-inter text-[11px] font-semibold text-white/90">Éléments pris en compte</div><ul className="mt-2 list-disc space-y-1 pl-5 font-inter text-xs leading-5 text-white/90">{estimate.reasons.map((reason, i) => <li key={"estimate-reason-"+i}>{reason}</li>)}</ul></div>}
                      {estimate.detectedRequirements?.length > 0 && <div className="mt-3"><div className="font-inter text-[11px] font-semibold text-white/90">Exigences détectées</div><ul className="mt-2 list-disc space-y-1 pl-5 font-inter text-xs leading-5 text-white/90">{estimate.detectedRequirements.map((item, i) => <li key={"estimate-requirement-"+i}>{item}</li>)}</ul></div>}
                      <div className="mt-5 border-t border-white/15 pt-4">
                        <div className="font-inter text-xs text-white/90">Montant estimé pour terminer et exporter le document complet</div>
                        <div className="mt-1 font-playfair text-2xl">{estimate.formattedAmount} {estimate.currency === "XOF" ? "FCFA" : estimate.currency === "EUR" ? "€" : estimate.currency === "CAD" ? "CA$" : estimate.currency === "CHF" ? "CHF" : estimate.currency === "USD" ? "US$" : estimate.currency}</div>
                        <p className="mt-2 font-inter text-xs leading-5 text-white/90">Ce montant couvre l’ensemble du document demandé, y compris les {totalDoneWords.toLocaleString("fr-FR")} mots déjà rédigés pour l’aperçu. Ces mots sont comptabilisés dans le prix global : ils ne sont ni gratuits ni facturés une seconde fois. Après paiement, la rédaction reprend au point d’arrêt et le document complet pourra être exporté.</p>
                      </div>
                    </div>
                  )}
                  <div className="mx-auto mt-5 grid max-w-[420px] gap-3">
                    {String(import.meta.env.VITE_PAYPAL_ENABLED || "").toLowerCase() === "true" ? (
                      <button onClick={() => void startPayment("paypal")} disabled={paymentLoading !== null} className="flex h-12 items-center justify-center gap-2 rounded-full bg-white font-inter text-sm font-semibold text-[#173F4D] hover:bg-[#173F4D]/10 disabled:opacity-60">
                        {paymentLoading === "paypal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
                        <span aria-label="PayPal" className="inline-flex items-center font-bold italic"><span className="text-[#173F4D]">Pay</span><span className="text-[#173F4D]">Pal</span></span><span>Payer avec PayPal</span>
                      </button>
                    ) : (
                      <button type="button" disabled className="flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-white/20 font-inter text-sm font-semibold text-white" title="Le prestataire de paiement doit être activé dans la configuration de Trimémo.">
                        <LockKeyhole className="h-4 w-4" />
                        <span aria-label="PayPal" className="inline-flex items-center font-bold italic"><span className="text-white">Pay</span><span className="text-white">Pal</span></span><span>Payer avec PayPal</span>
                      </button>
                    )}
                    {String(import.meta.env.VITE_PAYPAL_ENABLED || "").toLowerCase() !== "true" && String(import.meta.env.VITE_MOBILE_MONEY_ENABLED || "").toLowerCase() !== "true" && (
                      <p className="text-center font-inter text-xs leading-5 text-white/90">Le paiement n’est pas encore activé. La configuration du prestataire est nécessaire pour encaisser les paiements.</p>
                    )}
                    {(FEDAPAY_SANDBOX_ENABLED || String(import.meta.env.VITE_MOBILE_MONEY_ENABLED || "").toLowerCase() === "true") && (
                      <button onClick={() => void startPayment("mobile-money")} disabled={paymentLoading !== null} className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 font-inter text-sm font-semibold text-white disabled:opacity-60">
                        {paymentLoading === "mobile-money" ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
                        Payer par Mobile Money
                      </button>
                    )}
                    <p className="text-center font-inter text-xs leading-5 text-white/90">Mobile Money via FedaPay : MTN MoMo, Moov Money, Celtiis Cash et autres réseaux selon votre pays. Le choix du réseau se fait sur la page sécurisée FedaPay.</p>
                  </div>
                </div>
              </section>
            )}

            
          
          {view === "premium" && premium && (
            <section>
              <div className="mb-6">
<h1 className="mt-2 font-playfair text-4xl text-[#173F4D]">Problématiques, plans et rédaction</h1>
              </div>

              <div className="min-w-0">
                  {generationError && premiumSection === "problematic" && (
                    <div className="mb-5 rounded-2xl border border-[#B42318]/30 bg-[#B42318]/10 p-4 font-inter text-sm leading-6 text-[#173F4D]">
                      <strong>Erreur de génération du plan :</strong> {generationError}
                    </div>
                  )}

                  {premiumSection === "problematic" && (() => {
                    const index = Number(premiumNav.replace("problematic-", "") || 0);
                    const item = premium.problematics[index] || premium.problematics[0];
                    return item ? (
                      <article className="rounded-[24px] border border-[#173F4D]/10 bg-white p-7 shadow-sm lg:p-10">
                        <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#173F4D]">
                          Problématique {index + 1}
                        </div>
                        <h2 className="mt-3 font-playfair text-3xl text-[#173F4D]">{item.title}</h2>
                        <p className="mt-6 font-inter text-base leading-[1.9] text-[#5E6B73]">{item.question}</p>
                        {item.angle && <div className="mt-5 rounded-2xl bg-[#173F4D]/10 p-5 font-inter text-sm leading-[1.8] text-[#5E6B73]"><strong>Angle :</strong> {item.angle}</div>}
                        {item.rationale && <div className="mt-4 rounded-2xl bg-[#173F4D]/10 p-5 font-inter text-sm leading-[1.8] text-[#5E6B73]">{item.rationale}</div>}
                        <div className="mt-6 grid gap-3 rounded-2xl border border-[#173F4D]/10 bg-[#173F4D]/10 p-4">
                          <div className="font-inter text-xs font-semibold uppercase tracking-wide text-[#5E6B73]">Améliorer ou comparer la problématique</div>
                          <textarea value={problematicImprovementComments[item.id] || ""} onChange={(event) => setProblematicImprovementComments((current) => ({ ...current, [item.id]: event.target.value }))} rows={3} placeholder="Indiquez ce qui doit être précisé ou corrigé." className="w-full rounded-xl border border-[#173F4D]/10 bg-white px-4 py-3 font-inter text-sm" />
                          <div className="flex flex-wrap gap-2">
                            <button type="button" disabled={loading || problematicGenerationCount >= 3} onClick={() => void generateProblematicVariant("improve", item, problematicImprovementComments[item.id] || "")} className="rounded-full border border-[#173F4D]/15 bg-white px-4 py-2 font-inter text-xs font-semibold text-[#173F4D] disabled:opacity-50">Améliorer cette problématique</button>
                            <button type="button" disabled={loading || problematicGenerationCount >= 3} onClick={() => void generateProblematicVariant("alternative", item)} className="rounded-full border border-[#173F4D]/30 bg-white px-4 py-2 font-inter text-xs font-semibold text-[#173F4D] disabled:opacity-50">Proposer une autre</button>
                          </div>
                          <div className="font-inter text-[11px] text-[#5E6B73]">{problematicGenerationCount}/3 propositions utilisées</div>
                        </div>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => void generatePlansForProblematic(item, ownerSessionValid)}
                          className="mt-7 rounded-full bg-[#173F4D] px-6 py-3 font-inter text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                      <article className="rounded-[24px] border border-[#173F4D]/10 bg-white p-7 shadow-sm lg:p-10">
                        <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#173F4D]">
                          Plan {index + 1}
                        </div>
                        <h2 className="mt-3 font-playfair text-3xl text-[#173F4D]">{plan.title}</h2>
                        <div className="mt-7 space-y-5 font-inter">
                          {plan.parts.map((part) => (
                            <div key={part.id}>
                              <div className="font-bold uppercase text-[#173F4D]">PARTIE {part.number}. {part.title}</div>
                              <div className="mt-3 space-y-3 pl-4">
                                {part.chapters.map((chapter) => (
                                  <div key={chapter.id}>
                                    <div className="font-semibold text-[#173F4D]">Chapitre {chapter.number}. {chapter.title}</div>
                                    <div className="mt-2 space-y-2 pl-5">
                                      {chapter.sections.map((section) => (
                                        <div key={section.id}>
                                          <div className="text-sm font-semibold text-[#173F4D]/90">Section {chapter.number}.{section.number}. {section.title}</div>
                                          {section.subsections.map((subsection) => (
                                            <div key={subsection.id} className="mt-1 pl-5 text-xs text-[#5E6B73]">
                                              § {chapter.number}.{section.number}.{subsection.number} {subsection.title}
                                              {subsection.internalTitles.map((internal) => (
                                                <div key={internal.id} className="pl-4 text-[11px] text-[#5E6B73]">{internal.number}. {internal.title}</div>
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
                        <div className="mt-8 grid gap-3 rounded-2xl border border-[#173F4D]/10 bg-[#173F4D]/10 p-5">
                          <div className="font-inter text-xs font-semibold uppercase tracking-[0.12em] text-[#5E6B73]">Validation du plan</div>
                          <textarea
                            value={planImprovementComments[plan.id] || ""}
                            onChange={(event) => setPlanImprovementComments((current) => ({ ...current, [plan.id]: event.target.value }))}
                            rows={4}
                            placeholder="Décrivez précisément les modifications souhaitées pour améliorer ce plan."
                            className="w-full rounded-xl border border-[#173F4D]/10 bg-white px-4 py-3 font-inter text-sm"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button type="button" disabled={loading || planGenerationCount >= 3} onClick={() => void generatePlansForProblematic(selectedProblematic || premium.problematics[0], ownerRoute === true, undefined, { action: "improve", currentPlan: plan, comments: planImprovementComments[plan.id] || "" })} className="rounded-full border border-[#173F4D]/15 bg-white px-5 py-3 font-inter text-xs font-semibold text-[#173F4D] disabled:opacity-50">Demander une amélioration</button>
                            <button type="button" disabled={loading || planGenerationCount >= 3 || premium.plans.length >= 3} onClick={() => void generatePlansForProblematic(selectedProblematic || premium.problematics[0], ownerRoute === true, undefined, { action: "alternative" })} className="rounded-full border border-[#173F4D]/30 bg-white px-5 py-3 font-inter text-xs font-semibold text-[#173F4D] disabled:opacity-50">Générer un autre plan</button>
                            <button type="button" disabled={loading} onClick={() => {
                              const problematic = selectedProblematic || premium.problematics[0];
                              if (!problematic) return;
                              setSelectedProblematic(problematic);
                              selectPremiumPlan(problematic, plan);
                              // Confirmer explicitement la navigation après la sélection du plan.
                              setView("writing");
                              setPremiumSection("writing");
                              pushToast("success", "Plan retenu. Les blocs de rédaction sont prêts.");
                            }} className="rounded-full bg-[#173F4D] px-5 py-3 font-inter text-xs font-semibold text-white disabled:opacity-50">Valider ce plan</button>
                          </div>
                          {selectedPlan?.id === plan.id && <div className="font-inter text-xs font-semibold text-[#173F4D]">Plan retenu</div>}
                          <div className="font-inter text-[11px] text-[#5E6B73]">{planGenerationCount}/3 génération(s) de plan utilisée(s)</div>
                        </div>
                      </article>
                    ) : (
                      <div className="rounded-[24px] bg-white p-8 font-inter text-sm text-[#5E6B73]">
                        Aucun plan n’est encore disponible. Sélectionnez une problématique et générez un plan.
                      </div>
                    );
                  })()}
                </div>

            </section>
          )}
          {(view === "writing" || (view === "premium" && premiumSection === "writing")) && (!selectedPlan || !selectedProblematic) && (
            <section className="grid min-h-[60vh] gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <aside className="h-fit rounded-2xl border border-[#173F4D]/10 bg-white p-4">
                <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#173F4D]">Navigation du projet</div>
                <nav className="mt-4 space-y-2">
                  <button type="button" onClick={() => { setView("premium"); setPremiumSection("problematic"); setPremiumNav("problematic-0"); }} className="w-full rounded-xl px-4 py-3 text-left font-inter text-sm text-[#173F4D] hover:bg-[#173F4D]/20">1. Problématique</button>
                  <button type="button" onClick={() => { setView("premium"); setPremiumSection("plan"); setPremiumNav("plan-0"); }} className="w-full rounded-xl px-4 py-3 text-left font-inter text-sm text-[#173F4D] hover:bg-[#173F4D]/20">2. Plan validé</button>
                  <button type="button" onClick={() => { const p = selectedPlan || premium?.plans?.[0]; const q = selectedProblematic || premium?.problematics?.[0]; if (p && q) selectPremiumPlan(q, p); }} className="w-full rounded-xl bg-[#173F4D] px-4 py-3 text-left font-inter text-sm font-semibold text-white">3. Rédaction</button>
                </nav>
              </aside>
              <div className="rounded-2xl border border-[#173F4D] bg-white p-6 font-inter text-sm leading-6 text-[#5E6B73]">
                <h2 className="font-playfair text-2xl text-[#173F4D]">Préparation de l’espace de rédaction</h2>
                <p className="mt-3">Le plan ou la problématique n’a pas été restauré correctement. Utilisez le menu de gauche pour revenir au plan, puis validez-le à nouveau.</p>
                {generationError && <p className="mt-3 text-[#173F4D]">{generationError}</p>}
              </div>
            </section>
          )}
          {(view === "writing" || (view === "premium" && premiumSection === "writing")) && selectedPlan && selectedProblematic && (
              <section className="min-h-full">
                <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <aside className="h-fit rounded-2xl border border-[#173F4D]/10 bg-white p-4 lg:sticky lg:top-5">
                    <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#173F4D]">Navigation du projet</div>
                    <nav className="mt-4 space-y-2">
                      <button type="button" onClick={() => { setView("premium"); setPremiumSection("problematic"); setPremiumNav("problematic-0"); setWritingTab("problematic"); }} className="w-full rounded-xl px-4 py-3 text-left font-inter text-sm text-[#173F4D] hover:bg-[#173F4D]/20">1. Problématique</button>
                      <button type="button" onClick={() => { setView("premium"); setPremiumSection("plan"); setPremiumNav("plan-0"); setWritingTab("plan"); }} className="w-full rounded-xl px-4 py-3 text-left font-inter text-sm text-[#173F4D] hover:bg-[#173F4D]/20">2. Plan validé</button>
                      <button type="button" onClick={() => { setView("writing"); setWritingTab("writing"); }} className="w-full rounded-xl bg-[#173F4D] px-4 py-3 text-left font-inter text-sm font-semibold text-white">3. Rédaction</button>
                      {ownerRoute || window.sessionStorage.getItem("trimemo_premium_token") ? (
                        <button type="button" onClick={() => { void exportDocument(); }} className="w-full rounded-xl border border-[#173F4D]/15 px-4 py-3 text-left font-inter text-sm text-[#173F4D] hover:bg-[#173F4D]/20">Exporter le document</button>
                      ) : isPreviewReady(blocks, previewLimit) ? (
                        <button type="button" onClick={() => { void exportDocument(); }} className="w-full rounded-xl bg-[#173F4D] px-4 py-3 text-left font-inter text-sm font-semibold text-white hover:bg-[#173F4D]/90">Voir l’aperçu</button>
                      ) : (
                        <div className="rounded-xl border border-[#173F4D]/10 px-4 py-3 font-inter text-xs leading-5 text-[#5E6B73]">L’aperçu se débloque à {previewLimit.toLocaleString("fr-FR")} mots au maximum.</div>
                      )}
                    </nav>
                    <div className="mt-3 rounded-xl bg-[#173F4D]/10 p-3">
                      <div className="font-inter text-[11px] text-[#5E6B73]">Progression rédactionnelle</div>
                      <div className="mt-1 font-inter text-sm font-semibold">{totalDoneWords.toLocaleString("fr-FR")} mots rédigés</div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#173F4D]/10"><div className="h-full rounded-full bg-[#173F4D]" style={{ width: `${previewLimit ? Math.min(100, Math.round(totalDoneWords / previewLimit * 100)) : 0}%` }} /></div>
                      <div className="mt-1 font-inter text-[10px] text-[#5E6B73]">Aperçu indicatif : {previewLimit.toLocaleString("fr-FR")} mots maximum</div>
                    </div>
                  </aside>
                  <div className="min-w-0">
                <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                  <div>
                                        <h1 className="font-playfair text-2xl text-[#173F4D] sm:text-3xl">{selectedPlan.title}</h1>
                    <p className="mt-2 font-inter text-sm text-[#5E6B73]">
                      Le mémoire est rédigé dans l'ordre exact du plan sélectionné.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={loading} onClick={() => { void exportDocument(); }} className="rounded-full bg-[#173F4D] px-5 py-3 font-inter text-xs font-semibold text-white transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70">
                      {loading ? "Vérification et préparation du document…" : "Exporter le document Word"}
                    </button>

                  </div>
                </div>

                <div className="space-y-4 pb-8">
                  {blocks.map((block, index) => {
                    const isLast = index === blocks.length - 1;
                    const isGenerating = block.status === "generating";
                    return (
                      <article
                        key={block.id}
                        id={`writing-block-${block.id}`}
                        className="mx-auto max-w-[900px] overflow-hidden border border-[#173F4D]/20 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
                      >
                        <div className="border-b border-[#173F4D]/20 px-5 py-4 sm:px-8">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="font-playfair text-xl font-semibold leading-snug text-[#173F4D]">{block.title}</h2>
                            <button
                              type="button"
                              aria-label={`${block.content ? "Régénérer" : "Générer"} le bloc : ${block.title}`}
                              disabled={isGenerating || (activeBlockId !== null && activeBlockId !== block.id)}
                              onClick={() => {
                                setSelectedWritingBlockId(block.id);
                                void generateBlock(block.id);
                              }}
                              className="shrink-0 rounded-full bg-[#173F4D] px-5 py-2.5 font-inter text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isGenerating ? "Génération en cours…" : block.content ? "Régénérer" : "Générer"}
                            </button>
                          </div>
                          {isGenerating && <p role="status" className="mt-3 font-inter text-xs leading-5 text-[#5E6B73]">Votre texte est en préparation. Selon les besoins du projet, Trimémo recherche des sources, rédige et effectue des vérifications. Cela peut prendre quelques instants.</p>}
                          {block.structure.length > 0 && (
                            <details className="mt-2 font-inter text-xs text-[#5E6B73]">
                              <summary className="w-fit cursor-pointer font-medium">Voir la structure du bloc</summary>
                              <ul className="mt-2 list-disc space-y-1 pl-5 leading-5">
                                {block.structure.map((item, structureIndex) => (
                                  <li key={`${block.id}-structure-${structureIndex}`}>{item}</li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </div>

                        <div
                          className="min-h-0 bg-white px-5 py-6 font-['Times_New_Roman'] text-[12pt] leading-[1.5] text-[#173F4D] sm:px-8 sm:py-8 md:px-12 md:py-10"
                          style={protectWriting ? { userSelect: "none", WebkitUserSelect: "none" } : undefined}
                          onCopy={protectWriting ? (event) => event.preventDefault() : undefined}
                          onCut={protectWriting ? (event) => event.preventDefault() : undefined}
                        >
                          {block.error && (
                            <div className="mb-6 rounded-lg border border-[#B42318]/30 bg-[#B42318]/10 p-4 font-inter text-xs leading-5 text-[#173F4D]">
                              <strong>Erreur de rédaction :</strong> {block.error}
                            </div>
                          )}

                          {block.content ? (
                            <div>{renderAcademicText(block.content, false, block.structure, block.kind)}</div>
                          ) : (
                            <p className="font-inter text-sm text-[#5E6B73]">Ce bloc attend sa rédaction. Cliquez sur « Générer » ci-dessus.</p>
                          )}

                          {block.footnotes.length > 0 && (
                            <div className="mt-12 border-t border-[#173F4D] pt-5 text-[11px] leading-[1.6]">
                              <div className="mb-2 font-bold">Notes</div>
                              <ol className="list-decimal space-y-1 pl-5">
                                {block.footnotes.map((note, noteIndex) => <li key={noteIndex}>{note}</li>)}
                              </ol>
                            </div>
                          )}

                          {block.sources.some((source) => source?.verified === true) && (
                            <div className="mt-10 border-t border-[#173F4D]/20 pt-5 font-inter text-[11px] leading-[1.6] text-[#5E6B73]">
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
                          <div className="border-t border-[#173F4D]/20 bg-white px-5 py-3 text-center sm:px-8">
                            <button
                              type="button"
                              disabled={activeBlockId !== null}
                              onClick={() => {
                                const next = blocks[index + 1];
                                setSelectedWritingBlockId(next.id);
                                document.getElementById(`writing-block-${next.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }}
                              className="rounded-full border border-[#173F4D]/15 bg-white px-6 py-2.5 font-inter text-xs font-semibold text-[#173F4D] hover:bg-[#173F4D]/20 disabled:cursor-not-allowed disabled:opacity-40"
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
              <div className="rounded-[24px] bg-white p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /><div className="mt-3 font-inter text-sm text-[#5E6B73]">Préparation de votre espace académique…</div></div>
            )}

            {(view === "premium" || view === "writing") && !loading && !premium && (
              <div className="rounded-[24px] border border-[#B42318]/30 bg-[#B42318]/10 p-8 text-center"><LockKeyhole className="mx-auto h-6 w-6 text-[#173F4D]" /><div className="mt-3 font-inter text-sm text-[#173F4D]">Le déblocage premium doit être confirmé par le serveur de paiement.</div></div>
            )}
          </div>
        </div>
        </main>
      )}
      </>)}
    </div>
  );
}
