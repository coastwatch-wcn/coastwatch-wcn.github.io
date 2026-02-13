# GitHub Actions: TurtleWatch TOTAL Dashboard Auto-Update

This repository uses GitHub Actions to automatically refresh the TurtleWatch/TOTAL dashboard content on a schedule.

The workflow runs a series of Python scripts that:

- scrape and/or update data
- generate plots/maps
- render the Quarto website
- deploy the site directly to GitHub Pages

The live website stays up-to-date without manual rerendering or committing generated files.

---

## Where this automation lives

Workflow file:
.github/workflows/update-total.yml

Workflow name shown in GitHub Actions:
Update TurtleWatch TOTAL Dashboard

---

## When it runs

This workflow runs in two ways:

### 1) Scheduled runs (automatic)

It runs 3 times per month via cron schedules:

- 0 12 3 * * → runs on the 3rd of each month at 12:00 UTC
- 0 12 16 * * → runs on the 16th of each month at 12:00 UTC
- 0 12 28 * * → runs on the 28th of each month at 12:00 UTC

### 2) Manual runs (on demand)

workflow_dispatch enables a Run workflow button in the GitHub Actions UI so maintainers can trigger the update anytime.

## Deployment Model

This repository uses:

GitHub Pages → Source: GitHub Actions

The workflow:

1. Renders the Quarto site into docs/
2. Uploads docs/ as a Pages artifact
3. Deploys it using actions/deploy-pages

The site is not committed back to main.
Rendered output exists only in the Pages deployment artifact.

---
## Permissions

```
permissions:
  contents: read
  pages: write
  id-token: write
```

- contents: read → allows repo checkout
- pages: write → allows deployment to GitHub Pages
- id-token: write → required for GitHub Pages OIDC deployment

No commit permissions are required.

---

## Concurrency Control

```
concurrency:
  group: "pages"
  cancel-in-progress: true
```

Prevents overlapping deployments.
If a new run starts while another is deploying, the previous run is canceled.

---

## What the workflow does (step-by-step)

The workflow has one primary job: update.

```
jobs:
  update:
    runs-on: ubuntu-latest
```

### Step 1 — Checkout the repository

```
- name: Checkout repo
  uses: actions/checkout@v4
```

Downloads repository contents onto the runner.

### Step 2 — Set up Python

```
- name: Set up Python
  uses: actions/setup-python@v5
  with:
    python-version: "3.11"
    cache: "pip"
```

Creates a Python 3.11 environment.
Enables pip dependency caching (based on requirements.txt).

### Step 3 — Install Python dependencies

```
- name: Install dependencies
  run: |
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
```

Dependencies are defined centrally in requirements.txt.

This includes:

- pandas, numpy, xarray, netCDF4
- requests, python-dateutil
- beautifulsoup4, lxm
- matplotlib, cartopy, plotnine
- openpyxl (for Excel reads)
- jupyter/ipykernel/nbformat (required for Quarto execution)

### Step 4 — Install Quarto

```
- name: Setup Quarto
  uses: quarto-dev/quarto-actions/setup@v2
```

Installs Quarto CLI for rendering.

### Data update scripts (what gets refreshed)

These steps run Python scripts that update dashboard data and derived outputs (plots/maps).

### Step 5 — Run TOTAL update controller

``` yml
- name: Run TOTAL update controller
  run: python projects/turtlewatch/scripts/control_total_data_2025.py
```

#### `control_total_data_2025.py` (Controller Script Overview)

This script is the top-level controller for the TurtleWatch TOTAL dashboard update pipeline. It checks the latest available MUR SST anomaly month on ERDDAP and compares it to the most recent local indicator CSV and monthly SST maps. If the website data is behind, it runs subordinate scripts (update_total_indicator_2025.py, plot_total_tool_2025.py, & make_monthly_maps_2025.py) to update the indicator time series, regenerate the indicator plot, and create new monthly maps. After updates, it builds a small `web_data.json` file used by the dashboard to display alert status, forecast month, latest index value, and last update date. In short, it decides what needs updating and ensures the website data products stay synchronized with ERDDAP.


### Step 6 — Scrape ENSO status

``` yml
- name: Scrape ENSO status
  run: python projects/turtlewatch/scripts/scape_elnino_2025.py
```

#### `scape_elnino_2025.py` (ENSO Scraper Overview)

This script scrapes the NOAA Climate Prediction Center (CPC) website for the latest ENSO (El Niño/La Niña) advisory information, including the issue date, alert status, and synopsis text. It compares the scraped advisory date to the locally stored JSON file and only updates if a newer advisory is available (unless a custom date is specified). When new data is found, it writes a dated archive JSON file and updates the primary `elnino_last.json` file used by the website. The resulting JSON files are stored in `projects/turtlewatch/data/json/` and are read by the Quarto dashboard pages to display current ENSO status. In short, this script keeps the website’s ENSO advisory information synchronized with the CPC website.


### Step 7 — Scrape Heatwave status

``` yml
- name: Scrape Heatwave status
  run: python projects/turtlewatch/scripts/update_heatwave_2025.py
```

#### `update_heatwave_2025.py` (Heatwave Scraper Overview)

This script scrapes the NOAA PSL marine heatwaves page for the latest forecast date/period and the regional narrative summaries for the **North Pacific** and **Tropical Pacific**. It compares the newly scraped content (and parsed forecast date) against the existing local `heatwave.json` and updates the files if the date or text has changed (or if `--overwrite` is used). When an update is needed, it writes/overwrites `projects/turtlewatch/data/json/heatwave.json` and also saves a dated archive copy like `YYYYMM_heatwave.json` in the same folder. These JSON outputs are read by the TurtleWatch Quarto pages to display the current marine heatwave status text and metadata. In short, it keeps the website’s heatwave status block synchronized with NOAA PSL.


### Step 8 — Update closure history from Federal Register

``` yml
- name: Update closure history from Federal Register
  run: python projects/turtlewatch/scripts/update_Itca_closure.py
```

#### `update_ltca_closure.py` (LTCA Closure Updater Overview)

This script queries the Federal Register API for new Pacific Loggerhead Conservation Area (LTCA) closure notices published by NOAA/NMFS. It filters results for relevant “loggerhead” or “highly migratory” closure announcements and compares them against the existing `ltca_closure.csv` file. Any new notices (based on missing URLs) are appended to the dataset, preserving existing records. The updated CSV is written to `projects/turtlewatch/data/resources/ltca_closure.csv`, which is used by the Quarto dashboard to display closure history. In short, it keeps the website’s closure dataset synchronized with the Federal Register without manual edits.

### Deploying to GitHub Pages
### Step 9 — Upload Pages artifact

```
- name: Upload Pages artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: docs
```

Uploads the rendered site as a deployment artifact.

### Step 10 — Deploy to GitHub Pages

```
deploy:
  needs: update
  runs-on: ubuntu-latest
  environment:
    name: github-pages
  steps:
    - name: Deploy to GitHub Pages
      uses: actions/deploy-pages@v4
```

Publishes the artifact to GitHub Pages.

No git commits occur.

---

## What to expect after it runs

After a successful workflow run:

- projects/turtlewatch/data/ contains updated data
- docs/ was rendered during the workflow
- The GitHub Pages site updates automatically

You will not see a commit adding docs/ changes — deployment happens via artifact.

--- 

## Common Troubleshooting

The workflow succeeds but the site doesn't update

- Confirm GitHub Pages is set to Source: GitHub Actions
- Check the Pages deployment status under the "Deployments" tab

---

## The workflow fails during render

Missing dependency in requirements.txt

- Excel reads require openpyxl
- Notebook execution requires jupyter, ipykernel, nbformat

---

## Scraping fails

- External site HTML changed
- Site temporarily unavailable
- Check logs in the Actions tab
