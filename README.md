# Workout

Personal workout tracker PWA. All data lives on the phone in IndexedDB (persistent storage
requested, so it survives storage pressure). A backup/restore to a JSON file is available at
the bottom of the Stats screen.

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

Every push to `main` builds and deploys via
[.github/workflows/deploy.yml](.github/workflows/deploy.yml) to:

**https://buddhikac96.github.io/workout/**

Open that on your phone in Chrome → menu → **Add to Home screen**.
