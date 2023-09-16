function fallbackCopyTextToClipboard(text: string) {
	const textArea = document.createElement('textarea');
	textArea.value = text;

	// Avoid scrolling to bottom
	textArea.style.top = '0';
	textArea.style.left = '0';
	textArea.style.position = 'fixed';

	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	try {
		document.execCommand('copy');
	} catch (err) {
		document.body.removeChild(textArea);
		throw err;
	}

	document.body.removeChild(textArea);
}

export async function copyTextToClipboard(text: string) {
	if (!navigator.clipboard) {
		return fallbackCopyTextToClipboard(text);
	}

	return navigator.clipboard.writeText(text);
}
