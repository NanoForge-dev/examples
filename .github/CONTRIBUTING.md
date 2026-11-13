# Contributing

If you wish to contribute to the NanoForge project, fork the repository and submit a pull request. Please mind following the pre-commit hooks to keep the codebase as clean as possible.

## Setup

To get ready to work on the codebase, please do the following:

1. Fork & clone the repository, and make sure you're on the **main** branch
2. Run `pnpm install --frozen-lockfile` ([install](https://pnpm.io/installation)); each example has its own install too (`cd games/breakout && pnpm install`)
3. Make your changes. Read the [rules](../README.md#rules): one item per file, and shared files are edited in `shared/` then copied with `pnpm fix`
4. Run `pnpm lint` (prettier, one item per file, shared copies). In the example you changed, also run `pnpm exec tsc --noEmit` (per app for client and server examples) and `pnpm build`
5. [Submit a pull request](https://github.com/NanoForge-dev/examples/compare) (Make sure you follow the [conventional commit format](https://github.com/NanoForge-dev/examples/blob/main/.github/COMMIT_CONVENTION.md))
