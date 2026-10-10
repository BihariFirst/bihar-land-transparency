# Transparency Indicator landing page update

The homepage is now branded as **Transparency Indicator — जनता की आवाज़, जवाबदेही का आधार**. The Bihar land-rights transparency campaign is presented as the first initiative, not as the limit of the overall platform.

## Included
- Responsive landing page with dark teal/gold hero, strong opening question, purpose, four action cards, impartiality principles, Bihar first-campaign section, and a clear disclaimer.
- Existing navigation and modules retained: Districts, Legal Database, Rights/Duties, Mutation Journey, Citizen Experience, Case Tracking, Complaint Journey, Research Dashboard, Reports, Admin/Data.
- No evidence/file upload controls added.
- Static official district/subdivision/circle hierarchy fallback from `public/data/bihar_official_master_data.json` when `VITE_API_URL` is not set.
- GitHub Pages Vite base path set to `/bihar-land-transparency/`.

## Deployment
1. Copy the contents of this project folder into the repository root.
2. Ensure the GitHub Pages workflow runs `npm ci` (or `npm install`) and `npm run build`, then deploys `dist/`.
3. For case submission, duplicate checking, case tracking and admin operations, configure `VITE_API_URL` to the deployed backend API URL, for example `https://YOUR-BACKEND.example/api`, as a GitHub Actions variable/environment value before building. GitHub Pages itself cannot run Express/SQLite.
4. Without `VITE_API_URL`, official static hierarchy and legal data can be read, but writes and backend-only functions intentionally show a configuration message rather than pretending data was saved.

## Validation note
The source package was updated. A dependency installation/build could not be completed in this execution environment because `npm install` timed out, so run `npm install` and `npm run build` in the repository/CI before publishing.
