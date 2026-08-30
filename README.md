# Workout

Personal workout tracker PWA. Local-first (IndexedDB on the phone), syncs `data.json` to this
repo via the GitHub API after each finished workout.

## The plan

Edit [src/plan.js](src/plan.js) to change exercises, set/rep targets, or rest times.

- **Upper (Mon & Thu)**: Low Incline DB Press · Neutral Grip Pull-Ups · Cable Row · Delts superset (seated lateral raise + rear delt flyes) · Arms superset (incline DB curl + overhead extension)
- **Lower (Tue & Fri)**: Goblet Squats · DB RDLs · Walking Lunges · Standing Calf Raises

## Run locally

```
npm install
npm run dev
```

## Deploy (GitHub Pages)

The repo must be **public** (free plan). Every push to `main` (except `data.json` sync commits)
builds and deploys via [.github/workflows/deploy.yml](.github/workflows/deploy.yml) to:

**https://buddhikac96.github.io/workout/**

Open that on your phone in Chrome → menu → **Add to Home screen**.

(`netlify.toml` is kept as a fallback in case you ever switch hosting.)

## GitHub sync setup (one-time, on the phone)

1. GitHub → Settings → Developer settings → **Fine-grained personal access tokens** → Generate new token.
   - Repository access: **only this repo**
   - Permissions: **Contents → Read and write**
2. In the app: tap the sync bar on the home screen → paste the token → Save.
3. Data pushes automatically when you finish a workout; **⬆ Push now** / **⬇ Restore** are in the same screen.

The token lives only in the phone's localStorage — never in the repo.
