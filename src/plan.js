// The workout plan. Edit this file to change exercises, targets, or rest times.
// type: 'weight'     -> log weight (kg) x reps
//       'bodyweight' -> log added weight (kg, 0 = bodyweight) x reps
//       'perleg'     -> log weight (kg) x reps per leg
//       'superset'   -> two exercises (a/b) logged in rounds, A then B
// days: JS getDay() numbers (0=Sun .. 6=Sat)

export const WEIGHT_STEP = 2.5

export const PLAN = {
  upper: {
    id: 'upper',
    name: 'Upper Body',
    days: [1, 4],
    daysLabel: 'Mon & Thu',
    summary: 'Press · Pull-ups · Row · Delts · Arms',
    items: [
      { id: 'incline-press', name: 'Low Incline DB Press', sets: 3, reps: '10–15', rest: 90, type: 'weight' },
      { id: 'pullups', name: 'Neutral Grip Pull-Ups', sets: 3, reps: '5–8', rest: 90, type: 'bodyweight' },
      { id: 'cable-row', name: 'Cable Row', sets: 3, reps: '10–15', rest: 90, type: 'weight' },
      {
        id: 'delts-ss', name: 'Delts Superset', sets: 3, reps: '10–20', rest: 0, type: 'superset',
        a: { id: 'lateral-raise', name: 'Seated Lateral Raise' },
        b: { id: 'rear-delt-flyes', name: 'Rear Delt Flyes' },
        hint: 'No rest — move straight into arms',
      },
      {
        id: 'arms-ss', name: 'Arms Superset', sets: 3, reps: '8–12', rest: 60, type: 'superset',
        a: { id: 'incline-curl', name: 'Incline DB Curl' },
        b: { id: 'overhead-ext', name: 'Overhead Extension' },
        hint: 'Rest 60s after completing both',
      },
    ],
  },
  lower: {
    id: 'lower',
    name: 'Lower Body',
    days: [2, 5],
    daysLabel: 'Tue & Fri',
    summary: 'Squats · RDLs · Lunges · Calves',
    items: [
      { id: 'goblet-squat', name: 'Goblet Squats', sets: 3, reps: '10–15', rest: 90, type: 'weight' },
      { id: 'rdl', name: 'DB Romanian Deadlifts', sets: 3, reps: '10–15', rest: 90, type: 'weight' },
      { id: 'lunges', name: 'Walking Lunges', sets: 3, reps: '10–12 /leg', rest: 60, type: 'perleg' },
      { id: 'calf-raise', name: 'Standing Calf Raises', sets: 3, reps: '15–20', rest: 45, type: 'weight' },
    ],
  },
}

export const WORKOUTS = [PLAN.upper, PLAN.lower]

export function workoutForDay(day) {
  return WORKOUTS.find((w) => w.days.includes(day)) || null
}

export function findItem(workoutId, itemId) {
  return PLAN[workoutId]?.items.find((i) => i.id === itemId) || null
}
