export const getWorkspacePath = (workspaceId: string) => `/workspaces/${workspaceId}`;

export const getWorkspaceFilesPath = (workspaceId: string) =>
	`${getWorkspacePath(workspaceId)}/files`;
