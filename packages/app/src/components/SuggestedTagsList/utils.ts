export function findSubstr(src: string, search: string, reverse = false) {
	const reverseString = (str: string) => str.split('').reverse().join('');

	if (reverse) {
		src = reverseString(src);
		search = reverseString(search);
	}

	let substr = '';
	for (let i = 0; src.length > i && search.length > i && src[i] === search[i]; i++) {
		substr += src[i];
	}

	if (reverse) {
		return reverseString(substr);
	}

	return substr;
}

export const getSortIndex = (a: string, b: string, value: string) => {
	const left = -1;
	const right = 1;

	const isASubstringMatch = a.search(value);
	const aMatchFromStart = findSubstr(a, value);
	const aMatchFromEnd = findSubstr(a, value, true);
	const isAFullMatch = aMatchFromStart.length === a.length;
	const aBestMatch = Math.max(aMatchFromStart.length, aMatchFromEnd.length);

	const isBSubstringMatch = b.search(value);
	const bMatchFromStart = findSubstr(b, value);
	const bMatchFromEnd = findSubstr(b, value, true);
	const isBFullMatch = bMatchFromStart.length === b.length;
	const bBestMatch = Math.max(bMatchFromStart.length, bMatchFromEnd.length);

	// Prefer full match
	if (isAFullMatch && isBFullMatch) return 0;
	if (isAFullMatch) return left;
	if (isBFullMatch) return right;

	// Prefer substring match
	if (isASubstringMatch !== isBSubstringMatch) {
		if (isASubstringMatch) return left;
		if (isBSubstringMatch) return right;
	}

	// Prefer a string with most large match chars from start or from end
	if (aBestMatch > bBestMatch) return left;
	if (aBestMatch < bBestMatch) return right;

	return 0;
};
