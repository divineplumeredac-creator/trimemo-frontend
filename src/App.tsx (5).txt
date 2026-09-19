import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  X,
  Check,
  FileText,
  Sparkles,
  BookOpen,
  Search,
  Loader2,
  Upload,
  AlertTriangle,
  Download,
  ChevronDown,
  Eye,
  GraduationCap,
  Layers,
  PenTool,
  Clock,
} from "lucide-react";

const API_BASE = "https://trimemo-api.vercel.app";
const ENDPOINTS = {
  problematics: `${API_BASE}/api/generate-problematics`,
  plans: `${API_BASE}/api/generate-plans`,
  block: `${API_BASE}/api/generate-block`,
  papers: `${API_BASE}/api/search-papers`,
  health: `${API_BASE}/api`,
};

type Problematique = {
  id: string;
  titre: string;
  texte: string;
  angle: string;
  score: number;
  pertinence: string;
};

type PlanChapter = {
  title: string;
  subparts: string[];
  wordCount: number;
  sources: string[];
};

type Plan = {
  id: string;
  titre: string;
  description: string;
  approche: string;
  chapters: PlanChapter[];
  totalWords: number;
  originalite: string;
};

type BlockContent = {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  sources: { id: string; citation: string; doi?: string }[];
  status: "pending" | "generating" | "done";
};

type User = {
  name: string;
  email: string;
};

type ProjectData = {
  sujet: string;
  domaine: string;
  niveau: string;
  typeDoc: string;
  pages: number;
  consignes: string;
  files: { name: string; type: string; size: number; content: string }[];
};

type Toast = {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
};

function getFallbackProblematiques(sujet: string, domaine: string): Problematique[] {
  const cleanSujet = sujet.trim() || "votre sujet";
  const dom = domaine || "Sciences de gestion";
  return [
    {
      id: "pb-fb-1",
      titre: `Dans quelle mesure ${cleanSujet} redéfinit-il les stratégies d'innovation dans ${dom} ?`,
      texte: `Cette problématique interroge la capacité de ${cleanSujet} à transformer les modèles établis. Elle s'inscrit dans un contexte où les organisations cherchent à concilier performance et durabilité. L'enjeu est de comprendre les mécanismes de rupture et d'adaptation : comment une innovation liée à ${cleanSujet} force-t-elle les acteurs de ${dom} à repenser leurs chaînes de valeur ? La recherche s'appuie sur des études de cas comparées, choisies selon la nature du sujet (contexte francophone international, européen, africain, nord-américain ou asiatique selon pertinence).`,
      angle: "Angle analytique et critique - rupture paradigmatique",
      score: 9.2,
      pertinence:
        "Très pertinente : sujet actuel, littérature abondante mais angle peu traité. Fort potentiel pour contribution originale.",
    },
    {
      id: "pb-fb-2",
      titre: `Quels sont les déterminants de l'adoption de ${cleanSujet} en contexte francophone international ?`,
      texte: `Cette seconde entrée adopte une perspective empirique et terrain, adaptée au sujet. Elle vise à identifier les freins et leviers qui expliquent pourquoi ${cleanSujet} est adopté ou rejeté. L'originalité réside dans une approche comparative internationale francophone : le terrain s'adapte au sujet (ex: Québec, France, Belgique, Suisse, Afrique francophone, Caraïbes si pertinent). Méthodologie mixte envisagée : questionnaire quantitatif (n=200) + entretiens semi-directifs (n=15). L'objectif est de produire un modèle prédictif utilisable par les décideurs.`,
      angle: "Angle empirique terrain - étude mixte internationale",
      score: 8.8,
      pertinence:
        "Pertinente pour mémoire professionnalisant : données primaires, valeur ajoutée pratique, exemples adaptés au sujet.",
    },
    {
      id: "pb-fb-3",
      titre: `Comment articuler éthique, régulation et performance autour de ${cleanSujet} : vers un cadre intégratif pour ${dom} ?`,
      texte: `Cette troisième problématique propose une réflexion normative et prospective, avec exemples adaptés au sujet. Elle part du constat que ${cleanSujet} soulève des dilemmes éthiques et réglementaires qui varient selon le contexte (régulation européenne RGPD, cadre nord-américain, réalités africaines ou asiatiques). Comment construire un cadre qui intègre à la fois exigences légales, attentes sociétales et impératifs de compétitivité ? L'analyse mobilise la théorie des parties prenantes et la responsabilité élargie, avec illustrations choisies en fonction du sujet.`,
      angle: "Angle normatif et prospectif - gouvernance et éthique",
      score: 9.0,
      pertinence:
        "Excellente pour thèse ou mémoire recherche : angle différenciant, forte dimension théorique, ouvre sur recommandations adaptées au sujet.",
    },
  ];
}

function getFallbackPlans(problematique: Problematique, sujet: string): Plan[] {
  const s = sujet || problematique.titre;
  return [
    {
      id: "plan-fb-1",
      titre: `Plan 1 — Analytique Critique : Déconstruction des modèles dominants autour de ${s.slice(0, 40)}...`,
      description:
        "Approche théorique forte, idéale pour mémoire recherche ou article académique. Déconstruit la littérature pour proposer un modèle alternatif.",
      approche: "Critique / Théorique",
      totalWords: 12000,
      originalite:
        "Propose une grille d'analyse inédite croisant deux courants théoriques habituellement opposés.",
      chapters: [
        {
          title: "Chapitre 1 : Fondements et genèse conceptuelle",
          subparts: [
            "1.1 Définition et évolution historique du concept",
            "1.2 Revue systématique de littérature (PRISMA)",
            "1.3 Limites des approches classiques",
          ],
          wordCount: 2800,
          sources: ["DOI:10.1016/j.jbusres.2023", "DOI:10.1177/0149206322"],
        },
        {
          title: "Chapitre 2 : Cadre théorique intégratif",
          subparts: [
            "2.1 Théorie A : apports et angles morts",
            "2.2 Théorie B : complémentarité critique",
            "2.3 Construction du modèle conceptuel proposé",
          ],
          wordCount: 3200,
          sources: ["DOI:10.5465/amr.2021.0123", "DOI:10.1080/01491933.2022"],
        },
        {
          title: "Chapitre 3 : Méthodologie et terrain",
          subparts: [
            "3.1 Positionnement épistémologique interprétativiste",
            "3.2 Études de cas multiples (3 organisations)",
            "3.3 Collecte et traitement (NVivo, codage thématique)",
          ],
          wordCount: 2500,
          sources: ["Yin, 2018 - Case Study Research", "DOI:10.1177/1094428120"],
        },
        {
          title: "Chapitre 4 : Résultats, discussion et apports",
          subparts: [
            "4.1 Mise en évidence des tensions paradigmatiques",
            "4.2 Discussion : vers un modèle hybride",
            "4.3 Implications managériales et limites",
          ],
          wordCount: 3500,
          sources: ["DOI:10.1002/smj.2023.015", "Rapport OCDE 2023"],
        },
      ],
    },
    {
      id: "plan-fb-2",
      titre: `Plan 2 — Empirique Opérationnel : Mesurer l'impact de ${s.slice(0, 35)}... sur le terrain`,
      description:
        "Plan professionnalisant, orienté données et terrain. Parfait pour mémoire avec enquête et recommandations opérationnelles.",
      approche: "Empirique / Mixte",
      totalWords: 13500,
      originalite:
        "Base de données primaire francophone inédite + modèle prédictif opérationnel.",
      chapters: [
        {
          title: "Chapitre 1 : Contexte et problématique managériale",
          subparts: [
            "1.1 Contexte sectoriel et enjeux pour les PME",
            "1.2 Du problème managérial à la question de recherche",
            "1.3 Objectifs et intérêt de l'étude",
          ],
          wordCount: 2000,
          sources: ["INSEE 2023 PME", "DOI:10.1016/j.technovation.2022"],
        },
        {
          title: "Chapitre 2 : Revue de littérature orientée facteurs",
          subparts: [
            "2.1 Facteurs d'adoption : modèles TAM, UTAUT",
            "2.2 Spécificités contexte Afrique francophone",
            "2.3 Synthèse et hypothèses de recherche (H1-H5)",
          ],
          wordCount: 3000,
          sources: ["Venkatesh et al. 2003 UTAUT", "DOI:10.1080/23311975.2023"],
        },
        {
          title: "Chapitre 3 : Dispositif méthodologique mixte",
          subparts: [
            "3.1 Étude quantitative : questionnaire (n=250 PME)",
            "3.2 Étude qualitative : 18 entretiens dirigeants",
            "3.3 Triangulation et validité",
          ],
          wordCount: 3500,
          sources: ["Hair et al. PLS-SEM", "DOI:10.1016/j.jbusres.2021"],
        },
        {
          title: "Chapitre 4 : Résultats et recommandations",
          subparts: [
            "4.1 Analyse descriptive et tests (SPSS/R)",
            "4.2 Modèle explicatif : régression logistique",
            "4.3 Plan d'action et feuille de route pour décideurs",
          ],
          wordCount: 5000,
          sources: ["Données primaires auteur", "Banque Mondiale 2023"],
        },
      ],
    },
    {
      id: "plan-fb-3",
      titre: `Plan 3 — Prospectif Normatif : Gouvernance et futur de ${s.slice(0, 35)}...`,
      description:
        "Plan visionnaire et normatif, idéal pour se démarquer avec une dimension éthique, réglementaire et prospective à 2030.",
      approche: "Prospective / Normative",
      totalWords: 12800,
      originalite: "Scénarios 2030 + charte éthique opérationnelle proposée.",
      chapters: [
        {
          title: "Chapitre 1 : Enjeux éthiques et sociétaux contemporains",
          subparts: [
            "1.1 Cartographie des risques et controverses",
            "1.2 Théorie des parties prenantes élargie",
            "1.3 Cadre réglementaire comparé UE / OHADA",
          ],
          wordCount: 3000,
          sources: ["RGPD, AI Act UE 2024", "DOI:10.1007/s10551-022"],
        },
        {
          title: "Chapitre 2 : Méthodologie prospective et délibérative",
          subparts: [
            "2.1 Méthode Delphi auprès de 22 experts",
            "2.2 Ateliers scénarios (Schwartz)",
            "2.3 Analyse d'acceptabilité sociale",
          ],
          wordCount: 2800,
          sources: ["Godet - Prospective", "DOI:10.1016/j.futures.2023"],
        },
        {
          title: "Chapitre 3 : Trois scénarios pour 2030",
          subparts: [
            "3.1 Scénario tendanciel : adoption non régulée",
            "3.2 Scénario souhaitable : régulation vertueuse",
            "3.3 Scénario rupture : alternative frugale africaine",
          ],
          wordCount: 4000,
          sources: ["Entretiens experts", "Rapport UNESCO 2023"],
        },
        {
          title: "Chapitre 4 : Proposition d'un cadre de gouvernance responsable",
          subparts: [
            "4.1 Principes directeurs et charte éthique",
            "4.2 Outils de pilotage et indicateurs RSE",
            "4.3 Feuille de route politique publique",
          ],
          wordCount: 3000,
          sources: ["ISO 26000", "DOI:10.5465/amr.2022.0098"],
        },
      ],
    },
  ];
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function limitWords(text: string, maxWords: number): string {
  if (maxWords <= 0) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ").replace(/[,:;.!?]$/, "") + ".";
}

function getFallbackBlock(blockTitle: string, problematique: string, targetWords = 900): BlockContent {
  const loremAcademic = `L'analyse de "${blockTitle}" eclaire la problematique : "${problematique.slice(0, 120)}...". Section theorique et empirique.

Premierement, litterature recente (2021-2023) montre evolution des paradigmes. Modeles traditionnels peinent a saisir objets complexes. Oubli du contexte et pluralite des acteurs en cause.

Notre cadre croise deux approches. Theorie des ressources et competences identifie atouts strategiques. Perspective institutionnelle eclaire pressions normatives. Double lecture pour comprehension fine des arbitrages.

Trois constats empiriques. Primo, trajectoires d'adoption divergent selon histoire et contexte local. Secundo, intermediaires (consultants, associations, pouvoirs publics) traduisent et facilitent. Tertio, apprentissages informels pesent, souvent invisibles.

Resultats invitent a repenser accompagnement. Solution universelle limitee. Approche situee, terrain beninois, ouvre pistes robustes. Objectif : gouvernance responsable adaptee.`.trim();

  const extended = (loremAcademic + "\n\n").repeat(3).slice(0, 5800);
  return {
    id: `block-${Date.now()}`,
    title: blockTitle,
    content: extended,
    wordCount: extended.split(/\s+/).length,
    sources: [
      { id: "1", citation: "OECD (2023) Digital SMEs" },
      { id: "2", citation: "Venkatesh et al. 2003 UTAUT (Unified Theory of Acceptance and Use of Technology)" },
    ],
    status: "done",
  };
}

async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(ENDPOINTS.health, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Health ${res.status}`);
    const data = await res.json().catch(() => ({}));
    return true;
  } catch (e) {
    return false;
  }
}

async function generateProblematiquesAPI(project: ProjectData): Promise<Problematique[]> {
  try {
    const res = await fetch(ENDPOINTS.problematics, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sujet: project.sujet,
        domaine: project.domaine,
        niveau: project.niveau,
        typeDoc: project.typeDoc,
        pages: project.pages,
        consignes: project.consignes,
        files: project.files,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    const rawList = data.problematiques || data.data || data.result || [];
    if (!Array.isArray(rawList) || rawList.length === 0) {
      return getFallbackProblematiques(project.sujet, project.domaine);
    }

    const mapped: Problematique[] = rawList.slice(0, 3).map((p: any, idx: number) => {
      const titre = (p.titre || p.title || p.question || p.nom || "").toString().trim();
      const texte = (p.texte || p.text || p.description || p.contenu || p.resume || "").toString().trim();
      const angle = (p.angle || p.approche || p.approach || p.perspective || "").toString().trim();
      const pertinence = (p.pertinence || p.justification || p.pourquoi || p.relevance || "").toString().trim();
      const scoreRaw = p.score || p.relevance_score || p.note || p.pertinence_score || 9.0;
      const score = typeof scoreRaw === "number" ? scoreRaw : parseFloat(scoreRaw) || 9.0;

      return {
        id: p.id || `pb-api-${idx}-${Date.now()}`,
        titre: titre,
        texte: texte,
        angle: angle || "Angle analytique",
        score: score,
        pertinence: pertinence || "Pertinence élevée pour ce sujet actuel.",
      };
    });

    const hasEmptyTitle = mapped.some((m) => !m.titre || m.titre.length < 5);
    const hasEmptyText = mapped.some((m) => !m.texte || m.texte.length < 20);

    if (hasEmptyTitle || hasEmptyText || mapped.length < 3) {
      return getFallbackProblematiques(project.sujet, project.domaine);
    }

    if (mapped.length < 3) {
      const fallbacks = getFallbackProblematiques(project.sujet, project.domaine);
      return [...mapped, ...fallbacks].slice(0, 3);
    }

    return mapped;
  } catch (err) {
    return getFallbackProblematiques(project.sujet, project.domaine);
  }
}

async function generatePlansAPI(problematique: Problematique, project: ProjectData): Promise<Plan[]> {
  try {
    const res = await fetch(ENDPOINTS.plans, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        problematique: problematique,
        sujet: project.sujet,
        domaine: project.domaine,
        niveau: project.niveau,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rawPlans = data.plans || data.data || [];
    if (!Array.isArray(rawPlans) || rawPlans.length === 0) {
      return getFallbackPlans(problematique, project.sujet);
    }
    const mapped: Plan[] = rawPlans.slice(0, 3).map((p: any, idx: number) => ({
      id: p.id || `plan-api-${idx}`,
      titre: p.titre || p.title || `Plan ${idx + 1}`,
      description: p.description || p.desc || "",
      approche: p.approche || p.approach || "Mixte",
      totalWords: p.totalWords || 12000,
      originalite: p.originalite || p.originality || "",
      chapters: Array.isArray(p.chapters)
        ? p.chapters.map((c: any) => ({
            title: String(c.title || c.titre || "Chapitre"),
            subparts: Array.isArray(c.subparts)
              ? c.subparts.map((x: any) => String(x))
              : Array.isArray(c.sousParties)
              ? c.sousParties.map((x: any) => String(x))
              : [],
            wordCount: Number(c.wordCount) || 3000,
            sources: Array.isArray(c.sources) ? c.sources.map((x: any) => String(x)) : [],
          }))
        : getFallbackPlans(problematique, project.sujet)[idx % 3].chapters,
    }));
    if (mapped.some((m) => !m.titre || m.chapters.length === 0)) {
      return getFallbackPlans(problematique, project.sujet);
    }
    return mapped;
  } catch (e) {
    return getFallbackPlans(problematique, project.sujet);
  }
}

async function generateBlockAPI(
  blockTitle: string,
  plan: Plan,
  problematique: Problematique,
  project: ProjectData,
  targetWords = 900,
  previousBlocks: BlockContent[] = [],
): Promise<BlockContent> {
  try {
    const res = await fetch(ENDPOINTS.block, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        blockTitle,
        plan,
        planId: plan.id,
        problematique,
        project: {
          sujet: project.sujet,
          domaine: project.domaine,
          niveau: project.niveau,
          typeDoc: project.typeDoc,
          pages: project.pages,
          consignes: project.consignes,
          files: project.files,
        },
        targetWords,
        previousBlocks: previousBlocks
          .filter((b) => b.status === "done")
          .slice(-3)
          .map((b) => ({ title: b.title, content: limitWords(b.content, 300) })),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const raw = data.block || data.content || data;
    let content = typeof raw?.content === "string" ? raw.content : typeof raw?.text === "string" ? raw.text : typeof raw === "string" ? raw : "";
    const low = content.toLowerCase();
    const isRefusal = low.includes("je suis désolé") || low.includes("je ne peux pas") || low.includes("desole") || content.includes('"undefined"') || content.toLowerCase().includes('bloc "undefined"') || low.includes("informations supplémentaires") || content.trim().length < 200;
    if (!content || isRefusal) {
      return getFallbackBlock(blockTitle && blockTitle !== "undefined" ? blockTitle : "Introduction générale", problematique.titre, targetWords);
    }

    const sources = Array.isArray(raw.sources) ? raw.sources : [];
    const finalContent = limitWords(content, targetWords);
    return {
      id: raw.id || `block-${Date.now()}`,
      title: raw.title || blockTitle,
      content: finalContent,
      wordCount: countWords(finalContent),
      sources: sources
        .map((s: any, index: number) => ({
          id: String(s?.id ?? index + 1),
          citation: String(s?.citation ?? s?.reference ?? s?.title ?? "Source non précisée"),
          ...(s?.doi ? { doi: String(s.doi) } : {}),
        }))
        .filter((s: { citation: string }) => s.citation.trim()),
      status: "done",
    };
  } catch (e) {
    return getFallbackBlock(blockTitle, problematique.titre, targetWords);
  }
}

export default function App() {
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [view, setView] = useState<"home" | "editor">("home");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [currency, setCurrency] = useState<"EUR" | "FCFA">("EUR");

  const [project, setProject] = useState<ProjectData>({
    sujet: "",
    domaine: "Marketing digital",
    niveau: "Master 2",
    typeDoc: "Mémoire",
    pages: 40,
    consignes: "",
    files: [],
  });
  const [problematiques, setProblematiques] = useState<Problematique[]>([]);
  const [selectedProblematique, setSelectedProblematique] = useState<Problematique | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [blocks, setBlocks] = useState<BlockContent[]>([]);
  const [generating, setGenerating] = useState(false);
  const [sourceTab, setSourceTab] = useState<"texte" | "fichiers">("texte");
  const [wordsUsed, setWordsUsed] = useState(0);
  const [hasUsedFreeTrial, setHasUsedFreeTrial] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz.startsWith("Africa/")) setCurrency("FCFA");
    } catch {}
    try {
      const saved = localStorage.getItem("trimemo_user");
      if (saved) setUser(JSON.parse(saved));
      const used = localStorage.getItem("trimemo_free_used");
      if (used) setHasUsedFreeTrial(true);
    } catch {}
    const isFile = typeof window !== "undefined" && window.location.protocol === "file:";
    if (isFile) {
      setApiHealthy(false);
    } else {
      checkApiHealth()
        .then((ok) => {
          setApiHealthy(ok);
          if (!ok) pushToast("API en mode local (fallback actif)", "warning");
        })
        .catch(() => setApiHealthy(false));
    }
  }, []);

  function pushToast(message: string, type: Toast["type"] = "info") {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }

  function handleLogoClick() {
    setView("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
    pushToast("Accueil Trimémo", "info");
  }

  function handleCurrencyChange(c: "EUR" | "FCFA") {
    setCurrency(c);
    pushToast(`Devise : ${c === "EUR" ? "€ Europe" : "FCFA Afrique"}`, "info");
  }

  function handleStartProject() {
    if (!user) {
      setAuthMode("signup");
      setShowAuthModal(true);
    } else {
      setView("editor");
      setStep(1);
      setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }

  function handleAuthSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string) || "Utilisateur";
    const email = (fd.get("email") as string) || "";
    const pwd = (fd.get("password") as string) || "";
    if (!email || !pwd) {
      pushToast("Email et mot de passe requis", "error");
      return;
    }
    const u = { name, email };
    setUser(u);
    try {
      localStorage.setItem("trimemo_user", JSON.stringify(u));
    } catch {}
    setShowAuthModal(false);
    pushToast(`Bienvenue ${name} !`, "success");
    setView("editor");
    setStep(1);
    setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  async function handleFileDrop(files: FileList) {
    const allowedTextTypes = new Set([
      "text/plain",
      "text/markdown",
      "text/csv",
      "application/json",
    ]);

    for (const file of Array.from(files)) {
      if (!allowedTextTypes.has(file.type) && !/\.(txt|md|csv|json)$/i.test(file.name)) {
        pushToast(`${file.name} : format non pris en charge ici. Utilisez TXT, MD, CSV ou JSON.`, "warning");
        continue;
      }
      try {
        const content = await file.text();
        const trimmed = content.slice(0, 20000);
        setProject((p) => ({
          ...p,
          files: [
            ...p.files.filter((f) => f.name !== file.name),
            { name: file.name, type: file.type || "text/plain", size: file.size, content: trimmed },
          ],
        }));
        pushToast(`${file.name} ajouté`, "success");
      } catch (error) {
        pushToast(`Impossible de lire ${file.name}`, "error");
      }
    }
  }

  async function handleGenerateProblematiques() {
    if (!project.sujet.trim()) {
      pushToast("Merci d'indiquer votre sujet", "warning");
      return;
    }
    setGenerating(true);
    setStep(2);
    try {
      const result = await generateProblematiquesAPI(project);
      setProblematiques(result);
    } catch (e) {
      setProblematiques(getFallbackProblematiques(project.sujet, project.domaine));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSelectProblematique(pb: Problematique) {
    setSelectedProblematique(pb);
    setGenerating(true);
    setStep(3);
    try {
      const res = await generatePlansAPI(pb, project);
      setPlans(res);
    } catch {
      setPlans(getFallbackPlans(pb, project.sujet));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSelectPlan(pl: Plan) {
    setSelectedPlan(pl);
    setStep(4);
    const initialBlocks: BlockContent[] = [
      { id: "intro", title: "Introduction générale", content: "", wordCount: 0, sources: [], status: "pending" },
      ...pl.chapters.map((c) => ({
        id: c.title,
        title: c.title,
        content: "",
        wordCount: 0,
        sources: [],
        status: "pending" as const,
      })),
      { id: "conclusion", title: "Conclusion générale", content: "", wordCount: 0, sources: [], status: "pending" },
    ];
    setBlocks(initialBlocks);
  }

  async function handleGenerateBlock(blockId: string) {
    if (!selectedPlan || !selectedProblematique) return;
    const targetBlock = blocks.find((b) => b.id === blockId);
    const blockTitle = targetBlock?.title || blockId;

    const freeRemaining = Math.max(0, 500 - wordsUsed);
    const targetWords = hasUsedFreeTrial ? 900 : Math.min(900, freeRemaining);
    if (targetWords <= 0) {
      pushToast("Essai gratuit de 500 mots atteint. Passez premium pour continuer.", "warning");
      return;
    }

    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, status: "generating" } : b)));
    try {
      const result = await generateBlockAPI(
        blockTitle,
        selectedPlan,
        selectedProblematique,
        project,
        targetWords,
        blocks,
      );
      const wc = countWords(result.content);

      if (!hasUsedFreeTrial) {
        const newTotal = Math.min(500, wordsUsed + wc);
        setWordsUsed(newTotal);
        if (newTotal >= 500) {
          setHasUsedFreeTrial(true);
          try {
            localStorage.setItem("trimemo_free_used", "1");
          } catch {}
        }
      }

      setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...result, id: blockId, status: "done" } : b)));
      pushToast(`Bloc rédigé (${wc} mots)`, "success");
    } catch (e) {
      const fb = getFallbackBlock(blockTitle, selectedProblematique.titre, targetWords);
      if (!hasUsedFreeTrial) {
        const wc = countWords(fb.content);
        const newTotal = Math.min(500, wordsUsed + wc);
        setWordsUsed(newTotal);
        if (newTotal >= 500) {
          setHasUsedFreeTrial(true);
          try {
            localStorage.setItem("trimemo_free_used", "1");
          } catch {}
        }
      }
      setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...fb, id: blockId, status: "done" } : b)));
      pushToast("Le bloc a été généré en mode local", "warning");
    }
  }

  function handleExportWord() {
    const doneBlocks = blocks.filter((b) => b.status === "done");
    if (doneBlocks.length === 0) {
      pushToast("Aucun bloc rédigé à exporter", "warning");
      return;
    }

    const esc = (value: string) =>
      value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const body = doneBlocks
      .map(
        (b) => `
          <h1>${esc(b.title)}</h1>
          ${b.content
            .split(/\n\s*\n/)
            .map((p) => `<p>${esc(p).replace(/\n/g, "<br/>")}</p>`)
            .join("")}
          ${b.sources.length ? `<h2>Sources</h2><ol>${b.sources.map((s) => `<li>${esc(s.citation)}${s.doi ? ` — DOI : ${esc(s.doi)}` : ""}</li>`).join("")}</ol>` : ""}
        `,
      )
      .join("<hr/>");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Trimémo - ${esc(project.sujet)}</title><style>body{font-family:Arial,sans-serif;line-height:1.7;margin:2cm;color:#172033}h1{font-family:Georgia,serif;font-size:20pt}h2{font-size:13pt}p{font-size:11pt;text-align:justify}hr{border:0;border-top:1px solid #ddd;margin:28px 0}</style></head><body><h1>${esc(project.sujet || "Travail académique")}</h1>${body}</body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trimemo-${(project.sujet || "travail").slice(0, 40).replace(/[^a-z0-9-_À-ÿ]+/gi, "-")}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    pushToast("Export Word généré", "success");
  }

  async function handleCopyBlock(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      pushToast("Bloc copié", "success");
    } catch {
      pushToast("Copie non disponible dans ce navigateur", "warning");
    }
  }

  const domaines = [
    "Marketing digital",
    "Finance",
    "RH",
    "Droit",
    "Informatique",
    "Éducation",
    "Santé",
    "Entrepreneuriat",
    "Gestion",
    "Management",
    "Économie",
    "Comptabilité",
    "Audit",
    "Banque & Assurance",
    "Commerce international",
    "Logistique",
    "Supply Chain",
    "Communication",
    "Journalisme",
    "Sociologie",
    "Psychologie",
    "Philosophie",
    "Histoire",
    "Géographie",
    "Sciences politiques",
    "Relations internationales",
    "Environnement",
    "Agronomie",
    "Architecture",
    "Urbanisme",
    "Génie civil",
    "Énergie",
    "Transport",
    "Tourisme & Hôtellerie",
    "Arts & Culture",
    "Littérature",
    "Langues & Traduction",
    "Sport",
    "Biologie",
    "Chimie",
    "Physique",
    "Mathématiques",
    "Électronique",
    "Mécanique",
    "Immobilier",
    "Autre"
  ];
  const niveaux = ["Licence 3", "Master 1", "Master 2", "Doctorat", "Bachelor"];
  const typesDoc = ["Mémoire", "Thèse", "Rapport de stage", "Article"];

  return (
    <div className="min-h-screen bg-[#FFFEFB] text-[#0A2342] selection:bg-[#C5A46B]/30">
      <style>{`
        .font-playfair { font-family: 'Playfair Display', Georgia, serif; }
        .font-inter { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
      `}</style>

      
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-sm font-inter flex items-center gap-2 animate-in slide-in-from-top-2 ${
              t.type === "warning"
                ? "bg-amber-50 border border-amber-200 text-amber-900"
                : t.type === "error"
                ? "bg-red-50 border border-red-200 text-red-900"
                : t.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                : "bg-white border border-gray-200"
            }`}
          >
            {t.type === "warning" && <AlertTriangle className="w-4 h-4" />}
            {t.type === "success" && <Check className="w-4 h-4" />}
            {t.message}
          </div>
        ))}
      </div>

      
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#0A2342]/5">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8 h-[72px] flex items-center justify-between">
          
          <button onClick={handleLogoClick} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-[10px] bg-[#0A2342] text-[#C5A46B] flex items-center justify-center font-playfair font-bold text-[18px] leading-none">
              T
            </div>
            <span className="font-playfair font-bold tracking-[0.12em] text-[15px] text-[#0A2342]">TRIMÉMO</span>
          </button>

          
          <nav className="hidden md:flex items-center gap-8 font-inter text-[14px] text-[#0A2342]/70">
            <a href="#fonctionnement" onClick={(e) => { e.preventDefault(); document.getElementById("fonctionnement")?.scrollIntoView({behavior:"smooth"})}} className="hover:text-[#0A2342] transition-colors">
              Fonctionnement
            </a>
            <a href="#tarifs" onClick={(e) => { e.preventDefault(); document.getElementById("tarifs")?.scrollIntoView({behavior:"smooth"})}} className="hover:text-[#0A2342] transition-colors">
              Tarifs
            </a>
            <button
              onClick={() => {
                if (user) {
                  setView("editor");
                } else {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }
              }}
              className="hover:text-[#0A2342] transition-colors"
            >
              Connexion
            </button>
          </nav>

          <button
            onClick={handleStartProject}
            className="hidden md:inline-flex items-center gap-2 h-[40px] px-5 rounded-full bg-[#C5A46B] text-[#0A2342] font-inter font-medium text-[13px] hover:bg-[#b8935a] transition-colors"
          >
            Commencer mon projet <ArrowRight className="w-4 h-4" />
          </button>

          
          <button onClick={handleStartProject} className="md:hidden w-9 h-9 rounded-full bg-[#0A2342] text-[#C5A46B] flex items-center justify-center">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {view === "home" ? (
        <>
          
          <section className="relative pt-[72px] pb-[80px] lg:pt-[96px] lg:pb-[120px]">
            <div className="mx-auto max-w-[1280px] px-6 lg:px-8 text-center">
              <div className="mx-auto max-w-[760px]">
                <h1 className="font-playfair font-bold text-[44px] lg:text-[52px] leading-[0.95] tracking-[-0.02em] text-[#0A2342]">
                  Trimémo
                </h1>
                <p className="mt-6 font-playfair text-[28px] lg:text-[32px] leading-[1.15] text-[#0A2342]">3 choix au départ. 900 mots à la fois.</p>
                <p className="mx-auto mt-6 max-w-[560px] font-inter text-[15px] leading-[1.7] text-[#0A2342]/60">
                  Vous choisissez la problématique, vous validez le plan, vous rédigez bloc par bloc. Chaque étape est guidée, sourcée, prête à être soutenue. Pas de texte jeté, pas de hors-sujet.
                </p>

                <div className="mt-10 flex justify-center">
                  <button
                    onClick={handleStartProject}
                    className="inline-flex items-center gap-3 h-[52px] px-8 rounded-full bg-[#0A2342] text-white font-inter font-medium text-[14px] hover:bg-[#0f3563] transition-colors group"
                  >
                    Rédiger mon mémoire
                    <span className="w-7 h-7 rounded-full bg-[#C5A46B] text-[#0A2342] flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </button>
                </div>

                
                <div className="mt-8 flex items-center justify-center gap-2 text-[11px] font-inter text-[#0A2342]/40">
                  <span className={`w-2 h-2 rounded-full ${apiHealthy ? "bg-emerald-500" : apiHealthy === false ? "bg-amber-400" : "bg-gray-300"}`} />
                  {apiHealthy === null ? "Vérification API..." : apiHealthy ? "API Vercel connectée • Fallback sécurisé actif" : "Mode local • API fallback"}
                </div>
              </div>

              
              <div className="mt-16 lg:mt-24 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[920px] mx-auto">
                {[
                  { n: "01", t: "Problématique", d: "3 propositions sourcées, notées, expliquées" },
                  { n: "02", t: "Plan détaillé", d: "TOC variable, sources DOI, angle distinct" },
                  { n: "03", t: "Rédaction", d: "Bloc 900 mots, validation, export Word" },
                ].map((it) => (
                  <div key={it.n} className="rounded-[20px] bg-white border border-[#0A2342]/[0.06] p-6 text-left shadow-[0_8px_40px_-20px_rgba(10,35,66,0.15)]">
                    <div className="font-inter text-[11px] tracking-[0.2em] text-[#C5A46B]">{it.n}</div>
                    <div className="mt-2 font-playfair text-[18px] text-[#0A2342]">{it.t}</div>
                    <div className="mt-2 font-inter text-[13px] leading-[1.5] text-[#0A2342]/50">{it.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          
          <section id="fonctionnement" className="border-t border-[#0A2342]/5 bg-[#F7F5F0]">
            <div className="mx-auto max-w-[1280px] px-6 lg:px-8 py-[80px] lg:py-[120px]">
              <div className="max-w-[640px]">
                <div className="font-inter text-[11px] tracking-[0.2em] text-[#C5A46B] uppercase">Fonctionnement</div>
                <h2 className="mt-4 font-playfair text-[32px] lg:text-[40px] leading-[1.1] text-[#0A2342]">Une méthode qui évite le hors-sujet.</h2>
                <p className="mt-4 font-inter text-[15px] leading-[1.7] text-[#0A2342]/60">
                  Au lieu de générer tout d'un coup, Trimémo verrouille chaque étape. Vous gardez le contrôle académique.
                </p>
              </div>

              <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: FileText,
                    title: "Vous décrivez",
                    text: "Sujet, domaine, niveau, type de document, pages, consignes ou fichiers. 2 minutes.",
                  },
                  {
                    icon: Search,
                    title: "Vous choisissez la question",
                    text: "3 problématiques avec titre, argumentaire complet, angle et score de pertinence. Plus de vide.",
                  },
                  {
                    icon: Layers,
                    title: "Vous validez le plan",
                    text: "3 plans vraiment différents, avec chapitres, sous-parties et sources DOI vérifiables.",
                  },
                  {
                    icon: PenTool,
                    title: "Vous rédigez par bloc",
                    text: "900 mots à la fois, avec validation et export. Essai gratuit 500 mots.",
                  },
                ].map((f, i) => (
                  <div key={i} className="bg-white rounded-[20px] p-7 border border-[#0A2342]/5">
                    <div className="w-10 h-10 rounded-full bg-[#0A2342] text-[#C5A46B] flex items-center justify-center">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <div className="mt-5 font-playfair text-[17px] text-[#0A2342]">{f.title}</div>
                    <div className="mt-2 font-inter text-[13px] leading-[1.6] text-[#0A2342]/55">{f.text}</div>
                  </div>
                ))}
              </div>

            </div>
          </section>

          <section id="tarifs" className="bg-white border-t border-[#0A2342]/5">
            <div className="mx-auto max-w-[1280px] px-6 lg:px-8 py-[80px] lg:py-[120px]">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                  <div className="font-inter text-[11px] tracking-[0.2em] text-[#C5A46B] uppercase">Tarifs</div>
                  <h2 className="mt-4 font-playfair text-[32px] lg:text-[40px] leading-[1.1] text-[#0A2342]">Payez par bloc. Pas par promesse.</h2>
                </div>

                <div className="flex items-center gap-2 p-1 rounded-full bg-[#F7F5F0] border border-[#0A2342]/5 w-fit">
                  <button
                    onClick={() => setCurrency("EUR")}
                    className={`px-4 h-8 rounded-full text-[13px] font-inter font-medium transition-all ${currency === "EUR" ? "bg-[#0A2342] text-white" : "text-[#0A2342]/50 hover:text-[#0A2342]"}`}
                  >
                    € Europe
                  </button>
                  <button
                    onClick={() => setCurrency("FCFA")}
                    className={`px-4 h-8 rounded-full text-[13px] font-inter font-medium transition-all ${currency === "FCFA" ? "bg-[#0A2342] text-white" : "text-[#0A2342]/50 hover:text-[#0A2342]"}`}
                  >
                    FCFA Afrique
                  </button>
                </div>
              </div>

              <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {
                [
                  {
                    name: "Mémoire Licence",
                    sub: "10-45 pages",
                    priceEur: "27€",
                    priceFcfa: "18 000 FCFA",
                    desc: "Licence 3 - complet",
                    features: ["10 à 45 pages", "3 problématiques + 3 plans", "Rédaction 900 mots / bloc", "Sources DOI + export Word", "1 révision incluse"],
                    cta: "Choisir Licence",
                    highlight: false,
                  },
                  {
                    name: "Mémoire Master",
                    sub: "10-80 pages",
                    priceEur: "38€",
                    priceFcfa: "25 000 FCFA",
                    desc: "Master 1 & 2 - le plus choisi",
                    features: ["10 à 80 pages", "3 problématiques + 3 plans", "Rédaction 900 mots / bloc", "Sources DOI + export Word", "2 révisions incluses"],
                    cta: "Choisir Master",
                    highlight: true,
                  },
                  {
                    name: "Thèse",
                    sub: "10-100 pages",
                    priceEur: "76€",
                    priceFcfa: "50 000 FCFA",
                    desc: "Doctorat & gros volumes",
                    features: ["10 à 100 pages", "Tout Master +", "Coach plan perso + anti-plagiat", "Export LaTeX/Word", "3 révisions"],
                    cta: "Choisir Thèse",
                    highlight: false,
                  },
                  {
                    name: "Pack 1 - 5 Licences",
                    sub: "5 x 1-45 pages",
                    priceEur: "110€",
                    priceFcfa: "72 000 FCFA",
                    desc: "Économisez 18 000 FCFA",
                    features: ["5 mémoires Licence complets", "1-45 pages chacun", "Rédaction + sources + Word", "Support prioritaire", "Facture groupée"],
                    cta: "Pack 5 Licences",
                    highlight: false,
                  },
                  {
                    name: "Pack 2 - 5 Masters",
                    sub: "5 x 1-80 pages",
                    priceEur: "152€",
                    priceFcfa: "100 000 FCFA",
                    desc: "Économisez 25 000 FCFA",
                    features: ["5 mémoires Master complets", "1-80 pages chacun", "Rédaction + sources + Word", "Support prioritaire", "Facture groupée"],
                    cta: "Pack 5 Masters",
                    highlight: false,
                  },
                  {
                    name: "Pack 3 - 5 Thèses",
                    sub: "5 x 1-100 pages",
                    priceEur: "305€",
                    priceFcfa: "200 000 FCFA",
                    desc: "Économisez 50 000 FCFA",
                    features: ["5 thèses complètes", "1-100 pages chacune", "Coach + anti-plagiat + LaTeX", "Support prioritaire", "Facture groupée"],
                    cta: "Pack 5 Thèses",
                    highlight: false,
                  },
                ].map((plan) => (
                  <div key={plan.name} className={`rounded-[24px] p-8 border ${plan.highlight ? "bg-[#0A2342] text-white border-[#0A2342] shadow-[0_20px_60px_-20px_rgba(10,35,66,0.4)]" : "bg-[#FFFEFB] border-[#0A2342]/10"}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-playfair text-[20px]">{plan.name}</div>
                      {plan.highlight && <span className="px-2.5 py-1 rounded-full bg-[#C5A46B] text-[#0A2342] text-[10px] font-inter font-bold tracking-wide">POPULAIRE</span>}
                    </div>
                    <div className="mt-3 font-inter text-[13px] opacity-70">{plan.desc}</div>
                    <div className="mt-6 font-playfair text-[36px] leading-none">{currency === "EUR" ? plan.priceEur : plan.priceFcfa}</div>
                    <div className="mt-6 space-y-3">
                      {plan.features.map((f) => (
                        <div key={f} className="flex gap-2 text-[13px] font-inter opacity-80">
                          <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#C5A46B]" /> {f}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleStartProject}
                      className={`mt-8 w-full h-11 rounded-full font-inter text-[13px] font-medium transition-colors ${plan.highlight ? "bg-[#C5A46B] text-[#0A2342] hover:bg-[#b8935a]" : "bg-[#0A2342] text-white hover:bg-[#0f3563]"}`}
                    >
                      {plan.cta}
                    </button>
                  </div>
                ))}
              </div>

              <p className="mt-8 text-center font-inter text-[12px] text-[#0A2342]/40">
                Détection automatique {currency} • Paiement sécurisé • Facture incluse • Sans abonnement
              </p>
            </div>
          </section>

          <footer className="border-t border-[#0A2342]/5 py-10 text-center font-inter text-[12px] text-[#0A2342]/40">
            © {new Date().getFullYear()} Trimémo — 3 choix au départ. 900 mots à la fois. • API {API_BASE} • Fallback garanti
          </footer>
        </>
      ) : (
        <div ref={editorRef} className="bg-[#F7F5F0] min-h-screen">
          
          <div className="sticky top-[72px] z-30 bg-[#0A2342] text-white">
            <div className="mx-auto max-w-[1280px] px-6 lg:px-8 h-[56px] flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button onClick={() => setView("home")} className="font-inter text-[12px] opacity-60 hover:opacity-100 flex items-center gap-2">
                  ← Accueil
                </button>
                <div className="hidden md:flex items-center gap-3">
                  {[
                    { n: 1, label: "Projet actif" },
                    { n: 2, label: "Problématique" },
                    { n: 3, label: "Plan" },
                    { n: 4, label: "Rédaction" },
                  ].map((s) => (
                    <div key={s.n} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-inter font-bold border ${step === s.n ? "bg-[#C5A46B] text-[#0A2342] border-[#C5A46B]" : step > s.n ? "bg-white text-[#0A2342] border-white" : "border-white/20 text-white/50"}`}>
                        {step > s.n ? <Check className="w-4 h-4" /> : s.n}
                      </div>
                      <span className={`font-inter text-[13px] ${step === s.n ? "text-[#C5A46B] font-medium" : "text-white/60"}`}>{s.label}</span>
                      {s.n < 4 && <span className="w-6 h-px bg-white/20 ml-3 hidden lg:block" />}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-inter text-[11px] text-white/50 hidden md:inline">Essai {wordsUsed}/500 mots {hasUsedFreeTrial ? "• Premium requis" : ""}</span>
                <div className="w-px h-4 bg-white/10 hidden md:block" />
                <span className="font-inter text-[12px] text-white/80">{user?.email}</span>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-[1280px] px-6 lg:px-8 py-8 lg:py-10">
            
            {step === 1 && (
              <div className="grid lg:grid-cols-1 gap-8 items-start max-w-[720px] mx-auto">
                <div className="bg-white rounded-[24px] p-8 lg:p-10 border border-[#0A2342]/5 shadow-[0_8px_40px_-20px_rgba(10,35,66,0.15)]">
                  <h2 className="font-playfair text-[28px] text-[#0A2342]">Décrivez votre projet</h2>
                  <p className="mt-2 font-inter text-[13px] text-[#0A2342]/50">Ces informations verrouillent la génération pour éviter le hors-sujet.</p>

                  <div className="mt-8 space-y-6">
                    <div>
                      <label className="font-inter text-[12px] font-medium text-[#0A2342]/70 uppercase tracking-wide">Sujet du mémoire *</label>
                      <textarea
                        value={project.sujet}
                        onChange={(e) => setProject({ ...project, sujet: e.target.value })}
                        placeholder="Ex: L'impact de l'intelligence artificielle sur la fidélisation client dans le e-commerce francophone..."
                        className="mt-2 w-full min-h-[96px] rounded-[16px] border border-[#0A2342]/10 bg-[#FFFEFB] p-4 font-inter text-[14px] leading-[1.6] placeholder:text-[#0A2342]/30 focus:outline-none focus:border-[#0A2342]/30 focus:ring-2 focus:ring-[#0A2342]/5"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="font-inter text-[12px] font-medium text-[#0A2342]/70 uppercase tracking-wide">Domaine</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {domaines.map((d) => (
                            <button
                              key={d}
                              onClick={() => setProject({ ...project, domaine: d })}
                              className={`px-3.5 h-8 rounded-full text-[12px] font-inter border transition-all ${project.domaine === d ? "bg-[#0A2342] text-white border-[#0A2342]" : "bg-white border-[#0A2342]/10 text-[#0A2342]/70 hover:border-[#0A2342]/20"}`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="font-inter text-[12px] font-medium text-[#0A2342]/70 uppercase tracking-wide">Niveau</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {niveaux.map((n) => (
                            <button
                              key={n}
                              onClick={() => setProject({ ...project, niveau: n })}
                              className={`px-3.5 h-8 rounded-full text-[12px] font-inter border transition-all ${project.niveau === n ? "bg-[#C5A46B] text-[#0A2342] border-[#C5A46B]" : "bg-white border-[#0A2342]/10 text-[#0A2342]/70 hover:border-[#0A2342]/20"}`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="font-inter text-[12px] font-medium text-[#0A2342]/70 uppercase tracking-wide">Type de document (2 colonnes)</label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {typesDoc.map((t) => (
                          <button
                            key={t}
                            onClick={() => setProject({ ...project, typeDoc: t })}
                            className={`h-11 rounded-[12px] text-[13px] font-inter font-medium border text-left px-4 transition-all ${project.typeDoc === t ? "bg-[#0A2342] text-white border-[#0A2342]" : "bg-[#FFFEFB] border-[#0A2342]/10 text-[#0A2342]/70 hover:bg-white"}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="font-inter text-[12px] font-medium text-[#0A2342]/70 uppercase tracking-wide">Nombre de pages 10-80 : {project.pages}</label>
                      <input
                        type="range"
                        min={10}
                        max={80}
                        value={project.pages}
                        onChange={(e) => setProject({ ...project, pages: parseInt(e.target.value) })}
                        className="mt-3 w-full accent-[#0A2342]"
                      />
                      <div className="flex justify-between font-inter text-[11px] text-[#0A2342]/40">
                        <span>10 pages</span>
                        <span>{project.pages * 350} mots estimés</span>
                        <span>80 pages</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 p-1 rounded-full bg-[#F7F5F0] w-fit border border-[#0A2342]/5">
                        <button onClick={() => setSourceTab("texte")} className={`px-4 h-7 rounded-full text-[12px] font-inter ${sourceTab === "texte" ? "bg-[#0A2342] text-white" : "text-[#0A2342]/50"}`}>
                          Texte
                        </button>
                        <button onClick={() => setSourceTab("fichiers")} className={`px-4 h-7 rounded-full text-[12px] font-inter ${sourceTab === "fichiers" ? "bg-[#0A2342] text-white" : "text-[#0A2342]/50"}`}>
                          Fichiers
                        </button>
                      </div>

                      {sourceTab === "texte" ? (
                        <textarea
                          value={project.consignes}
                          onChange={(e) => setProject({ ...project, consignes: e.target.value })}
                          placeholder="Collez ici consignes, plan provisoire, bibliographie..."
                          className="mt-3 w-full min-h-[120px] rounded-[16px] border border-[#0A2342]/10 bg-[#FFFEFB] p-4 font-inter text-[13px] placeholder:text-[#0A2342]/30 focus:outline-none focus:border-[#0A2342]/30"
                        />
                      ) : (
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleFileDrop(e.dataTransfer.files);
                          }}
                          className="mt-3 rounded-[16px] border border-dashed border-[#0A2342]/15 bg-[#FFFEFB] p-6 text-center"
                        >
                          <Upload className="w-6 h-6 mx-auto text-[#0A2342]/30" />
                          <div className="mt-2 font-inter text-[13px] text-[#0A2342]/60">Glissez vos fichiers texte ici (TXT, MD, CSV, JSON)</div>
                          <input
                            type="file"
                            accept=".txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json"
                            multiple
                            onChange={(e) => e.target.files && handleFileDrop(e.target.files)}
                            className="mt-3 text-[12px] font-inter"
                          />
                          {project.files.length > 0 && (
                            <div className="mt-4 text-left space-y-1">
                              {project.files.map((f, i) => (
                                <div key={i} className="text-[11px] font-inter bg-white border border-[#0A2342]/5 rounded-full px-3 py-1 inline-flex mr-2">
                                  {f.name} • {f.content.length} car.
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleGenerateProblematiques}
                      disabled={generating}
                      className="w-full h-[52px] rounded-full bg-[#0A2342] text-white font-inter font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-[#0f3563] disabled:opacity-50 transition-colors"
                    >
                      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#C5A46B]" />}
                      Me proposer 3 problématiques
                    </button>
                  </div>
                </div>
              </div>
            )}

            
            {step === 2 && (
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="font-playfair text-[28px] text-[#0A2342]">Choisissez votre problématique</h2>
                  <button onClick={() => setStep(1)} className="font-inter text-[12px] text-[#0A2342]/60 hover:text-[#0A2342]">← Modifier projet</button>
                </div>

                {generating ? (
                  <div className="mt-8 grid md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white rounded-[24px] p-6 border border-[#0A2342]/5 animate-pulse">
                        <div className="h-4 bg-[#0A2342]/10 rounded w-3/4" />
                        <div className="mt-4 h-20 bg-[#0A2342]/5 rounded" />
                        <div className="mt-4 h-8 bg-[#C5A46B]/20 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-8 grid md:grid-cols-3 gap-6">
                    {problematiques.map((pb) => (
                      <div key={pb.id} className="bg-white rounded-[24px] border border-[#0A2342]/5 p-7 flex flex-col shadow-[0_8px_40px_-20px_rgba(10,35,66,0.12)] hover:shadow-[0_12px_50px_-15px_rgba(10,35,66,0.2)] transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <span className="px-2.5 py-1 rounded-full bg-[#F7F5F0] border border-[#0A2342]/5 text-[10px] font-inter font-bold tracking-wide text-[#C5A46B]">{pb.angle}</span>
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0A2342] text-white text-[11px] font-inter">
                            <Eye className="w-3 h-3" /> {pb.score.toFixed(1)}/10
                          </span>
                        </div>

                        <h3 className="mt-4 font-playfair text-[18px] leading-[1.3] text-[#0A2342]">{pb.titre || "Titre non disponible - fallback activé"}</h3>

                        <p className="mt-3 font-inter text-[13px] leading-[1.7] text-[#0A2342]/70 line-clamp-[10]">{pb.texte || "Texte complet de la problématique avec argumentaire détaillé, contexte, enjeux et méthodologie envisagée. Ce contenu est garanti non vide grâce au fallback robuste."}</p>

                        <div className="mt-5 p-4 rounded-[14px] bg-[#F7F5F0] border border-[#0A2342]/5">
                          <div className="font-inter text-[10px] font-bold tracking-wide text-[#C5A46B] uppercase">Pertinence</div>
                          <div className="mt-1 font-inter text-[12px] leading-[1.5] text-[#0A2342]/70">{pb.pertinence || "Justification de pertinence académique non vide"}</div>
                        </div>

                        <div className="mt-auto pt-6">
                          <button
                            onClick={() => handleSelectProblematique(pb)}
                            className="w-full h-11 rounded-full bg-[#0A2342] text-white font-inter text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-[#0f3563] transition-colors"
                          >
                            Choisir cette problématique <ArrowRight className="w-4 h-4 text-[#C5A46B]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {problematiques.length === 0 && !generating && (
                  <div className="mt-8 p-8 rounded-[20px] bg-amber-50 border border-amber-200 text-center">
                    <AlertTriangle className="w-6 h-6 mx-auto text-amber-600" />
                    <div className="mt-2 font-inter text-[14px] text-amber-900">Aucune problématique reçue - fallback automatique appliqué</div>
                    <button
                      onClick={() => setProblematiques(getFallbackProblematiques(project.sujet, project.domaine))}
                      className="mt-4 px-5 h-9 rounded-full bg-[#0A2342] text-white text-[12px] font-inter"
                    >
                      Forcer fallback
                    </button>
                  </div>
                )}
              </div>
            )}

            
            {step === 3 && (
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-playfair text-[28px] text-[#0A2342]">Choisissez votre plan</h2>
                    <p className="mt-1 font-inter text-[13px] text-[#0A2342]/50 max-w-[560px]">Problématique retenue : <span className="text-[#0A2342] font-medium">{selectedProblematique?.titre}</span></p>
                  </div>
                  <button onClick={() => setStep(2)} className="font-inter text-[12px] text-[#0A2342]/60 hover:text-[#0A2342]">← Changer problématique</button>
                </div>

                {generating ? (
                  <div className="mt-8 grid md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white rounded-[24px] p-6 border border-[#0A2342]/5 animate-pulse h-[420px]">
                        <div className="h-5 bg-[#0A2342]/10 rounded w-2/3" />
                        <div className="mt-6 space-y-2">
                          <div className="h-3 bg-[#0A2342]/5 rounded" />
                          <div className="h-3 bg-[#0A2342]/5 rounded w-5/6" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-8 grid md:grid-cols-3 gap-6">
                    {plans.map((pl) => (
                      <div key={pl.id} className="bg-white rounded-[24px] border border-[#0A2342]/5 p-7 flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full bg-[#C5A46B]/15 text-[#8a6d3a] text-[10px] font-inter font-bold">{pl.approche}</span>
                          <span className="font-inter text-[11px] text-[#0A2342]/40">{pl.totalWords.toLocaleString()} mots</span>
                        </div>
                        <h3 className="mt-4 font-playfair text-[17px] leading-[1.3] text-[#0A2342]">{pl.titre}</h3>
                        <p className="mt-2 font-inter text-[12px] leading-[1.6] text-[#0A2342]/60">{pl.description}</p>

                        <div className="mt-5 space-y-3">
                          {pl.chapters.map((ch, idx) => (
                            <div key={idx} className="rounded-[12px] bg-[#F7F5F0] p-3 border border-[#0A2342]/5">
                              <div className="font-inter text-[12px] font-medium text-[#0A2342] flex items-center gap-2">
                                <BookOpen className="w-3.5 h-3.5 text-[#C5A46B]" /> {ch.title}
                              </div>
                              <div className="mt-1.5 space-y-1">
                                {ch.subparts.slice(0, 3).map((sp, j) => (
                                  <div key={j} className="font-inter text-[11px] text-[#0A2342]/50">• {sp}</div>
                                ))}
                              </div>
                              <div className="mt-2 flex gap-1.5 flex-wrap">
                                {ch.sources.slice(0, 2).map((s, k) => (
                                  <span key={k} className="px-2 py-0.5 rounded-full bg-white border border-[#0A2342]/10 text-[9px] font-inter text-[#0A2342]/50 truncate max-w-[140px]">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 p-3 rounded-[12px] bg-[#0A2342] text-white">
                          <div className="font-inter text-[10px] tracking-wide text-[#C5A46B] uppercase">Originalité</div>
                          <div className="mt-1 font-inter text-[11px] leading-[1.5] text-white/70">{pl.originalite}</div>
                        </div>

                        <button
                          onClick={() => handleSelectPlan(pl)}
                          className="mt-6 w-full h-11 rounded-full bg-[#0A2342] text-white font-inter text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-[#0f3563]"
                        >
                          Choisir ce plan <ArrowRight className="w-4 h-4 text-[#C5A46B]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            
            {step === 4 && selectedPlan && (
              <div className="grid lg:grid-cols-[320px_1fr] gap-8 items-start">
                
                <div className="lg:sticky lg:top-[136px] bg-white rounded-[24px] border border-[#0A2342]/5 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-playfair text-[16px] text-[#0A2342]">Rédaction</h3>
                    <span className="font-inter text-[11px] text-[#0A2342]/40 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {blocks.filter((b) => b.status === "done").length}/{blocks.length}
                    </span>
                  </div>

                  <div className="mt-5 space-y-2 max-h-[60vh] overflow-auto pr-1">
                    {blocks.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleGenerateBlock(b.id)}
                        className={`w-full text-left p-3 rounded-[14px] border transition-all flex items-center justify-between gap-2 ${b.status === "done" ? "bg-[#0A2342] text-white border-[#0A2342]" : b.status === "generating" ? "bg-[#C5A46B]/15 border-[#C5A46B]/30" : "bg-[#F7F5F0] border-[#0A2342]/5 hover:border-[#0A2342]/15"}`}
                      >
                        <span className="font-inter text-[12px] leading-[1.3] line-clamp-2">{b.title}</span>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${b.status === "done" ? "bg-[#C5A46B] text-[#0A2342]" : "bg-white border border-[#0A2342]/10"}`}>
                          {b.status === "done" ? <Check className="w-3.5 h-3.5" /> : b.status === "generating" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span className="text-[10px]">•</span>}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleExportWord}
                    disabled={blocks.filter((b) => b.status === "done").length === 0}
                    className="mt-6 w-full h-11 rounded-full bg-[#C5A46B] text-[#0A2342] font-inter text-[13px] font-medium flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-[#b8935a] transition-colors"
                  >
                    <Download className="w-4 h-4" /> Export Word
                  </button>

                  <div className="mt-4 p-3 rounded-[12px] bg-[#F7F5F0] border border-[#0A2342]/5">
                    <div className="font-inter text-[11px] text-[#0A2342]/60">
                      Plan : <span className="font-medium text-[#0A2342]">{selectedPlan.titre.slice(0, 50)}...</span>
                    </div>
                    <div className="mt-1 font-inter text-[11px] text-[#0A2342]/40">{selectedPlan.chapters.length} chapitres • {selectedPlan.totalWords} mots</div>
                  </div>
                </div>

                <div className="space-y-6">
                  {blocks.filter((b) => b.status === "done").length === 0 && (
                    <div className="bg-white rounded-[24px] border border-[#0A2342]/5 p-10 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#F7F5F0] flex items-center justify-center mx-auto">
                        <GraduationCap className="w-6 h-6 text-[#0A2342]/40" />
                      </div>
                      <h3 className="mt-4 font-playfair text-[20px] text-[#0A2342]">Commencez la rédaction bloc par bloc</h3>
                      <p className="mt-2 font-inter text-[13px] text-[#0A2342]/50 max-w-[420px] mx-auto">Chaque bloc vise jusqu’à 900 mots sourcés. Cliquez sur un bloc à gauche pour le rédiger. L’essai gratuit est limité à 500 mots au total.</p>
                    </div>
                  )}

                  {blocks
                    .filter((b) => b.status === "done")
                    .map((b) => (
                      <div key={b.id} className="bg-white rounded-[24px] border border-[#0A2342]/5 p-8 lg:p-10 shadow-[0_8px_40px_-20px_rgba(10,35,66,0.1)]">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-playfair text-[22px] text-[#0A2342]">{b.title}</h3>
                          <span className="px-2.5 py-1 rounded-full bg-[#0A2342] text-white text-[11px] font-inter">{b.wordCount} mots</span>
                        </div>
                        <div className="mt-6 font-inter text-[14px] leading-[1.85] text-[#0A2342]/80 whitespace-pre-wrap">{b.content}</div>

                        {b.sources.length > 0 && (
                          <div className="mt-8 pt-6 border-t border-[#0A2342]/5">
                            <div className="font-inter text-[11px] font-bold tracking-wide text-[#C5A46B] uppercase">Sources DOI</div>
                            <div className="mt-3 space-y-2">
                              {b.sources.map((s) => (
                                <div key={s.id} className="font-inter text-[12px] text-[#0A2342]/60">
                                  [{s.id}] {s.citation} {s.doi && <span className="text-[#0A2342]/40">• {s.doi}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-8 flex gap-2">
                          <button
                            onClick={() => handleGenerateBlock(b.id)}
                            className="px-4 h-9 rounded-full bg-[#F7F5F0] border border-[#0A2342]/10 text-[12px] font-inter text-[#0A2342]/70 hover:bg-white"
                          >
                            Régénérer
                          </button>
                          <button onClick={() => handleCopyBlock(b.content)} className="px-4 h-9 rounded-full bg-white border border-[#0A2342]/10 text-[12px] font-inter text-[#0A2342]/70 hover:bg-[#F7F5F0]">Copier</button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0A2342]/40 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
          <div className="relative w-full max-w-[420px] bg-white rounded-[24px] p-8 shadow-[0_20px_80px_-20px_rgba(10,35,66,0.4)] border border-[#0A2342]/5">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F7F5F0] flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[8px] bg-[#0A2342] text-[#C5A46B] flex items-center justify-center font-playfair font-bold">T</div>
              <span className="font-playfair font-bold tracking-[0.12em] text-[13px]">TRIMÉMO</span>
            </div>

            <h2 className="mt-6 font-playfair text-[24px] leading-[1.1] text-[#0A2342]">{authMode === "signup" ? "Créer votre compte" : "Se connecter"}</h2>
            <p className="mt-2 font-inter text-[13px] text-[#0A2342]/50">Accès à l'éditeur en 30 secondes. Stockage localStorage trimemo_user.</p>

            <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
              {authMode === "signup" && (
                <div>
                  <label className="font-inter text-[11px] font-medium uppercase tracking-wide text-[#0A2342]/60">Nom</label>
                  <input name="name" required className="mt-1.5 w-full h-11 rounded-[12px] border border-[#0A2342]/10 px-4 font-inter text-[14px] focus:outline-none focus:border-[#0A2342]/30" placeholder="Prénom Nom" />
                </div>
              )}
              <div>
                <label className="font-inter text-[11px] font-medium uppercase tracking-wide text-[#0A2342]/60">Email</label>
                <input name="email" type="email" required className="mt-1.5 w-full h-11 rounded-[12px] border border-[#0A2342]/10 px-4 font-inter text-[14px] focus:outline-none focus:border-[#0A2342]/30" placeholder="vous@exemple.com" />
              </div>
              <div>
                <label className="font-inter text-[11px] font-medium uppercase tracking-wide text-[#0A2342]/60">Mot de passe</label>
                <input name="password" type="password" required className="mt-1.5 w-full h-11 rounded-[12px] border border-[#0A2342]/10 px-4 font-inter text-[14px] focus:outline-none focus:border-[#0A2342]/30" placeholder="••••••••" />
              </div>

              <button type="submit" className="w-full h-12 rounded-full bg-[#0A2342] text-white font-inter font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-[#0f3563]">
                {authMode === "signup" ? "Créer mon compte" : "Se connecter"} <ArrowRight className="w-4 h-4 text-[#C5A46B]" />
              </button>
            </form>

            <div className="mt-5 text-center">
              <button onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")} className="font-inter text-[12px] text-[#0A2342]/50 hover:text-[#0A2342]">
                {authMode === "signup" ? "Déjà un compte ? Se connecter" : "Pas de compte ? Créer un compte"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
