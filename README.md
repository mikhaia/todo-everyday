# Todo Everyday

Todo Everyday is a lightweight task manager built with Nuxt 4 that helps you plan your day. Sign in with Google to sync your tasks via Firebase and organize them into customizable categories.

## Features

- Google authentication through Firebase
- Create, edit, and delete categories with icons and colors
- Background color and image for each category and for the general list (the **All tasks** row in the categories sidebar)
- Add tasks for specific days and assign them to categories
- Drag-and-drop reordering and marking tasks as complete
- Planning View with an hourly schedule, draggable/resizable tasks, and category-colored overview
- Presets: reusable lists of routine tasks you can add to any day in one click

## Planning

Use the **Planning** icon in the list header to switch between the day list and the planner. Choose the visible start and end times (07:00–23:00 by default). Drag an unplanned task onto the grid, or use its **+** button to book the first free hour. Move tasks or drag either edge to change their time in one-hour steps; use its edit icon to open a modal where you can enter times directly or **Unplan** it.

Tasks cannot overlap, including completed tasks and tasks in other categories. Changing the visible range does not change saved times. Each todo optionally stores `schedule: { date, start, end }` in Firestore, with start/end expressed in local minutes after midnight and an exclusive end (up to 1440). A schedule only applies when its date matches the task's date, so moving a task to another day does not reserve time there. Existing tasks need no migration.

Run the scheduling checks with Node.js 22.6 or later:

```bash
node --experimental-strip-types --test tests/planning.test.mjs
```

## Presets

A preset is a named list of routine tasks, each with its own category. Manage them on the **Presets** page (`/presets`): create a preset, edit its name and tasks (press Enter to add the next task, drag to reorder), or delete it.

On a day, open the **Presets** menu beside **Planning** and pick a preset to add its tasks to that day. Tasks already in the day (same title and category, done or not) are skipped, so applying a preset twice does not duplicate anything. Tasks whose category has been deleted are added without a category. New tasks go after the day's existing tasks, in preset order.

Presets are stored in `users/{uid}/presets` as `{ title, tasks: [{ title, categoryId }], createdAt }`. The Firestore security rules (managed in the Firebase Console, not in this repo) must allow the owner to read and write this collection; without it the Presets page shows "Firestore security rules don't allow the presets collection yet." Add this inside `match /databases/{database}/documents { … }` and publish:

```
match /users/{userId}/presets/{presetId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

```bash
node --experimental-strip-types --test tests/presets.test.mjs
```

## Setup

Install dependencies:

```bash
npm install
```

```bash
cp .env.example to .env
// add firebase api-keys to .env file
```

Start the development server:

```bash
npm run dev
```

## Production

Build the application:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```
