/* eslint-disable no-bitwise */

export function xor16(
	r: Uint8Array<ArrayBuffer>,
	a: Uint8Array,
	b: Uint8Array,
): Uint8Array {
	// This one is much slower
	// a.forEach((x, index) => {
	// 	r[index] = x ^ b[index]
	// })

	// No length check, no loop, no view construction.
	// 16 scalar XORs — V8 can keep all of these in registers.
	r[0] = a[0] ^ b[0];
	r[1] = a[1] ^ b[1];
	r[2] = a[2] ^ b[2];
	r[3] = a[3] ^ b[3];
	r[4] = a[4] ^ b[4];
	r[5] = a[5] ^ b[5];
	r[6] = a[6] ^ b[6];
	r[7] = a[7] ^ b[7];
	r[8] = a[8] ^ b[8];
	r[9] = a[9] ^ b[9];
	r[10] = a[10] ^ b[10];
	r[11] = a[11] ^ b[11];
	r[12] = a[12] ^ b[12];
	r[13] = a[13] ^ b[13];
	r[14] = a[14] ^ b[14];
	r[15] = a[15] ^ b[15];
	return r;
}
