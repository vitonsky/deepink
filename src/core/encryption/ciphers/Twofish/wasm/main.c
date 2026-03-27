/*
 * Simple file to test the Twofish libary code.
 * Copyright (c) 2002 by Niels Ferguson.
 *
 * The author hereby grants a perpetual license to everybody to
 * use this code for any purpose as long as the copyright message is included
 * in the source code of this or any derived work.
 * 
 */

#include <stdio.h>
#include "twofish.h"

int main()
    {
    puts( "Twofish library code test\nCopyright (c) 2002 by Niels Ferguson" );

    /*
     * The initialise function runs all the tests that are needed. 
     * Note: the default Twofish_fatal routine just hangs the CPU, so if this
     * program does not finish you probably didn't do the platform fixes 
     * correctly
     */
    Twofish_initialise();

    puts( "Done" );

    return 0;
    }
