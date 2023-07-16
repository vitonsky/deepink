import { EditorExtension } from ".";

export const MarkdownAddons: EditorExtension = (editorInstance) => {
	const model = editorInstance.getModel();
	if (!model) {
		console.error('Editor model are empty');
		return;
	}

	const pointerRegEx = /^-( \[(\s|x)\])?/;
	model.onDidChangeContent((evt) => {
		// TODO: implement for all changes
		const change = evt.changes[0];

		const isNewLine = /^\n[\s\t]*$/.test(change.text);
		if (!isNewLine) return;
		if (change.range.startLineNumber !== change.range.endLineNumber) return;

		const lineValue = model.getValueInRange({
			...change.range,
			startColumn: 0,
		});
		const pointMatch = lineValue.trim().match(pointerRegEx);
		if (!pointMatch) return;

		const lineWithChanges = change.range.startLineNumber + 1;

		// Remove previous bullet point if empty

		const prevLineNumber = Math.max(1, lineWithChanges - 1);
		const prevLineValue = model.getLineContent(prevLineNumber);
		const prevPointMatch = prevLineValue.trim().match(pointerRegEx);
		if (prevPointMatch) {
			const startLineNumber = Math.max(1, prevLineNumber - 1);
			const startLineLength = model.getLineLength(startLineNumber);

			const prevLineWithRemovedPointerPrefix = prevLineValue
				.trim()
				.slice(prevPointMatch[0].length);

			// Handle empty pointer before
			if (!prevLineWithRemovedPointerPrefix) {
				// TODO: set cursor at start of next line
				editorInstance.executeEdits('remove.prevBulletPoint', [
					{
						text: change.text,
						range: {
							startLineNumber: startLineNumber,
							startColumn: startLineNumber === prevLineNumber ? 0 : startLineLength + 1,
							endLineNumber: lineWithChanges,
							endColumn: 0
						},
					},
				]);

				requestAnimationFrame(() => {
					editorInstance.setPosition({
						lineNumber: lineWithChanges,
						column: model.getLineLength(lineWithChanges) + 1,
					});
				});
				return;
			}
		}

		// Add new bullet point

		const columnToInsert = change.text.length;

		const isCheckboxType = Boolean(pointMatch[1]);
		const textToInsert = '- ' + (isCheckboxType ? '[ ] ' : '');

		editorInstance.executeEdits('insert.bulletPoint', [
			{
				text: textToInsert,
				range: {
					startLineNumber: lineWithChanges,
					endLineNumber: lineWithChanges,
					startColumn: columnToInsert,
					endColumn: columnToInsert,
				},
			},
		]);

		// TODO: use arguments of `executeEdits` method to change cursor position
		// Set cursor
		requestAnimationFrame(() => {
			editorInstance.setPosition({
				lineNumber: lineWithChanges,
				column: columnToInsert + textToInsert.length,
			});
		});
	});
};