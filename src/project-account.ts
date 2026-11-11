export type AccountSession = { token: string; userId: string };

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
