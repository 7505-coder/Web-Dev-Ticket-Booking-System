Use the workspace root as the project root.

Project stack:
- Frontend: HTML, CSS, JavaScript, Bootstrap
- Backend: Node.js with Express
- Database: MongoDB

Implementation guidance:
- Keep the theme professional, responsive, and consistent with the dark teal/gold visual style.
- Preserve the shared frontend helpers in `public/js/common.js` and `public/js/layout.js` when adding pages.
- Keep backend code in CommonJS modules unless the project is explicitly migrated.
- Prefer focused changes and avoid unrelated refactors.
- Use the existing REST API structure for auth, events, bookings, and admin operations.
- Use `npm run seed` for sample data and `npm run dev` for local development.
