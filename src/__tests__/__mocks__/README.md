Directory with general mocks widely used on project.

Mocks available in namespace `@mocks` and have the same names and paths as original module, so you may just add prefix `@mocks/` to target module.

Example:

```ts
vi.mock('electron', () => vi.importActual('@mocks/electron'));
vi.mock('recursive-readdir', () => vi.importActual('@mocks/recursive-readdir'));

vi.mock('fs', () => vi.importActual('@mocks/fs'));
vi.mock('fs/promises', () => vi.importActual('@mocks/fs/promises'));
```