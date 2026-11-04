# ShortDramaIndex (shortdramaindex.com)

The calm reference library and catalog database for short vertical dramas (mini dramas, micro dramas, duanju).

## Environment Variables & Required Secrets

The following environment variables and GitHub Repository Secrets are required:

| Variable / Secret | Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | Public / Runtime | Base canonical URL of the deployment (e.g. `https://shortdramaindex.com`). |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Runtime | Public Supabase project API URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Runtime | Public Supabase anonymous client API key. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server / Scripts Only** | Elevated service-role key used strictly in CI workflows and maintenance scripts (`/scripts`). Never committed or exposed to browser client code. |

## Data Ingestion & Export Scripts

### 1. CSV Data Import (`scripts/import-csv.ts`)
Validates and imports bulk catalog records as `hidden` entries for moderator review.

```bash
# Dry run validation
npx tsx scripts/import-csv.ts --dry-run --file scripts/sample.csv

# Execute live database import
SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/import-csv.ts --file scripts/sample.csv
```

