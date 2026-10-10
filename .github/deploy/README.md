# Manual deployment workflow

`deploy.manual.yml` is the prepared Coolify/GHCR workflow. It is intentionally stored outside `.github/workflows` while the 33-module acceptance matrix and CI gates remain incomplete.

After release readiness is verified, review the environment secrets and move it to `.github/workflows/deploy.yml` to enable explicit `workflow_dispatch` deployment.
