const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function encodeBase62(value) {
	let n = Number(value);

	if (!Number.isSafeInteger(n) || n < 1) {
		throw new Error('Invalid ID');
	}

	let result = '';

	while (n > 0) {
		result = ALPHABET[n % 62] + result;
		n = Math.floor(n / 62);
	}

	return result;
}

export function decodeBase62(code) {
	if (!code || code.length > 11) return null;
	let n = 0;

	for (const char of code) {
		const digit = ALPHABET.indexOf(char);

		if (digit === -1) return null;

		n = n * 62 + digit;

		if (!Number.isSafeInteger(n)) return null;
	}

	return n > 0 ? n : null;
}
