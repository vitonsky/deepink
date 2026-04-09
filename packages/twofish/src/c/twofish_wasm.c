/*
 * twofish_wasm.c
 * 
 * Thin WASM wrapper around the Twofish reference implementation.
 * Provides a session-based API with integer handles for JS consumption.
 * 
 * Compile with:
 *   clang --target=wasm32-unknown-unknown -O3 -nostdlib \
 *     -Wl,--no-entry -Wl,--allow-undefined \
 *     -Wl,--export=twofish_init \
 *     -Wl,--export=twofish_create_session \
 *     -Wl,--export=twofish_encrypt \
 *     -Wl,--export=twofish_decrypt \
 *     -Wl,--export=twofish_destroy_session \
 *     -Wl,--export=twofish_get_io_buffer \
 *     -Wl,--export=__heap_base \
 *     -o twofish.wasm \
 *     twofish.c twofish_wasm.c
 */

#include "twofish.h"

/* -------------------------------------------------------------------------
 * Platform shims — replace the things normally provided by libc.
 * clang's compiler-rt provides __builtin_memset/memcpy/memcmp as
 * inline builtins, but the C code calls the named functions.
 * We provide them ourselves to stay fully nostdlib.
 * ------------------------------------------------------------------------- */

void *memset(void *dst, int c, unsigned long n) {
    unsigned char *p = (unsigned char *)dst;
    while (n--) *p++ = (unsigned char)c;
    return dst;
}

void *memcpy(void *dst, const void *src, unsigned long n) {
    unsigned char *d = (unsigned char *)dst;
    const unsigned char *s = (const unsigned char *)src;
    while (n--) *d++ = *s++;
    return dst;
}

int memcmp(const void *a, const void *b, unsigned long n) {
    const unsigned char *p = (const unsigned char *)a;
    const unsigned char *q = (const unsigned char *)b;
    while (n--) {
        if (*p != *q) return (int)*p - (int)*q;
        p++; q++;
    }
    return 0;
}

/* -------------------------------------------------------------------------
 * Fatal handler.
 * Twofish_fatal() is called on internal assertion failures.
 * We use __builtin_trap() which emits the WASM `unreachable` instruction.
 * This raises a RuntimeError on the JS side that can be caught normally.
 * ------------------------------------------------------------------------- */
__attribute__((noreturn)) void Twofish_fatal( const char *msg ) {
    __builtin_trap();
}


/* -------------------------------------------------------------------------
 * Session pool.
 *
 * We maintain a fixed-size pool of Twofish_key structs.
 * JavaScript receives an integer handle (0-based index).
 * Handle -1 means "invalid / no session".
 *
 * MAX_SESSIONS can be increased freely — each slot costs ~4.5 kB.
 * ------------------------------------------------------------------------- */

#define MAX_SESSIONS 16

/* Each entry in the pool. */
typedef struct {
    Twofish_key key;    /* The expanded key material (~4.5 kB)      */
    int         in_use; /* 1 if this slot is occupied, 0 if free    */
} Session;

static Session session_pool[MAX_SESSIONS];

/* -------------------------------------------------------------------------
 * Shared I/O buffer.
 *
 * Rather than passing pointers from JS (which requires extra wrangling),
 * we expose a single 32-byte buffer: the caller writes plaintext/ciphertext
 * into it and reads the result from it.
 * 16 bytes in + 16 bytes out, laid out sequentially.
 *
 *   bytes  0..15  — input  block (written by JS before calling encrypt/decrypt)
 *   bytes 16..31  — output block (written by WASM, read by JS after the call)
 *
 * This avoids any pointer-marshalling complexity on the JS side.
 * ------------------------------------------------------------------------- */
static unsigned char io_buffer[32];

/* -------------------------------------------------------------------------
 * Exported API
 * ------------------------------------------------------------------------- */

/*
 * twofish_init()
 * 
 * Must be called once before any other function.
 * Builds the global q-box and MDS tables, then runs the built-in self-tests.
 *
 * Returns: 1 on success.
 *          The WASM trap instruction fires if self-tests fail.
 */
__attribute__((visibility("default")))
int twofish_init(void) {
    /* Zero the session pool. */
    memset(session_pool, 0, sizeof(session_pool));

    /*
     * This call:
     *   1. Tests platform macros (GET32, PUT32, ROL/ROR, BSWAP, SELECT_BYTE)
     *   2. Builds q_table and MDS_table
     *   3. Runs test_vectors()   — 3 known (key, plaintext, ciphertext) triples
     *   4. Runs test_sequences() — 3 × 49-step recurrence tests
     *   5. Runs test_odd_sized_keys()
     * If anything fails, __builtin_trap() fires.
     */
    Twofish_initialise();
    return 1;
}

/*
 * twofish_get_io_buffer()
 *
 * Returns the linear-memory offset of io_buffer.
 * JS uses this to get a Uint8Array view into the right slice of WASM memory.
 *
 * Call once after init; the address never changes.
 */
__attribute__((visibility("default")))
unsigned int twofish_get_io_buffer(void) {
    return (unsigned int)(unsigned long)io_buffer;
}

/*
 * twofish_create_session(key_ptr, key_len)
 *
 * Expands a key and stores the result in a free pool slot.
 *
 * Arguments:
 *   key_ptr  — offset into WASM linear memory where the key bytes live.
 *              The caller should write the key bytes into io_buffer[0..key_len-1]
 *              and pass twofish_get_io_buffer() as key_ptr, or manage their
 *              own memory region.
 *   key_len  — key length in bytes, must be in range 1..32.
 *              16 = 128-bit, 24 = 192-bit, 32 = 256-bit.
 *              Shorter keys are zero-padded to the next standard size.
 *
 * Returns: session handle (0 .. MAX_SESSIONS-1) on success.
 *          -1 if no free slot is available.
 *          -2 if key_len is out of range.
 *          The WASM trap fires if the key expansion itself detects an error.
 */
__attribute__((visibility("default")))
int twofish_create_session(unsigned int key_ptr, int key_len) {
    int i;

    /* Validate key length. */
    if (key_len < 1 || key_len > 32) {
        return -2;
    }

    /* Find a free slot. */
    for (i = 0; i < MAX_SESSIONS; i++) {
        if (!session_pool[i].in_use) {
            break;
        }
    }
    if (i == MAX_SESSIONS) {
        return -1; /* Pool exhausted. */
    }

    /*
     * key_ptr is an offset into WASM linear memory.
     * We cast it directly — in a wasm32 target, pointers are 32-bit
     * and linear memory starts at address 0.
     */
    Twofish_prepare_key((Twofish_Byte *)(unsigned long)key_ptr,
                         key_len,
                         &session_pool[i].key);

    session_pool[i].in_use = 1;
    return i;
}

/*
 * twofish_encrypt(handle)
 *
 * Encrypts the 16 bytes in io_buffer[0..15].
 * Writes the 16-byte ciphertext to io_buffer[16..31].
 *
 * Arguments:
 *   handle — session handle returned by twofish_create_session().
 *
 * Returns:  0 on success.
 *          -1 if handle is invalid.
 */
__attribute__((visibility("default")))
int twofish_encrypt(int handle) {
    if (handle < 0 || handle >= MAX_SESSIONS || !session_pool[handle].in_use) {
        return -1;
    }
    Twofish_encrypt(&session_pool[handle].key,
                    io_buffer,        /* plaintext  — first 16 bytes  */
                    io_buffer + 16);  /* ciphertext — second 16 bytes */
    return 0;
}

/*
 * twofish_decrypt(handle)
 *
 * Decrypts the 16 bytes in io_buffer[0..15].
 * Writes the 16-byte plaintext to io_buffer[16..31].
 *
 * Arguments:
 *   handle — session handle returned by twofish_create_session().
 *
 * Returns:  0 on success.
 *          -1 if handle is invalid.
 */
__attribute__((visibility("default")))
int twofish_decrypt(int handle) {
    if (handle < 0 || handle >= MAX_SESSIONS || !session_pool[handle].in_use) {
        return -1;
    }
    Twofish_decrypt(&session_pool[handle].key,
                    io_buffer,        /* ciphertext — first 16 bytes  */
                    io_buffer + 16);  /* plaintext  — second 16 bytes */
    return 0;
}

/*
 * twofish_destroy_session(handle)
 *
 * Wipes the key material from the session slot and marks it as free.
 * Always call this when you are done with a session.
 *
 * Returns:  0 on success.
 *          -1 if handle is invalid.
 */
__attribute__((visibility("default")))
int twofish_destroy_session(int handle) {
    if (handle < 0 || handle >= MAX_SESSIONS || !session_pool[handle].in_use) {
        return -1;
    }
    /* Wipe the key material before releasing the slot. */
    memset(&session_pool[handle].key, 0, sizeof(Twofish_key));
    session_pool[handle].in_use = 0;
    return 0;
}