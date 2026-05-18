# Repository Guidance

## Publishing

When the user asks to push, publish, deploy, or put the site online from this repository, use:

```bash
scripts/publish-main.sh "<intent subject>"
```

Use `--include-untracked` only after checking that every untracked file is intended source content. Generated files such as `dist/` and `assets/site-search-index.json` must not be committed.

The publish script runs `bash build.sh`, creates a Lore-format commit with the required OmX co-author trailer, pushes `main` to `origin`, and verifies the remote branch points at the local commit.
