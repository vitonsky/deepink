/* string.h
 * Minimal stub for wasm32-unknown-unknown builds.
 * The actual implementations live in twofish_wasm.c
 */
#ifndef _STRING_H
#define _STRING_H

typedef unsigned long size_t;

void *memset (void *dst, int c,          size_t n);
void *memcpy (void *dst, const void *src, size_t n);
int   memcmp (const void *a, const void *b, size_t n);

#endif /* _STRING_H */