export type AccountSession = {
  token: string;
  userId: string;
  refreshToken?: string;
  expiresAt?: number | string | null;
  email?: string;
  fullName?: string;
};

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
// A stale access token is refreshed once. Never claim a project for a different user.
export async function registerOwnedProject(
  apiUrl: string,
  session: AccountSession,
  project: { projectId: string; sujet: string },
  currentSession: () => AccountSession | null,
  request: typeof fetch = fetch,
) {
  if (!session?.token || !session?.userId || !project?.projectId) throw new Error('Connectez-vous avant de créer un projet.');
  const expectedUserId = session.userId;
  const sessionChanged = () => new Error('Le compte a changé pendant la création du projet. Ouvrez le projet depuis son compte.');
  const sessionExpired = () => new Error('Votre session a expiré. Connectez-vous à nouveau.');
  const activeAtStart = currentSession();
  if (!activeAtStart?.token || activeAtStart.userId !== expectedUserId) throw sessionChanged();

  const state = { schemaVersion: 2, project, blocks: [], view: 'project' };
  const link = (token: string) => request(apiUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'link', token, projectId: project.projectId, subject: project.sujet || 'Projet académique', state }),
  });

  let response = await link(activeAtStart.token);
  if (response.status === 401) {
    const active = currentSession();
    if (!active?.token || active.userId !== expectedUserId) throw sessionChanged();

    // Another request may already have refreshed this account's token.
    if (active.token !== activeAtStart.token) response = await link(active.token);

    if (response.status === 401 && active.refreshToken) {
      const refreshResponse = await request(apiUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh', refreshToken: active.refreshToken }),
      });
      const refreshed = await refreshResponse.json().catch(() => ({}));
      if (refreshResponse.ok && refreshed?.token && refreshed?.user?.id) {
        if (String(refreshed.user.id) !== expectedUserId) throw sessionChanged();
        const latest = currentSession();
        if (!latest?.token || latest.userId !== expectedUserId) throw sessionChanged();

        if (latest.token !== active.token) {
          response = await link(latest.token);
        } else {
          const renewed: AccountSession = {
            ...latest,
            token: String(refreshed.token),
            refreshToken: String(refreshed.refresh_token || latest.refreshToken || ''),
            expiresAt: refreshed.expires_at || null,
          };
          // Persist only after the server has confirmed the same user ID.
          window.localStorage.setItem('trimemo_client_session', JSON.stringify(renewed));
          response = await link(renewed.token);
        }
      } else if (refreshResponse.status >= 500) {
        throw new Error('Le renouvellement de session est momentanément indisponible. Réessayez sans supprimer votre projet.');
      }
    }
  }

  if (response.status === 401) throw sessionExpired();
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(String(data.error || 'Le projet ne peut pas être créé dans votre compte.'));
  const current = currentSession();
  if (!current?.token || current.userId !== expectedUserId) throw sessionChanged();
  return project;
}
