import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
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
      id: "PACK_LICENCE",
      formula: "LICENCE",
      title: "Pack 1 · 5 Licences",
      pages: "5 × 1–45 pages",
      eur: "110 €",
      fcfa: "72 000 FCFA",
      saving: "Économisez 18 000 FCFA",
    },
    {
      id: "PACK_MASTER",
      formula: "MASTER",
      title: "Pack 2 · 5 Masters",
      pages: "5 × 1–80 pages",
      eur: "152 €",
      fcfa: "100 000 FCFA",
      saving: "Économisez 25 000 FCFA",
    },
    {
      id: "PACK_DOCTORAT",
      formula: "DOCTORAT",
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

type PlanChapter = {
  id: string;
  title: string;
  subparts: string[];
  wordCount: number;
};

type Plan = {
  id: string;
  title: string;
  description: string;
  approach: string;
  totalWords: number;
  chapters: PlanChapter[];
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
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState<"paypal" | "mobile-money" | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalDoneWords = useMemo(
    () => blocks.filter((b) => b.status === "done").reduce((sum, b) => sum + b.wordCount, 0),
    [blocks],
  );
  const targetWords = project.pages * WORDS_PER_PAGE;
  const progress = targetWords ? Math.min(100, Math.round((totalDoneWords / targetWords) * 100)) : 0;

  useEffect(() => {
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
          setPremium(premiumData);
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

      const problematic = problematics[0];

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

      const plan = plans[0];

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
    const newBlocks = plan.chapters.flatMap((chapter) => {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          problematic: selectedProblematic,
          plan: selectedPlan,
          block: { id: block.id, title: block.title, expectedWords: block.expectedWords },
          preceding,
        }),
      });
      const data = await readApiResponse(response);
      setBlocks((current) => current.map((item) => item.id === blockId ? { ...item, ...data, status: "done" } : item));
    } catch (error) {
      setBlocks((current) => current.map((item) => item.id === blockId ? { ...item, status: "pending" } : item));
      pushToast("error", error instanceof Error ? error.message : "Impossible de générer ce bloc.");
    }
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    pushToast("success", "Contenu copié.");
  }

  return (
    <div className="min-h-screen bg-[#FFFEFB] text-[#0A2342]">
      <style>{`
        .font-playfair { font-family: 'Playfair Display', Georgia, serif; }
        .font-inter { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; }
      `}</style>

      <div className="fixed right-4 top-4 z-[100] flex max-w-md flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="rounded-xl border bg-white px-4 py-3 text-sm shadow-lg">
            <div className="flex items-start gap-2">
              <span className={`mt-1 h-2 w-2 rounded-full ${toast.type === "error" ? "bg-red-500" : toast.type === "success" ? "bg-emerald-500" : "bg-[#C5A46B]"}`} />
              <span>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>

      <header className="sticky top-0 z-50 border-b border-[#0A2342]/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 lg:px-8">
          <button onClick={() => setView("home")} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#0A2342] font-playfair text-lg font-bold text-[#C5A46B]">T</div>
            <span className="font-playfair text-[15px] font-bold tracking-[0.12em]">TRIMÉMO</span>
          </button>
          <div className="hidden items-center gap-8 font-inter text-sm text-[#0A2342]/65 md:flex">
            <button onClick={() => navigateToSection("fonctionnement")}>Fonctionnement</button>
            <button onClick={() => navigateToSection("formules")}>Formules</button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setView("project");
              }}
            >
              Mon projet
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#0A2342]/10 md:hidden"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <button
              onClick={goToProject}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#C5A46B] px-5 font-inter text-[13px] font-medium"
            >
              Commencer <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="sticky top-[72px] z-40 border-b border-[#0A2342]/5 bg-white px-6 py-4 shadow-sm md:hidden">
          <div className="flex flex-col gap-1 font-inter text-sm">
            <button
              onClick={() => navigateToSection("fonctionnement")}
              className="rounded-xl px-4 py-3 text-left hover:bg-[#F7F5F0]"
            >
              Fonctionnement
            </button>
            <button
              onClick={() => navigateToSection("formules")}
              className="rounded-xl px-4 py-3 text-left hover:bg-[#F7F5F0]"
            >
              Formules
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setView("project");
              }}
              className="rounded-xl px-4 py-3 text-left hover:bg-[#F7F5F0]"
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
              <div className="font-inter text-[11px] uppercase tracking-[0.22em] text-[#C5A46B]">Plateforme académique francophone internationale</div>
              <h1 className="mt-5 font-playfair text-5xl font-bold leading-[0.98] tracking-[-0.02em] lg:text-6xl">Une rédaction guidée par votre sujet réel.</h1>
              <p className="mx-auto mt-7 max-w-[690px] font-inter text-[16px] leading-[1.75] text-[#0A2342]/65">
                Vos consignes, votre contexte, vos documents et vos exigences commandent la génération. Aucun contenu académique préécrit n’est utilisé comme source de remplacement.
              </p>
              <div className="mt-9 flex justify-center">
                <button onClick={goToProject} className="inline-flex h-13 items-center gap-3 rounded-full bg-[#0A2342] px-7 font-inter text-sm font-medium text-white">
                  Créer mon projet <ArrowRight className="h-4 w-4 text-[#C5A46B]" />
                </button>
              </div>
              <div className="mt-7 font-inter text-xs text-[#0A2342]/45">1 page = {WORDS_PER_PAGE} mots · Aperçu gratuit · Paiement avant génération complète</div>
            </div>
          </section>

          <section id="fonctionnement" className="border-y border-[#0A2342]/5 bg-[#F7F5F0] px-6 py-20 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-[1280px]">
              <div className="max-w-[650px]">
                <div className="font-inter text-[11px] uppercase tracking-[0.22em] text-[#C5A46B]">Fonctionnement</div>
                <h2 className="mt-4 font-playfair text-4xl leading-tight">Un flux qui sépare aperçu, validation et rédaction complète.</h2>
              </div>
              <div className="mt-12 grid gap-5 md:grid-cols-4">
                {[
                  ["01", "Votre formule", "Vous choisissez la formule qui correspond à votre niveau ou à votre besoin."],
                  ["02", "Votre dossier", "Sujet, contexte, consignes et documents sont transmis au moteur de génération."],
                  ["03", "Aperçu gratuit", "Une problématique, un plan et une introduction incomplète de 300 mots."],
                  ["04", "Accès complet", "Après paiement : trois problématiques, trois plans puis la rédaction par blocs de 900 mots."],
                ].map(([n, title, text]) => (
                  <div key={n} className="rounded-[20px] border border-[#0A2342]/5 bg-white p-6">
                    <div className="font-inter text-[11px] tracking-[0.2em] text-[#C5A46B]">{n}</div>
                    <div className="mt-3 font-playfair text-xl">{title}</div>
                    <div className="mt-2 font-inter text-[13px] leading-[1.6] text-[#0A2342]/55">{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="formules"
            className="border-y border-[#0A2342]/5 bg-[#F7F5F0] px-6 py-20 lg:px-8 lg:py-24"
          >
            <div className="mx-auto max-w-[1280px]">
              <div>
                <div className="font-inter text-[11px] uppercase tracking-[0.22em] text-[#C5A46B]">
                  Tarifs Trimémo
                </div>
                <h2 className="mt-4 font-playfair text-4xl">
                  Forfaits actuels
                </h2>
                <p className="mt-3 max-w-[760px] font-inter text-sm leading-[1.7] text-[#0A2342]/55">
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
                        ? "border-[#0A2342] bg-[#0A2342] text-white"
                        : "border-[#0A2342]/10 bg-white hover:border-[#0A2342]/25"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-playfair text-2xl">{item.title}</div>
                      {item.id === "MASTER" && (
                        <span className="rounded-full bg-[#C5A46B] px-2.5 py-1 font-inter text-[10px] font-semibold text-[#0A2342]">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <div
                      className={`mt-2 font-inter text-xs ${
                        formula === item.id ? "text-white/55" : "text-[#0A2342]/45"
                      }`}
                    >
                      {item.pages}
                    </div>

                    <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
                      <span className="font-playfair text-3xl">{item.eur}</span>
                      <span
                        className={`pb-1 font-inter text-xs ${
                          formula === item.id ? "text-white/55" : "text-[#0A2342]/45"
                        }`}
                      >
                        {item.fcfa}
                      </span>
                    </div>

                    <div
                      className={`mt-4 font-inter text-xs leading-[1.6] ${
                        formula === item.id ? "text-white/70" : "text-[#0A2342]/60"
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
                <div className="font-inter text-[11px] uppercase tracking-[0.22em] text-[#C5A46B]">
                  Packs 5 documents
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-3">
                  {pricing.packs.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => {
                        const selectedFormula = pack.formula as FormulaId;
                        setFormula(selectedFormula);
                        setProject((current) => ({
                          ...current,
                          formula: selectedFormula,
                        }));
                        setView("project");
                        pushToast("success", `${pack.title} sélectionné.`);
                      }}
                      className={`w-full rounded-[24px] border p-7 text-left transition ${
                        formula === pack.formula
                          ? "border-[#0A2342] bg-[#0A2342] text-white"
                          : "border-[#0A2342]/10 bg-white hover:border-[#0A2342]/25"
                      }`}
                    >
                      <div className="font-playfair text-xl">{pack.title}</div>
                      <div className="mt-2 font-inter text-xs text-[#0A2342]/45">
                        {pack.pages}
                      </div>

                      <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
                        <span className="font-playfair text-3xl">{pack.eur}</span>
                        <span className="pb-1 font-inter text-xs text-[#0A2342]/45">
                          {pack.fcfa}
                        </span>
                      </div>

                      <div className={`mt-4 font-inter text-xs font-semibold ${
                        formula === pack.formula ? "text-[#C5A46B]" : "text-[#C5A46B]"
                      }`}>
                        {pack.saving}
                      </div>

                      <div className={`mt-5 font-inter text-xs font-semibold ${
                        formula === pack.formula ? "text-white" : "text-[#0A2342]"
                      }`}>
                        Sélectionner ce pack →
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-10 rounded-[22px] border border-[#0A2342]/10 bg-white p-6">
                <div className="font-playfair text-xl">
                  Inclus dans tous les forfaits
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {pricingInclusions.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full bg-[#F7F5F0] px-3 py-2 font-inter text-xs text-[#0A2342]/70"
                    >
                      <Check className="h-3.5 w-3.5 text-[#C5A46B]" />
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
        <main className="min-h-[calc(100vh-72px)] bg-[#F7F5F0] px-6 py-8 lg:px-8 lg:py-10">
          <div className="mx-auto max-w-[1220px]">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                {view !== "home" && (
                  <button
                    onClick={() => setView("home")}
                    className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#0A2342]/10 bg-white"
                    aria-label="Retour à l'accueil"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </button>
                )}
                <div>
                <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#C5A46B]">Projet académique</div>
                <h2 className="mt-2 font-playfair text-3xl">{view === "project" ? "Définissez votre demande" : view === "preview" ? "Votre aperçu gratuit" : view === "premium" ? "Vos options premium" : "Rédaction complète"}</h2>
              </div>
              <div className="font-inter text-xs text-[#0A2342]/45">1 page = {WORDS_PER_PAGE} mots</div>
            </div>

            {view === "project" && (
              <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
                <section className="rounded-[24px] border border-[#0A2342]/5 bg-white p-7 lg:p-9">
                  <div className="grid gap-6">
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#0A2342]/65">Sujet exact *</label>
                      <textarea value={project.sujet} onChange={(e) => setProject({ ...project, sujet: e.target.value })} className="mt-2 min-h-[110px] w-full rounded-[16px] border border-[#0A2342]/10 bg-[#FFFEFB] p-4 font-inter text-sm outline-none focus:border-[#0A2342]/30" placeholder="Saisissez le sujet tel qu’il vous a été attribué." />
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#0A2342]/65">Contexte de recherche</label>
                      <textarea value={project.contexte} onChange={(e) => setProject({ ...project, contexte: e.target.value })} className="mt-2 min-h-[110px] w-full rounded-[16px] border border-[#0A2342]/10 bg-[#FFFEFB] p-4 font-inter text-sm outline-none focus:border-[#0A2342]/30" placeholder="Terrain, organisation, population, période, secteur, problématique déjà envisagée, ou toute précision utile. Ne renseignez qu’un pays s’il fait réellement partie du sujet." />
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#0A2342]/65">Consignes de l’établissement ou du client</label>
                      <textarea value={project.consignes} onChange={(e) => setProject({ ...project, consignes: e.target.value })} className="mt-2 min-h-[150px] w-full rounded-[16px] border border-[#0A2342]/10 bg-[#FFFEFB] p-4 font-inter text-sm outline-none focus:border-[#0A2342]/30" placeholder="Collez ici les consignes textuelles, méthodologiques ou de mise en forme." />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#0A2342]/65">Documents de référence</label>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#0A2342]/10 bg-white px-3 py-2 font-inter text-xs">
                          <Paperclip className="h-3.5 w-3.5" /> Ajouter des fichiers
                          <input type="file" multiple accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown" onChange={(e) => void handleFiles(e.target.files)} className="hidden" />
                        </label>
                      </div>
                      <div className="mt-3 rounded-[16px] border border-dashed border-[#0A2342]/15 bg-[#FFFEFB] p-5">
                        <div className="font-inter text-xs text-[#0A2342]/55">PDF, DOCX, TXT ou Markdown. Les documents transmis sont envoyés au moteur OpenAI avec votre demande.</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {project.files.map((file, index) => (
                            <span key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-[#0A2342]/10 bg-white px-3 py-1.5 font-inter text-[11px]">
                              <FileText className="h-3.5 w-3.5" /> {file.name}
                              <button onClick={() => setProject((current) => ({ ...current, files: current.files.filter((_, fileIndex) => fileIndex !== index) }))}><X className="h-3 w-3" /></button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <aside className="h-fit rounded-[24px] border border-[#0A2342]/5 bg-white p-7 lg:sticky lg:top-[98px]">
                  <div className="font-playfair text-xl">Paramètres du projet</div>
                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#0A2342]/65">Formule</label>
                      <div className="mt-2 rounded-[12px] bg-[#0A2342] px-4 py-3 font-inter text-sm text-white">{formulaOptions.find((item) => item.id === project.formula)?.title || "À sélectionner"}</div>
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#0A2342]/65">Niveau</label>
                      <input value={project.niveau} onChange={(e) => setProject({ ...project, niveau: e.target.value })} className="mt-2 h-11 w-full rounded-[12px] border border-[#0A2342]/10 px-4 font-inter text-sm" placeholder="Ex. Master 2" />
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#0A2342]/65">Type de document</label>
                      <input value={project.typeDoc} onChange={(e) => setProject({ ...project, typeDoc: e.target.value })} className="mt-2 h-11 w-full rounded-[12px] border border-[#0A2342]/10 px-4 font-inter text-sm" />
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#0A2342]/65">Nombre de pages</label>
                      <input type="number" min={1} max={200} value={project.pages} onChange={(e) => setProject({ ...project, pages: Math.max(1, Math.min(200, Number(e.target.value) || 1)) })} className="mt-2 h-11 w-full rounded-[12px] border border-[#0A2342]/10 px-4 font-inter text-sm" />
                      <div className="mt-2 font-inter text-[11px] text-[#0A2342]/45">Objectif de rédaction : {targetWords.toLocaleString("fr-FR")} mots</div>
                    </div>
                    <div>
                      <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-[#0A2342]/65">E-mail *</label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-[#0A2342]/30" />
                        <input type="email" value={project.email} onChange={(e) => setProject({ ...project, email: e.target.value })} className="h-11 w-full rounded-[12px] border border-[#0A2342]/10 pl-10 pr-4 font-inter text-sm" placeholder="vous@exemple.com" />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => void generateFreePreview()} disabled={loading} className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0A2342] font-inter text-sm font-medium text-white disabled:opacity-50">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[#C5A46B]" />}
                    Générer mon aperçu gratuit
                  </button>
                </aside>
              </div>
            )}

            {view === "preview" && preview && (
              <div className="grid gap-6 lg:grid-cols-3">
                <section className="rounded-[24px] border border-[#0A2342]/5 bg-white p-7">
                  <div className="flex items-center justify-between gap-4"><div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#C5A46B]">Problématique gratuite</div><Search className="h-4 w-4 text-[#0A2342]/35" /></div>
                  <h3 className="mt-4 font-playfair text-xl">{preview.problematic.title}</h3>
                  <p className="mt-4 font-inter text-sm leading-[1.75] text-[#0A2342]/70">{preview.problematic.question}</p>
                  <div className="mt-5 rounded-[14px] bg-[#F7F5F0] p-4 font-inter text-[12px] leading-[1.6] text-[#0A2342]/65">{preview.problematic.rationale}</div>
                </section>
                <section className="rounded-[24px] border border-[#0A2342]/5 bg-white p-7">
                  <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#C5A46B]">Plan gratuit</div>
                  <h3 className="mt-4 font-playfair text-xl">{preview.plan.title}</h3>
                  <p className="mt-3 font-inter text-sm leading-[1.7] text-[#0A2342]/65">{preview.plan.description}</p>
                  <div className="mt-5 space-y-2">
                    {preview.plan.chapters.map((chapter) => <div key={chapter.id} className="rounded-[12px] bg-[#F7F5F0] p-3"><div className="font-inter text-xs font-semibold">{chapter.title}</div><div className="mt-1 font-inter text-[11px] text-[#0A2342]/55">{chapter.subparts.join(" · ")} · {chapter.wordCount.toLocaleString("fr-FR")} mots</div></div>)}
                  </div>
                </section>
                <section className="rounded-[24px] border border-[#0A2342]/5 bg-white p-7">
                  <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#C5A46B]">Introduction · 300 mots</div>
                  <h3 className="mt-4 font-playfair text-xl">{preview.introduction.title}</h3>
                  <p className="mt-4 whitespace-pre-wrap font-inter text-sm leading-[1.8] text-[#0A2342]/75">{preview.introduction.content}</p>
                  <div className="mt-4 rounded-[12px] bg-amber-50 p-3 font-inter text-[11px] leading-[1.5] text-amber-900">Aperçu volontairement incomplet. La rédaction complète est disponible après paiement.</div>
                </section>
              </div>
            )}

            {view === "preview" && preview && (
              <section className="mt-8 rounded-[24px] border border-[#0A2342]/5 bg-[#0A2342] p-7 text-white lg:p-9">
                <div className="grid gap-8 lg:grid-cols-[1fr_390px] lg:items-center">
                  <div>
                    <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#C5A46B]">Débloquer la suite</div>
                    <h3 className="mt-3 font-playfair text-3xl">3 problématiques · 3 plans · rédaction complète</h3>
                    <p className="mt-3 max-w-[720px] font-inter text-sm leading-[1.7] text-white/65">Le paiement débloque les options complètes et la génération du document selon votre sujet, votre contexte, vos consignes et vos fichiers. Le tarif est calculé selon la formule et le volume.</p>
                  </div>
                  <div className="grid gap-3">
                    <button onClick={() => void startPayment("paypal")} disabled={paymentLoading !== null} className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#C5A46B] font-inter text-sm font-semibold text-[#0A2342] disabled:opacity-60">
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
                    <button key={item.id} onClick={() => setSelectedProblematic(item)} className={`rounded-[24px] border p-7 text-left ${selectedProblematic?.id === item.id ? "border-[#0A2342] bg-[#0A2342] text-white" : "border-[#0A2342]/5 bg-white"}`}>
                      <div className={`font-inter text-[11px] uppercase tracking-[0.2em] ${selectedProblematic?.id === item.id ? "text-[#C5A46B]" : "text-[#C5A46B]"}`}>Problématique {item.id}</div>
                      <h3 className="mt-4 font-playfair text-xl">{item.title}</h3>
                      <p className={`mt-4 font-inter text-sm leading-[1.7] ${selectedProblematic?.id === item.id ? "text-white/70" : "text-[#0A2342]/65"}`}>{item.question}</p>
                      <p className={`mt-4 font-inter text-xs leading-[1.6] ${selectedProblematic?.id === item.id ? "text-white/50" : "text-[#0A2342]/45"}`}>{item.rationale}</p>
                    </button>
                  ))}
                </section>
                <section className="mt-8 grid gap-6 lg:grid-cols-3">
                  {premium.plans.map((plan) => {
                    const isCompatible = Boolean(selectedProblematic);
                    return <button key={plan.id} disabled={!isCompatible} onClick={() => selectedProblematic && selectPremiumPlan(selectedProblematic, plan)} className={`rounded-[24px] border p-7 text-left ${selectedPlan?.id === plan.id ? "border-[#0A2342] bg-[#0A2342] text-white" : "border-[#0A2342]/5 bg-white"}`}>
                      <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#C5A46B]">{plan.approach}</div>
                      <h3 className="mt-4 font-playfair text-xl">{plan.title}</h3>
                      <p className={`mt-3 font-inter text-sm leading-[1.7] ${selectedPlan?.id === plan.id ? "text-white/70" : "text-[#0A2342]/65"}`}>{plan.description}</p>
                      <div className={`mt-5 font-inter text-xs ${selectedPlan?.id === plan.id ? "text-white/50" : "text-[#0A2342]/45"}`}>{plan.totalWords.toLocaleString("fr-FR")} mots · {wordsToPages(plan.totalWords).toFixed(1)} pages</div>
                      <div className="mt-5 space-y-2">{plan.chapters.slice(0, 5).map((chapter) => <div key={chapter.id} className={`rounded-[12px] p-3 ${selectedPlan?.id === plan.id ? "bg-white/10" : "bg-[#F7F5F0]"}`}><div className="font-inter text-xs font-semibold">{chapter.title}</div><div className={`mt-1 font-inter text-[11px] ${selectedPlan?.id === plan.id ? "text-white/50" : "text-[#0A2342]/50"}`}>{chapter.subparts.join(" · ")}</div></div>)}</div>
                      <div className="mt-5 font-inter text-xs font-semibold">{selectedProblematic ? "Choisir ce plan et rédiger" : "Sélectionnez une problématique"}</div>
                    </button>;
                  })}
                </section>
              </div>
            )}

            {view === "writing" && selectedPlan && selectedProblematic && (
              <div className="grid gap-8 lg:grid-cols-[310px_1fr]">
                <aside className="h-fit rounded-[24px] border border-[#0A2342]/5 bg-white p-6 lg:sticky lg:top-[98px]">
                  <div className="font-playfair text-xl">Rédaction complète</div>
                  <div className="mt-2 font-inter text-xs text-[#0A2342]/45">Objectif : {targetWords.toLocaleString("fr-FR")} mots</div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#F7F5F0]"><div className="h-full rounded-full bg-[#C5A46B]" style={{ width: `${progress}%` }} /></div>
                  <div className="mt-2 font-inter text-[11px] text-[#0A2342]/45">{totalDoneWords.toLocaleString("fr-FR")} / {targetWords.toLocaleString("fr-FR")} mots</div>
                  <div className="mt-6 space-y-2">
                    {blocks.map((block) => (
                      <button key={block.id} onClick={() => void generateBlock(block.id)} disabled={block.status === "generating"} className={`w-full rounded-[13px] border p-3 text-left ${block.status === "done" ? "border-[#0A2342] bg-[#0A2342] text-white" : "border-[#0A2342]/5 bg-[#F7F5F0]"}`}>
                        <div className="flex items-center justify-between gap-2"><span className="font-inter text-xs leading-[1.4]">{block.title}</span>{block.status === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> : block.status === "done" ? <Check className="h-4 w-4 text-[#C5A46B]" /> : <span className="font-inter text-[10px]">{block.expectedWords} mots</span>}</div>
                      </button>
                    ))}
                  </div>
                </aside>

                <section className="space-y-6">
                  <div className="rounded-[24px] border border-[#0A2342]/5 bg-white p-7">
                    <div className="font-inter text-[11px] uppercase tracking-[0.2em] text-[#C5A46B]">Paramètres verrouillés</div>
                    <h3 className="mt-3 font-playfair text-2xl">{selectedProblematic.title}</h3>
                    <p className="mt-2 font-inter text-sm text-[#0A2342]/60">{selectedPlan.title}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-[12px] bg-[#F7F5F0] p-3 font-inter text-xs">Contexte : {project.contexte ? "fourni" : "non précisé"}</div><div className="rounded-[12px] bg-[#F7F5F0] p-3 font-inter text-xs">Consignes : {project.consignes ? "fournies" : "non précisées"}</div><div className="rounded-[12px] bg-[#F7F5F0] p-3 font-inter text-xs">Documents : {project.files.length}</div></div>
                  </div>

                  {blocks.filter((block) => block.status === "done").map((block) => (
                    <article key={block.id} className="rounded-[24px] border border-[#0A2342]/5 bg-white p-7 lg:p-9">
                      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-playfair text-2xl">{block.title}</h3><span className="rounded-full bg-[#0A2342] px-3 py-1 font-inter text-[11px] text-white">{block.wordCount} mots</span></div>
                      <div className="mt-6 whitespace-pre-wrap font-inter text-[14px] leading-[1.9] text-[#0A2342]/80">{block.content}</div>
                      {block.sources.length > 0 && <div className="mt-8 border-t border-[#0A2342]/5 pt-6"><div className="font-inter text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C5A46B]">Sources utilisées</div><div className="mt-3 space-y-2">{block.sources.map((source, index) => <div key={index} className="font-inter text-xs text-[#0A2342]/55">{source.author ? `${source.author}. ` : ""}{source.title}{source.year ? ` (${source.year})` : ""}{source.url ? ` · ${source.url}` : ""}</div>)}</div></div>}
                      <button onClick={() => void copy(block.content)} className="mt-7 rounded-full border border-[#0A2342]/10 px-4 py-2 font-inter text-xs">Copier le bloc</button>
                    </article>
                  ))}
                </section>
              </div>
            )}

            {(view === "premium" || view === "writing") && !premium && loading && (
              <div className="rounded-[24px] bg-white p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /><div className="mt-3 font-inter text-sm text-[#0A2342]/55">Préparation de votre espace académique…</div></div>
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
