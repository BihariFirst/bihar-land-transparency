# Separate page components

Each public section is now implemented in its own JSX file and imported by `src/app/App.jsx`. Menu labels and hash routes are maintained in `src/app/navigation.js`.

- `HomePage.jsx` — Transparency Indicator landing page
- `DistrictsPage.jsx` — District → Subdivision → Circle explorer
- `LegalRulesPage.jsx` — Act, amendments, Rules and source database
- `RightsPage.jsx` — rights, duties and accountability
- `ProcessPage.jsx` — mutation process journey
- `CitizenHelpPage.jsx` — citizen experience form (no file uploads)
- `CaseTrackingPage.jsx` — Citizen Case ID timeline
- `GrievancePage.jsx` — complaint timeline
- `ResearchPage.jsx` — aggregate research dashboard
- `ReportsPage.jsx` — reports and reform tracking concepts
- `AdminPage.jsx` — admin/data integrity tools

Shared API logic is in `src/services/api.js`; common UI pieces are in `src/components/Common.jsx`; process/form choices are in `src/data/constants.js`.
