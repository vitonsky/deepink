export const getNoteFileName = (id: string, name?: string) => {
	const baseName = name?.trim() || `note_${id}`;
	return baseName.slice(0, 50).trim();
};
