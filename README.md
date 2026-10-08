# Bihar Land Transparency — All-in-One

Citizen-first research and public-accountability platform for Bihar land mutation (दाखिल-खारिज), revenue administration, legal framework, case tracking and reform research.

## Included in this build

- 38 Districts → 101 Subdivisions → 534 official Circle records
- Verified local master-data seed: `data/bihar_official_master_data.json`
- Browser-accessible master data: `public/data/bihar_official_master_data.json`
- Legal database 2011–present: `data/bihar_mutation_legal_database.json`
- All 23 sections of Bihar Land Mutation Act, 2011 represented with plain-language verified explanations
- 2021 amendment provisions, including Pre-Mutation Revenue Sketch Map, online mutation and appeal/revision changes
- Rights, duties and accountability dataset: `data/rights_duties_accountability.json`
- One-screen mutation journey / process map
- Complaint journey with number + date + authority timeline model
- Citizen Case ID (`BLTA-YYYY-XXXXXX` style)
- District + Case Number + Case Year duplicate protection
- District → Subdivision → Circle cascading selectors in citizen case form
- Admin/research dashboard
- Official master-data status and guarded live sync endpoint
- Legal source owner, source URL, verification date and current-status fields
- No PDF/photo/screenshot/document evidence upload
- Windows-safe development scripts: no `concurrently`, no `shell-quote`

## Development

Install dependencies once:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

Run backend in a second terminal:

```bash
npm run server
```

For production-style local serving:

```bash
npm run build
npm run server
```

The API defaults to port 4000. Vite defaults to port 5173.

## Master data

The application seeds SQLite from the bundled verified JSON before the API starts. It does **not** depend on a successful live scrape to populate Subdivision/Circle selectors.

Live official sync is available through the admin endpoint and is protected against partial imports. If fewer than 500 Circle records are parsed, the import is rejected and the existing verified dataset remains intact.

Official source:
https://land.bihar.gov.in/CircleOfficerContactList.aspx

## Legal verification

The legal UI uses the bundled JSON and distinguishes:

1. Act
2. Amendment Act
3. Rules / Rules Amendments
4. Department rules/circular layer
5. Digital service layer

A historical statutory deadline is not automatically presented as the current operational deadline. Current applicability must be verified against the latest amendment, Rules and departmental instructions.

## Data model

`District → Subdivision → Circle → Case → Case Events`

Case uniqueness:

`District + Case Number + Case Year`

Citizen allegations, verified procedural irregularity and final research findings are separate concepts.

## Privacy / evidence policy

This project intentionally does **not** provide evidence-file upload. Citizen experience is captured through structured numbers, dates, authorities, actions and suggestions only.
