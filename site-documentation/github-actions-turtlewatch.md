
# GitHub Actions: TurtleWatch TOTAL Dashboard Auto-Update

This repository uses **GitHub Actions** to automatically refresh the TurtleWatch/TOTAL dashboard content on a schedule. The workflow runs a series of Python scripts that **scrape and/or update data**, generate **plots/maps**, then **renders the Quarto website** and commits the updated outputs back to the repository.

The goal is that the live website stays up-to-date **without any manual rerendering**.

---

## Where this automation lives

Workflow file (typically):  
`.github/workflows/<workflow-name>.yml`

Workflow name shown in GitHub Actions:  
**Update TurtleWatch TOTAL Dashboard**

---

## When it runs

This workflow can run in two ways:

### 1) Scheduled runs (automatic)
It runs **3 times per month** via cron schedules:

- `0 12 3 * *`  → runs on the **3rd** of each month at **12:00 UTC**
- `0 12 16 * *` → runs on the **16th** of each month at **12:00 UTC**
- `0 12 28 * *` → runs on the **28th** of each month at **12:00 UTC**


### 2) Manual runs (on demand)
`workflow_dispatch` enables a **Run workflow** button in the GitHub Actions UI so maintainers can run it anytime.

---

## Permissions (why the workflow can push commits)

```yml
permissions:
  contents: write
```
This grants the workflow permission to commit and push changes back into the repository (required because the workflow updates docs/ and data files).

## What the workflow does (step-by-step)

The workflow has one job: update, running on an Ubuntu virtual machine:

``` yml
jobs:
  update:
    runs-on: ubuntu-latest
```

### Step 1 — Check out the repository

``` yml
- name: Checkout repo
  uses: actions/checkout@v4
```
This downloads the repo contents onto the runner so scripts and Quarto files are available.

### Step 2 — Set up Python

``` yml
- name: Set up Python
  uses: actions/setup-python@v5
  with:
    python-version: "3.11"
```
Creates a Python 3.11 environment on the runner.

### Step 3 — Install Python dependencies

``` yml
- name: Install dependencies
  run: |
   python -m pip install --upgrade pip
   python -m pip install \
     jupyter ipykernel nbformat \
     pandas numpy openpyxl \
     netCDF4 requests python-dateutil matplotlib cartopy \
     beautifulsoup4 lxml plotnine xarray
```
Installs required Python libraries for:

- data handling (pandas, numpy, xarray, netCDF4)
- HTTP + date handling (requests, python-dateutil)
- scraping/parsing (beautifulsoup4, lxml)
- plotting + mapping (matplotlib, cartopy, plotnine)
- notebook-related utilities (included, though scripts appear to be .py)

### Step 4 — Install Quarto

``` yml
- name: Setup Quarto
  uses: quarto-dev/quarto-actions/setup@v2
```
Installs Quarto on the runner so the site can be rendered.

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

### Rendering the website
### Step 9 — Render the Quarto site

``` yml
- name: Render Quarto site (to docs/)
  run: quarto render
```

**Important behavior**:

- Rendering produces the site output in docs/ (GitHub Pages typically serves from docs/ on the main branch).
- Any .qmd pages that read from projects/turtlewatch/data/ will now incorporate the newly updated data.


### Committing and pushing the updated outputs
### Step 10 — Commit updated files

``` yml
- name: Commit updated docs outputs
  run: |
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
    git add docs/ projects/turtlewatch/data/
    git commit -m "Automated dashboard update" || echo "No changes to commit"
    git push origin HEAD:main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
What this does:

- Sets a bot identity for the commit.
- Stages the rendered website output (docs/) and the updated dashboard data (projects/turtlewatch/data/).
- Commits with message "Automated dashboard update".
- If nothing changed, it prints "No changes to commit" and continues.
- Pushes the commit directly to main.

Why GITHUB_TOKEN is included:
GitHub provides a built-in token so the workflow can authenticate to push changes back to the repo.

### What to expect after it runs

After a successful workflow run:

- projects/turtlewatch/data/ should contain updated data products (CSV/JSON/etc.)
- docs/ should contain updated rendered HTML and updated images/assets
- The live GitHub Pages site should reflect new data after Pages finishes serving the updated docs/

## Common troubleshooting
#### The Actions run succeeds but the website doesn’t change

- GitHub Pages may take a minute to serve the new docs/ output.
- Confirm the commit was pushed to main and includes docs/ changes.

#### The Actions run fails during scraping

- The external site may have changed HTML structure or blocked the runner.
- Check the Actions logs for the failing script and update selectors/URLs.

#### The Actions run fails during quarto render

- Quarto may be missing system dependencies (rare, but mapping libraries can require system packages).
- Verify the render works locally; if it only fails in Actions, the runner may need additional apt packages.

#### No changes to commit (but you expected changes)

- The script outputs may be written somewhere not included in:
  - git add docs/ projects/turtlewatch/data/
- Or the scripts may be writing to a path that’s ignored by .gitignore
- Confirm file paths and where the Quarto pages read from.
