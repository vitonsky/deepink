#include	"aes.h"
#include	<stdio.h>
#include	<stdlib.h>
#include	<string.h>
#include	<time.h>
#include	<ctype.h>

int main() {
    cipherInstance cipher;
    BYTE iv[16] = {0};
    cipherInit(&cipher, MODE_ECB, iv);
    // call encrypt/decrypt functions for testing
    return 0;
}