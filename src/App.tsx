import React, { useEffect, useMemo, useState } from "react";
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

const API_BASE_URL = "https://trimemo-api.vercel.app";
const API_URL = `${API_BASE_URL}/api/academic`;
const PROBLEMATICS_API = `${API_BASE_URL}/api/generate-problematics`;
const PLANS_API = `${API_BASE_URL}/api/generate-plans`;
const INTRO_PREVIEW_API = `${API_BASE_URL}/api/generate-introduction-preview`;
const BLOCK_API = `${API_BASE_URL}/api/generate-block`;
const WORDS_PER_PAGE = 320;
const FREE_INTRO_WORDS = 300;
const BLOCK_WORDS = 900;
const LOGO_SRC = "/trimemo-logo.webp";
const OWNER_AUTH_API = `${API_BASE_URL}/api/owner-auth`;

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
    {
      id: "LICENCE",
      title: "Mémoire Licence",
      pages: "10 à 45 pages",
      eur: "27 €",
      fcfa: "18 000 FCFA",
      badge: "Licence 3",
      details: "Complet · 1 révision incluse",
    },
    {
      id: "MASTER",
      title: "Mémoire Master",
      pages: "10 à 80 pages",
      eur: "38 €",
      fcfa: "25 000 FCFA",
      badge: "Le plus choisi",
      details: "Master 1 & 2 · 2 révisions incluses",
    },
    {
      id: "DOCTORAT",
      title: "Thèse",
      pages: "10 à 100 pages",
      eur: "76 €",
      fcfa: "50 000 FCFA",
      badge: "Doctorat & gros volumes",
      details:
        "Coach plan perso + anti-plagiat + Export LaTeX/Word + 3 révisions",
    },
  ],
  packs: [
    {
      title: "Pack 1 · 5 Licences",
      pages: "5 × 1–45 pages",
      eur: "110 €",
      fcfa: "72 000 FCFA",
      saving: "Économisez 18 000 FCFA",
    },
    {
      title: "Pack 2 · 5 Masters",
      pages: "5 × 1–80 pages",
      eur: "152 €",
      fcfa: "100 000 FCFA",
      saving: "Économisez 25 000 FCFA",
    },
    {
      title: "Pack 3 · 5 Thèses",
      pages: "5 × 1–100 pages",
      eur: "305 €",
      fcfa: "200 000 FCFA",
      saving: "Économisez 50 000 FCFA",
    },
  ],
};

const pricingInclusions = [
  "3 problématiques + 3 plans",
  "Rédaction de 900 mots par bloc",
  "Sources avec DOI",
  "Export Word",
  "Facture groupée pour les packs",
];


type FileInput = {
  name: string;
  type: string;
  content: string;
};

type ProjectData = {
  formula: FormulaId;
  sujet: string;
  contexte: string;
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

type PlanSubsection = {
  id: string;
  number: number;
  title: string;
  description: string;
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
  sources: { title: string; author?: string; year?: string; url?: string }[];
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  const normalizeSubsection = (item: any, subsectionIndex: number, sectionIndex: number, chapterIndex: number, partIndex: number): PlanSubsection => ({
    id: String(item?.id || `subsection-${partIndex + 1}-${chapterIndex + 1}-${sectionIndex + 1}-${subsectionIndex + 1}`),
    number: Number(item?.number || subsectionIndex + 1),
    title: String(typeof item === "string" ? item : item?.title || item?.titre || `Sous-section ${subsectionIndex + 1}`),
    description: String(typeof item === "string" ? "" : item?.description || "")
  });

  const parts: PlanPart[] = (Array.isArray(value?.parts) ? value.parts : []).map((part: any, partIndex: number) => ({
    id: String(part?.id || `part-${partIndex + 1}`),
    number: Number(part?.number || partIndex + 1),
    title: String(part?.title || part?.titre || `Partie ${partIndex + 1}`),
    description: String(part?.description || ""),
    chapters: (Array.isArray(part?.chapters) ? part.chapters : []).map((chapter: any, chapterIndex: number) => ({
      id: String(chapter?.id || `chapter-${partIndex + 1}-${chapterIndex + 1}`),
      number: Number(chapter?.number || chapterIndex + 1),
      title: String(chapter?.title || chapter?.titre || `Chapitre ${chapterIndex + 1}`),
      description: String(chapter?.description || ""),
      wordCount: Number(chapter?.wordCount || 0),
      sections: (Array.isArray(chapter?.sections) ? chapter.sections : []).map((section: any, sectionIndex: number) => ({
        id: String(section?.id || `section-${partIndex + 1}-${chapterIndex + 1}-${sectionIndex + 1}`),
        number: Number(section?.number || sectionIndex + 1),
        title: String(section?.title || section?.titre || `Section ${sectionIndex + 1}`),
        description: String(section?.description || ""),
        subsections: (Array.isArray(section?.subsections) ? section.subsections : Array.isArray(section?.sousSections) ? section.sousSections : []).map((item: any, subsectionIndex: number) => normalizeSubsection(item, subsectionIndex, sectionIndex, chapterIndex, partIndex))
      }))
    }))
  }));

  const introSource = value?.introductionGeneral || value?.introduction || {};
  const conclusionSource = value?.conclusionGeneral || value?.conclusion || {};
  const intro: PlanIntroConclusion = {
    title: String(introSource?.title || "Introduction générale"),
    description: String(introSource?.description || (Array.isArray(introSource?.elements) ? introSource.elements.join(" ") : "")),
    wordCount: Number(introSource?.wordCount || 0)
  };
  const conclusion: PlanIntroConclusion = {
    title: String(conclusionSource?.title || "Conclusion générale"),
    description: String(conclusionSource?.description || (Array.isArray(conclusionSource?.elements) ? conclusionSource.elements.join(" ") : "")),
    wordCount: Number(conclusionSource?.wordCount || 0)
  };

  return {
    id: String(value?.id || `plan-${index + 1}`),
    title: String(value?.title || value?.titre || `Plan ${index + 1}`),
    description: String(value?.description || ""),
    approach: String(value?.approach || value?.approche || ""),
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
    formula: "MASTER",
    sujet: "",
    contexte: "",
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
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState<"paypal" | "mobile-money" | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ownerRoute] = useState(() => typeof window !== "undefined" && window.location.pathname === "/owner");
  const [ownerSessionValid, setOwnerSessionValid] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [ownerLoginError, setOwnerLoginError] = useState("");
  const [ownerBusy, setOwnerBusy] = useState(false);

  const totalDoneWords = useMemo(
    () => blocks.filter((b) => b.status === "done").reduce((sum, b) => sum + b.wordCount, 0),
    [blocks],
  );
  const targetWords = project.pages * WORDS_PER_PAGE;
  const progress = targetWords ? Math.min(100, Math.round((totalDoneWords / targetWords) * 100)) : 0;

  useEffect(() => {
    if (!ownerRoute) return;
    const token = window.sessionStorage.getItem("trimemo_owner_session");
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
        } else {
          window.sessionStorage.removeItem("trimemo_owner_session");
        }
      } catch {
        window.sessionStorage.removeItem("trimemo_owner_session");
      }
    })();
  }, [ownerRoute]);

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
          body: JSON.stringify({ id, project: JSON.parse(sessionStorage.getItem("trimemo_project") || "null") }),
        });
        const data = await readApiResponse(response);
        if (data.status !== "PAID") {
          throw new Error(data.error || "Le paiement n’a pas été confirmé.");
        }
        const stored = sessionStorage.getItem("trimemo_project");
        if (stored) {
          const saved: ProjectData = JSON.parse(stored);
          setProject(saved);
          const premiumRequest = await fetch(`${API_URL}?action=generate-premium`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ project: saved }),
          });
          const premiumData = await readApiResponse(premiumRequest);
          const rawProblematicList = premiumData.problematics || premiumData.problematiques || [];
          const rawPlanList = premiumData.plans || [];
          setPremium({
            problematics: Array.isArray(rawProblematicList) ? rawProblematicList.map((item: any, index: number) => normalizeProblematic(item, index)) : [],
            plans: Array.isArray(rawPlanList) ? rawPlanList.map((item: any, index: number) => normalizePlan(item, index)) : []
          });
          setView("premium");
          pushToast("success", "Paiement confirmé. Les trois problématiques et trois plans sont disponibles.");
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
    setProject((current) => ({ ...current, formula }));
    setView("project");
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
      if (file.size > 12 * 1024 * 1024) {
        pushToast("error", `${file.name} dépasse 12 Mo.`);
        continue;
      }
      try {
        files.push({ name: file.name, type: file.type || "application/octet-stream", content: await readFileAsDataUrl(file) });
      } catch {
        pushToast("error", `Impossible de lire ${file.name}.`);
      }
    }
    setProject((current) => ({ ...current, files: [...current.files, ...files] }));
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
      throw new Error(data?.error || data?.message || `Erreur serveur HTTP ${response.status}.`);
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

    setLoading(true);
    try {
      const response = await fetch(PROBLEMATICS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ project: ownerProject, count: 3, ownerMode: true }),
      });
      const data = await readApiResponse(response);
      const rawList = data.problematiques || data.problematics || data.data || [];
      if (!Array.isArray(rawList) || rawList.length === 0) {
        throw new Error("Aucune problématique n’a été générée.");
      }

      const problematics = rawList.slice(0, 3).map((item: any, index: number) =>
        normalizeProblematic(item, index),
      );

      setProject(ownerProject);
      setPremium({ problematics, plans: [] });
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

  async function generateOwnerPlans(problematic: Problematic) {
    if (!ownerSessionValid || !premium) return;
    setLoading(true);
    try {
      const response = await fetch(PLANS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          project,
          problematic,
          count: 3,
          ownerMode: true,
        }),
      });
      const data = await readApiResponse(response);
      const rawList = data.plans || data.data || [];
      if (!Array.isArray(rawList) || rawList.length === 0) {
        throw new Error("Aucun plan n’a été généré pour cette problématique.");
      }
      const plans = rawList.slice(0, 3).map((item: any, index: number) => normalizePlan(item, index));
      setSelectedProblematic(problematic);
      setPremium((current) => current ? { ...current, plans } : current);
      setSelectedPlan(null);
      setBlocks([]);
      pushToast("success", "Les trois plans ont été générés pour la problématique sélectionnée.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Impossible de générer les plans.");
    } finally {
      setLoading(false);
    }
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
    if (!project.email.trim()) {
      pushToast("error", "L’adresse e-mail est obligatoire pour recevoir votre projet.");
      return;
    }

    setLoading(true);

    try {
      const basePayload = { project };

      const problematicsResponse = await fetch(PROBLEMATICS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...basePayload, count: 1 }),
      });
      const problematicsData = await readApiResponse(problematicsResponse);
      const problematics: Problematic[] =
        problematicsData.problematiques ||
        problematicsData.problematics ||
        problematicsData.data ||
        [];

      if (!Array.isArray(problematics) || !problematics[0]) {
        throw new Error("Aucune problématique n’a été générée.");
      }

      const problematic = normalizeProblematic(problematics[0], 0);

      const plansResponse = await fetch(PLANS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...basePayload,
          problematic,
          count: 1,
        }),
      });
      const plansData = await readApiResponse(plansResponse);
      const plans: Plan[] = plansData.plans || plansData.data || [];

      if (!Array.isArray(plans) || !plans[0]) {
        throw new Error("Aucun plan n’a été généré.");
      }

      const plan = normalizePlan(plans[0], 0);

      const introResponse = await fetch(INTRO_PREVIEW_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...basePayload,
          problematic,
          plan,
          targetWords: FREE_INTRO_WORDS,
        }),
      });
      const introductionData = await readApiResponse(introResponse);

      const introduction =
        introductionData.introduction ||
        introductionData.data?.introduction ||
        introductionData.data;

      if (!introduction?.content) {
        throw new Error("L’introduction d’aperçu n’a pas été générée.");
      }

      const previewData: Preview = {
        problematic,
        plan,
        introduction: {
          title: introduction.title || "Introduction",
          content: introduction.content,
          wordCount: introduction.wordCount || countWords(introduction.content),
          incomplete: true,
        },
      };

      setPreview(previewData);
      sessionStorage.setItem("trimemo_project", JSON.stringify(project));
      setView("preview");
    } catch (error) {
      pushToast(
        "error",
        error instanceof Error
          ? error.message
          : "Impossible de générer l’aperçu."
      );
    } finally {
      setLoading(false);
    }
  }

  async function startPayment(method: "paypal" | "mobile-money") {
    setPaymentLoading(method);
    try {
      sessionStorage.setItem("trimemo_project", JSON.stringify(project));
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
    const newBlocks = planChapters(plan).flatMap((chapter) => {
      const count = Math.max(1, Math.ceil(chapter.wordCount / BLOCK_WORDS));
      const base = Math.floor(chapter.wordCount / count);
      const remainder = chapter.wordCount - base * count;
      return Array.from({ length: count }, (_, index) => ({
        id: `${chapter.id}-${index + 1}`,
        title: `${chapter.title} — Bloc ${index + 1}`,
        expectedWords: base + (index < remainder ? 1 : 0),
        content: "",
        wordCount: 0,
        status: "pending" as const,
        sources: [],
      }));
    });
    setBlocks(newBlocks);
  }

  function selectPremiumPlan(problematic: Problematic, plan: Plan) {
    setSelectedProblematic(problematic);
    setSelectedPlan(plan);
    prepareBlocks(plan);
    setView("writing");
  }

  async function generateBlock(blockId: string) {
    if (!selectedProblematic || !selectedPlan) return;
    const block = blocks.find((item) => item.id === blockId);
    if (!block || block.status === "generating") return;

    setBlocks((current) => current.map((item) => item.id === blockId ? { ...item, status: "generating" } : item));
    try {
      const preceding = blocks
        .filter((item) => item.status === "done")
        .slice(-2)
        .map((item) => ({ title: item.title, content: item.content }));

      const response = await fetch(BLOCK_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project,
          problematic: selectedProblematic,
          plan: selectedPlan,
          block: {
            id: block.id,
            title: block.title,
            expectedWords: block.expectedWords,
          },
          blockTitle: block.title,
          targetWords: block.expectedWords,
          preceding,
          ownerMode: ownerRoute === true,
        }),
      });

      const data = await readApiResponse(response);
      const result = data.block || data.data || data;
      const content = String(result.content || result.text || result.body || "");
      if (!content.trim()) throw new Error("Le serveur n’a retourné aucun contenu pour ce bloc.");
      setBlocks((current) => current.map((item) => item.id === blockId ? {
        ...item,
        ...result,
        content,
        wordCount: Number(result.wordCount || countWords(content)),
        sources: Array.isArray(result.sources) ? result.sources : [],
        status: "done",
      } : item));
    } catch (error) {
      setBlocks((current) => current.map((item) => item.id === blockId ? { ...item, status: "pending" } : item));
      pushToast("error", error instanceof Error ? error.message : "Impossible de générer ce bloc.");
    }
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    pushToast("success", "Contenu copié.");
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
      <div className="min-h-screen bg-[#F7FAF8] text-[#172554]">
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
                onClick={handleOwnerLogout}
                className="rounded-full bg-white px-4 py-2 font-inter text-xs font-semibold text-[#172554]"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1440px]">
          <aside className="hidden min-h-[calc(100vh-76px)] w-64 shrink-0 border-r border-[#172554]/10 bg-white p-5 lg:block">
            <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">Navigation</div>
            <nav className="mt-5 space-y-2">
              {[
                ["project", "Nouveau projet"],
                ["premium", "Problématiques et plans"],
                ["writing", "Rédaction par blocs"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key as typeof view)}
                  disabled={key !== "project" && !premium}
                  className={`w-full rounded-xl px-4 py-3 text-left font-inter text-xs font-semibold ${
                    view === key ? "bg-[#172554] text-white" : "text-[#172554] hover:bg-[#F7FAF8]"
                  } disabled:opacity-40`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </aside>
          <main className="min-w-0 flex-1 px-5 py-8 lg:px-8">
          {view === "project" && (
            <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="rounded-[28px] border border-[#172554]/10 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">
                      Test sans paiement
                    </div>
                    <h1 className="mt-2 font-playfair text-3xl text-[#172554]">
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
                      Documents de référence
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
                        {project.files.map((file) => (
                          <div
                            key={`${file.name}-${file.content.length}`}
                            className="rounded-xl bg-[#F7FAF8] px-3 py-2 font-inter text-xs"
                          >
                            {file.name}
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
                  Générer 3 problématiques et 3 plans
                </button>
              </div>

              <aside className="h-fit rounded-[28px] border border-[#172554]/10 bg-white p-5 shadow-sm">
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
                    <strong>04.</strong> Rédaction par blocs
                  </div>
                </div>
              </aside>
            </section>
          )}

          {view === "premium" && premium && (
            <section>
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">
                    Résultats du test
                  </div>
                  <h1 className="mt-2 font-playfair text-3xl text-[#172554]">
                    Problématiques et plans
                  </h1>
                  <p className="mt-2 max-w-3xl font-inter text-sm leading-[1.7] text-[#172554]/65">
                    Sélectionnez une problématique pour lancer la génération des trois plans.
                    Les plans sont générés uniquement pour la problématique choisie.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setView("project")}
                  className="rounded-full border border-[#172554]/10 bg-white px-4 py-2 font-inter text-xs font-semibold"
                >
                  Modifier le projet
                </button>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {premium.problematics.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setSelectedProblematic(item);
                      setPremium((current) => current ? { ...current, plans: [] } : current);
                      setSelectedPlan(null);
                      setBlocks([]);
                    }}
                    className={`rounded-[24px] border p-5 text-left shadow-sm transition ${
                      selectedProblematic?.id === item.id
                        ? "border-[#D4A23A] bg-[#FFF8E7]"
                        : "border-[#172554]/10 bg-white"
                    }`}
                  >
                    <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D4A23A]">
                      Problématique {index + 1}
                    </div>
                    <h2 className="mt-3 font-inter text-base font-semibold text-[#172554]">
                      {item.title}
                    </h2>
                    <p className="mt-3 font-inter text-sm leading-[1.75] text-[#172554]/75">
                      {item.question}
                    </p>
                    {item.rationale && (
                      <p className="mt-3 rounded-2xl bg-[#F7FAF8] p-3 font-inter text-xs leading-[1.7] text-[#172554]/65">
                        {item.rationale}
                      </p>
                    )}
                    <div className="mt-4 text-[11px] font-semibold text-[#172554]/60">
                      {selectedProblematic?.id === item.id ? "Problématique sélectionnée" : "Sélectionner cette problématique"}
                    </div>
                  </button>
                ))}
              </div>

              {selectedProblematic && premium.plans.length === 0 && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void generateOwnerPlans(selectedProblematic)}
                  className="mt-5 rounded-full bg-[#172554] px-5 py-3 font-inter text-xs font-semibold text-white disabled:opacity-50"
                >
                  {loading ? "Génération..." : "Générer les plans pour cette problématique"}
                </button>
              )}

              {premium.plans.length > 0 && <div className="mt-8">
                <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">
                  Plans générés
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  {premium.plans.map((plan, index) => (
                    <article
                      key={plan.id}
                      className="rounded-[24px] border border-[#172554]/10 bg-white p-5 shadow-sm"
                    >
                      <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.16em] text-[#172554]/50">
                        Plan {index + 1}
                      </div>
                      <h2 className="mt-2 font-playfair text-xl text-[#172554]">
                        {plan.title}
                      </h2>

                      <div className="mt-4 space-y-2">
                        {plan.parts.map((part) => (
                          <div
                            key={part.id}
                            className="rounded-2xl bg-[#F7FAF8] p-3"
                          >
                            <div className="font-inter text-sm font-bold text-[#172554]">
                              Partie {part.number} : {part.title}
                            </div>
                            <div className="mt-3 space-y-3">
                              {part.chapters.map((chapter) => (
                                <div key={chapter.id} className="rounded-xl bg-white p-3">
                                  <div className="font-inter text-xs font-bold text-[#172554]">
                                    Chapitre {chapter.number} : {chapter.title}
                                  </div>
                                  <div className="mt-2 space-y-1">
                                    {chapter.sections.map((section) => (
                                      <div key={section.id} className="text-xs leading-[1.6] text-[#172554]/70">
                                        {section.number}. {section.title}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-2 text-[10px] text-[#172554]/50">
                                    {chapter.wordCount} mots
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          selectPremiumPlan(
                            selectedProblematic || premium.problematics[0],
                            plan,
                          )
                        }
                        className="mt-5 h-11 w-full rounded-full bg-[#172554] font-inter text-xs font-semibold text-white"
                      >
                        Choisir ce plan et rédiger
                      </button>
                    </article>
                  ))}
                </div>
              </div>}
            </section>
          )}

          {view === "writing" && selectedProblematic && selectedPlan && (
            <section>
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A23A]">
                    Rédaction par blocs
                  </div>
                  <h1 className="mt-2 font-playfair text-3xl text-[#172554]">
                    {selectedPlan.title}
                  </h1>
                  <p className="mt-2 max-w-3xl font-inter text-sm leading-[1.7] text-[#172554]/65">
                    Le bloc sélectionné est envoyé au backend, puis au moteur OpenAI.
                    Aucun paiement n’est demandé dans cet espace.
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 font-inter text-xs shadow-sm">
                  {totalDoneWords} / {targetWords} mots · {progress} %
                </div>
              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full bg-[#D4A23A] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-6 space-y-4">
                {blocks.map((block, index) => (
                  <article
                    key={block.id}
                    className="rounded-[24px] border border-[#172554]/10 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                      <div>
                        <div className="font-inter text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D4A23A]">
                          Bloc {index + 1}
                        </div>
                        <h2 className="mt-2 font-inter text-base font-semibold">
                          {block.title}
                        </h2>
                        <div className="mt-1 font-inter text-xs text-[#172554]/55">
                          Objectif : {block.expectedWords} mots
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={block.status === "generating"}
                        onClick={() => void generateBlock(block.id)}
                        className="rounded-full bg-[#172554] px-4 py-2 font-inter text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {block.status === "generating" ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Rédaction...
                          </span>
                        ) : block.status === "done" ? (
                          "Régénérer le bloc"
                        ) : (
                          "Rédiger ce bloc"
                        )}
                      </button>
                    </div>

                    {block.content && (
                      <div className="mt-5 whitespace-pre-wrap rounded-2xl bg-[#F7FAF8] p-5 font-inter text-sm leading-[1.8] text-[#172554]/85">
                        {block.content}
                      </div>
                    )}

                    {block.status === "done" && block.sources.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-[#172554]/10 p-4">
                        <div className="font-inter text-xs font-semibold">
                          Sources retournées
                        </div>
                        <div className="mt-2 space-y-2">
                          {block.sources.map((source, sourceIndex) => (
                            <div
                              key={`${source.title}-${sourceIndex}`}
                              className="font-inter text-xs leading-[1.6] text-[#172554]/70"
                            >
                              {source.author ? `${source.author} · ` : ""}
                              {source.year ? `${source.year} · ` : ""}
                              {source.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
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
            Tester problématiques et plans
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
            <button
              onClick={() => navigateToSection("fonctionnement")}
              className="rounded-xl px-4 py-3 text-left hover:bg-white/10"
            >
              Fonctionnement
            </button>
            <button
              onClick={() => navigateToSection("formules")}
              className="rounded-xl px-4 py-3 text-left hover:bg-white/10"
            >
              Formules
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setView("project");
              }}
              className="rounded-xl px-4 py-3 text-left hover:bg-white/10"
            >
              Mon projet
            </button>
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
                  ["03", "Aperçu gratuit", "Une problématique, un plan et une introduction incomplète de 300 mots."],
                  ["04", "Accès complet", "Après paiement : trois problématiques, trois plans puis la rédaction par blocs de 900 mots."],
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

              <div className="mt-12">
                <div className="font-inter text-[11px] uppercase tracking-[0.22em] text-[#D4A23A]">
                  Packs 5 documents
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-3">
                  {pricing.packs.map((pack) => (
                    <div
                      key={pack.title}
                      className="rounded-[24px] border border-[#172554]/10 bg-white p-7"
                    >
                      <div className="font-playfair text-xl">{pack.title}</div>
                      <div className="mt-2 font-inter text-xs text-[#172554]/75">
                        {pack.pages}
                      </div>

                      <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
                        <span className="font-playfair text-3xl">{pack.eur}</span>
                        <span className="pb-1 font-inter text-xs text-[#172554]/75">
                          {pack.fcfa}
                        </span>
                      </div>

                      <div className="mt-4 font-inter text-xs font-semibold text-[#D4A23A]">
                        {pack.saving}
                      </div>
                    </div>
                  ))}
                </div>
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
        <main className="min-h-[calc(100vh-72px)] bg-[#EAF7EE] px-6 py-8 lg:px-8 lg:py-10">
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
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">Consignes de l’établissement ou du client</label>
                      <textarea value={project.consignes} onChange={(e) => setProject({ ...project, consignes: e.target.value })} className="mt-2 min-h-[150px] w-full rounded-[16px] border border-[#172554]/10 bg-[#FFFFFF] p-4 font-inter text-sm outline-none focus:border-[#172554]/30" placeholder="Collez ici les consignes textuelles, méthodologiques ou de mise en forme." />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#172554]/75">Documents de référence</label>
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
                              <FileText className="h-3.5 w-3.5" /> {file.name}
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
                      <input type="number" min={1} max={200} value={project.pages} onChange={(e) => setProject({ ...project, pages: Math.max(1, Math.min(200, Number(e.target.value) || 1)) })} className="mt-2 h-11 w-full rounded-[12px] border border-[#172554]/10 px-4 font-inter text-sm" />
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
                      <p className="mt-5 font-inter text-base leading-[1.9] text-[#172554]/80">{preview.plan.description}</p>
                      <div className="mt-7 space-y-4">
                        <div className="rounded-[14px] bg-[#EAF7EE] p-4"><div className="font-inter text-sm font-semibold text-[#172554]">{preview.plan.introduction.title}</div><div className="mt-2 font-inter text-sm leading-[1.7] text-[#172554]/75">{preview.plan.introduction.description}</div></div>
                        {preview.plan.parts.map((part) => <div key={part.id} className="rounded-[14px] border border-[#172554]/10 p-4"><div className="font-inter text-sm font-bold text-[#172554]">{part.number}. {part.title}</div>{part.description && <div className="mt-2 font-inter text-sm leading-[1.7] text-[#172554]/70">{part.description}</div>}<div className="mt-4 space-y-3">{part.chapters.map((chapter) => <div key={chapter.id} className="rounded-[12px] bg-[#EAF7EE] p-4"><div className="font-inter text-sm font-semibold text-[#172554]">{chapter.number}. {chapter.title}</div>{chapter.description && <div className="mt-2 font-inter text-sm leading-[1.7] text-[#172554]/75">{chapter.description}</div>}<div className="mt-4 space-y-3">{chapter.sections.map((section) => <div key={section.id} className="font-inter text-sm text-[#172554]/80"><div className="font-semibold">{section.number}. {section.title}</div>{section.description && <div className="mt-1 leading-[1.7]">{section.description}</div>}{section.subsections.length > 0 && <div className="mt-2 space-y-1 pl-4">{section.subsections.map((subsection) => <div key={subsection.id} className="text-xs leading-[1.6] text-[#172554]/70">{subsection.number}. {subsection.title}{subsection.description ? ` : ${subsection.description}` : ""}</div>)}</div>}</div>)}</div><div className="mt-3 font-inter text-xs text-[#172554]/70">{chapter.wordCount.toLocaleString("fr-FR")} mots</div></div>)}</div></div>)}
                        <div className="rounded-[14px] bg-[#EAF7EE] p-4"><div className="font-inter text-sm font-semibold text-[#172554]">{preview.plan.conclusion.title}</div><div className="mt-2 font-inter text-sm leading-[1.7] text-[#172554]/75">{preview.plan.conclusion.description}</div></div>
                      </div>
                    </div>
                  )}
                  {previewTab === "introduction" && (
                    <div>
                      <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#D4A23A]">Introduction · 300 mots</div>
                      <h3 className="mt-5 font-playfair text-2xl leading-tight text-[#172554] sm:text-3xl">{preview.introduction.title}</h3>
                      <p className="mt-6 whitespace-pre-wrap font-inter text-base leading-[1.95] text-[#172554]/80">{preview.introduction.content}</p>
                      <div className="mt-6 rounded-[14px] bg-[#FFF8E7] p-4 font-inter text-sm leading-[1.7] text-[#6B4B08]">La version complète est accessible après paiement.</div>
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
                    <button onClick={() => void startPayment("mobile-money")} disabled={paymentLoading !== null} className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 font-inter text-sm font-semibold text-white disabled:opacity-60">
                      {paymentLoading === "mobile-money" ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
                      Payer par Mobile Money
                    </button>
                  </div>
                </div>
              </section>
            )}

            {view === "premium" && premium && (
              <div>
                <section className="grid gap-6 lg:grid-cols-3">
                  {premium.problematics.map((item) => (
                    <button key={item.id} onClick={() => setSelectedProblematic(item)} className={`rounded-[24px] border p-7 text-left ${selectedProblematic?.id === item.id ? "border-[#172554] bg-[#172554] text-white" : "border-[#172554]/5 bg-white"}`}>
                      <div className={`font-inter text-[11px] uppercase tracking-[0.2em] ${selectedProblematic?.id === item.id ? "text-[#D4A23A]" : "text-[#D4A23A]"}`}>Problématique {item.id}</div>
                      <h3 className="mt-4 font-playfair text-xl">{item.title}</h3>
                      <p className={`mt-4 font-inter text-sm leading-[1.7] ${selectedProblematic?.id === item.id ? "text-white/70" : "text-[#172554]/75"}`}>{item.question}</p>
                      <p className={`mt-4 font-inter text-xs leading-[1.6] ${selectedProblematic?.id === item.id ? "text-white/50" : "text-[#172554]/75"}`}>{item.rationale}</p>
                    </button>
                  ))}
                </section>
                <section className="mt-8 grid gap-6 lg:grid-cols-3">
                  {premium.plans.map((plan) => {
                    const isCompatible = Boolean(selectedProblematic);
                    return <button key={plan.id} disabled={!isCompatible} onClick={() => selectedProblematic && selectPremiumPlan(selectedProblematic, plan)} className={`rounded-[24px] border p-7 text-left ${selectedPlan?.id === plan.id ? "border-[#172554] bg-[#172554] text-white" : "border-[#172554]/5 bg-white"}`}>
                      <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#D4A23A]">{plan.approach}</div>
                      <h3 className="mt-4 font-playfair text-xl">{plan.title}</h3>
                      <p className={`mt-3 font-inter text-sm leading-[1.7] ${selectedPlan?.id === plan.id ? "text-white/70" : "text-[#172554]/75"}`}>{plan.description}</p>
                      <div className={`mt-5 font-inter text-xs ${selectedPlan?.id === plan.id ? "text-white/50" : "text-[#172554]/75"}`}>{plan.totalWords.toLocaleString("fr-FR")} mots · {wordsToPages(plan.totalWords).toFixed(1)} pages</div>
                      <div className="mt-5 space-y-2">{plan.parts.map((part) => <div key={part.id} className={`rounded-[12px] p-3 ${selectedPlan?.id === plan.id ? "bg-white/10" : "bg-[#EAF7EE]"}`}><div className="font-inter text-xs font-semibold">{part.number}. {part.title}</div>{part.description && <div className="mt-1 font-inter text-[10px] leading-[1.5] text-[#172554]/60">{part.description}</div>}{part.chapters.slice(0, 3).map((chapter) => <div key={chapter.id} className="mt-2"><div className="font-inter text-[11px] font-semibold">{chapter.title}</div>{chapter.sections.map((section) => <div key={section.id} className={`pl-2 font-inter text-[10px] ${selectedPlan?.id === plan.id ? "text-white/50" : "text-[#172554]/50"}`}>{section.number}. {section.title}{section.description ? ` : ${section.description}` : ""}{section.subsections.length ? ` · ${section.subsections.map((subsection) => `${subsection.number}. ${subsection.title}`).join(" · ")}` : ""}</div>)}</div>)}</div>)}</div>
                      <div className="mt-5 font-inter text-xs font-semibold">{selectedProblematic ? "Choisir ce plan et rédiger" : "Sélectionnez une problématique"}</div>
                    </button>;
                  })}
                </section>
              </div>
            )}

            {view === "writing" && selectedPlan && selectedProblematic && (
              <div className="grid gap-8 lg:grid-cols-[310px_1fr]">
                <aside className="h-fit rounded-[24px] border border-[#172554]/5 bg-white p-6 lg:sticky lg:top-[98px]">
                  <div className="font-playfair text-xl">Rédaction complète</div>
                  <div className="mt-2 font-inter text-xs text-[#172554]/75">Objectif : {targetWords.toLocaleString("fr-FR")} mots</div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EAF7EE]"><div className="h-full rounded-full bg-[#D4A23A]" style={{ width: `${progress}%` }} /></div>
                  <div className="mt-2 font-inter text-[11px] text-[#172554]/75">{totalDoneWords.toLocaleString("fr-FR")} / {targetWords.toLocaleString("fr-FR")} mots</div>
                  <div className="mt-6 space-y-2">
                    {blocks.map((block) => (
                      <button key={block.id} onClick={() => void generateBlock(block.id)} disabled={block.status === "generating"} className={`w-full rounded-[13px] border p-3 text-left ${block.status === "done" ? "border-[#172554] bg-[#172554] text-white" : "border-[#172554]/5 bg-[#EAF7EE]"}`}>
                        <div className="flex items-center justify-between gap-2"><span className="font-inter text-xs leading-[1.4]">{block.title}</span>{block.status === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> : block.status === "done" ? <Check className="h-4 w-4 text-[#D4A23A]" /> : <span className="font-inter text-[10px]">{block.expectedWords} mots</span>}</div>
                      </button>
                    ))}
                  </div>
                </aside>

                <section className="space-y-6">
                  <div className="rounded-[24px] border border-[#172554]/5 bg-white p-7">
                    <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#D4A23A]">Paramètres verrouillés</div>
                    <h3 className="mt-3 font-playfair text-2xl">{selectedProblematic.title}</h3>
                    <p className="mt-2 font-inter text-sm text-[#172554]/60">{selectedPlan.title}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-[12px] bg-[#EAF7EE] p-3 font-inter text-xs">Contexte : {project.contexte ? "fourni" : "non précisé"}</div><div className="rounded-[12px] bg-[#EAF7EE] p-3 font-inter text-xs">Consignes : {project.consignes ? "fournies" : "non précisées"}</div><div className="rounded-[12px] bg-[#EAF7EE] p-3 font-inter text-xs">Documents : {project.files.length}</div></div>
                  </div>

                  {blocks.filter((block) => block.status === "done").map((block) => (
                    <article key={block.id} className="rounded-[24px] border border-[#172554]/5 bg-white p-7 lg:p-9">
                      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-playfair text-2xl">{block.title}</h3><span className="rounded-full bg-[#172554] px-3 py-1 font-inter text-[11px] text-white">{block.wordCount} mots</span></div>
                      <div className="mt-6 whitespace-pre-wrap font-inter text-[14px] leading-[1.9] text-[#172554]/80">{block.content}</div>
                      {block.sources.length > 0 && <div className="mt-8 border-t border-[#172554]/5 pt-6"><div className="font-inter text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D4A23A]">Sources utilisées</div><div className="mt-3 space-y-2">{block.sources.map((source, index) => <div key={index} className="font-inter text-xs text-[#172554]/70">{source.author ? `${source.author}. ` : ""}{source.title}{source.year ? ` (${source.year})` : ""}{source.url ? ` · ${source.url}` : ""}</div>)}</div></div>}
                      <button onClick={() => void copy(block.content)} className="mt-7 rounded-full border border-[#172554]/10 px-4 py-2 font-inter text-xs">Copier le bloc</button>
                    </article>
                  ))}
                </section>
              </div>
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
