export type AccountSession = { token: string; userId: string };

function canonical(value: unknown): string {
  const sort = (item: any): any => Array.isArray(item) ? item.map(sort) : item && typeof item === 'object' ? Object.fromEntries(Object.keys(item).sort().filter(key => item[key] !== undefined).map(key => [key, sort(item[key])])) : item;
  return JSON.stringify(sort(value ?? null));
}

// A recovery must not silently replace a different server version.
export function recoverMatchingAttachments(draft: any, remote: any, sessionFiles: unknown): any[] {
  const localProject = draft?.project;
  const remoteProject = remote?.project;
  if (!localProject?.projectId || localProject.projectId !== remoteProject?.projectId) throw new Error('Le projet de cette copie ne correspond pas au projet enregistré.');
  const cleanProject = (project: any) => {
    const { files, pricingQuoteToken, paidPreviewSnapshot, ...rest } = project;
    return rest;
  };
  const fields = ['preview', 'selectedProblematic', 'selectedPlan', 'blocks'];
  if (canonical(cleanProject(localProject)) !== canonical(cleanProject(remoteProject)) || fields.some(key => canonical(draft[key]) !== canonical(remote[key]))) {
    throw new Error('La copie locale diffère de la version du compte. Les deux versions restent conservées ; contactez le support avant de poursuivre.');
  }
  const localFiles = Array.isArray(draft.project.files) ? draft.project.files : [];
  const remoteFiles = Array.isArray(remote.project.files) ? remote.project.files : [];
  const metadata = (files: any[]) => files.map(({ name, type, category }) => ({ name, type, category }));
  if (canonical(metadata(localFiles)) !== canonical(metadata(remoteFiles))) throw new Error('Les pièces jointes de la copie locale diffèrent de celles du compte. Les deux versions restent conservées.');
  const files = draft.attachmentBackupKey ? sessionFiles : localFiles;
  if (!Array.isArray(files) || canonical(metadata(files)) !== canonical(metadata(localFiles))) throw new Error('Les pièces jointes locales ne sont plus disponibles dans cet onglet. Conservez la copie et contactez le support.');
  return files;
}

// Registration happens before the blank project is displayed or used for AI.
export async function registerOwnedProject(
  apiUrl: string,
  session: AccountSession,
  project: { projectId: string; sujet: string },
  currentSession: () => AccountSession | null,
  request: typeof fetch = fetch,
) {
  if (!session?.token || !session?.userId || !project?.projectId) throw new Error('Connectez-vous avant de créer un projet.');
  const state = { schemaVersion: 2, project, blocks: [], view: 'project' };
  const response = await request(apiUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'link', token: session.token, projectId: project.projectId, subject: project.sujet || 'Projet académique', state }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(String(data.error || 'Le projet ne peut pas être créé dans votre compte.'));
  const active = currentSession();
  if (!active?.token || active.userId !== session.userId) throw new Error('Le compte a changé pendant la création du projet. Ouvrez le projet depuis son compte.');
  return project;
}
