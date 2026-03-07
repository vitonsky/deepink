export const getWorkspaceRoot = () => `/workspaces`;

export const getWorkspacePath = (workspaceId: string) =>
	`${getWorkspaceRoot()}/${workspaceId}`;

export const getWorkspaceFilesPath = (workspaceId: string) =>
	`${getWorkspacePath(workspaceId)}/files`;
