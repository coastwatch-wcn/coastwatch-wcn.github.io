# GitHub Actions: Render & Deploy Quarto Site

This workflow automatically builds and deploys the Quarto website whenever changes are pushed to the `main` branch.

It uses the **GitHub Actions → GitHub Pages (artifact deployment)** model.
The site is rendered during the workflow and deployed directly to Pages without committing the generated `docs/` folder back to the repository.

---

## Workflow File Location

```
.github/workflows/render-deploy-site.yml
```

Workflow name shown in GitHub:

**Render & Deploy Quarto Site**

---

## When It Runs

This workflow runs in two ways:

### 1) Automatically on push to `main`

```yaml
on:
  push:
    branches: [main]
```

Any push to the `main` branch triggers a site rebuild and redeploy.

### 2) Manually (on demand)

```yaml
workflow_dispatch:
```

This enables a **Run workflow** button in the GitHub Actions UI.

---

## Permissions

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

These permissions allow the workflow to:

* Read repository contents
* Upload a Pages deployment artifact
* Deploy to GitHub Pages using OpenID Connect (OIDC)

No commit or push permissions are required.

---

## Concurrency Control

```yaml
concurrency:
  group: "pages"
  cancel-in-progress: true
```

This prevents overlapping deployments.

If a new push happens while a deployment is running, the previous run is automatically canceled.

---

## Job Overview

The workflow has two jobs:

1. **build**
2. **deploy**

---

# Build Job

Runs on an Ubuntu virtual machine.

```yaml
runs-on: ubuntu-latest
```

It also includes this safeguard:

```yaml
if: github.actor != 'github-actions[bot]'
```

This prevents infinite loops if a bot account pushes changes.

---

## Step-by-Step Breakdown

### 1. Checkout the Repository

```yaml
- uses: actions/checkout@v4
```

Downloads the repository so Quarto and scripts can access project files.

---

### 2. Install Quarto

```yaml
- uses: quarto-dev/quarto-actions/setup@v2
```

Installs the Quarto CLI on the runner.

---

### 3. Set Up Python

```yaml
- uses: actions/setup-python@v5
  with:
    python-version: "3.11"
    cache: "pip"
```

Creates a Python 3.11 environment.

`cache: "pip"` enables dependency caching based on `requirements.txt` to speed up future runs.

---

### 4. Install Python Dependencies

```yaml
pip install -r requirements.txt
```

Installs all required Python packages needed to:

* Execute Quarto Python cells
* Load data (pandas, numpy, xarray, etc.)
* Generate plots/maps
* Scrape or process data if required

All dependencies are centrally defined in `requirements.txt`.

---

### 5. Render the Quarto Site

```yaml
quarto render
```

This:

* Executes all `.qmd` pages
* Runs embedded Python code
* Writes the rendered site output to the `docs/` folder

The `docs/` folder must match:

```yaml
project:
  output-dir: docs
```

in `_quarto.yml`.

---

### 6. Upload the Pages Artifact

```yaml
- uses: actions/upload-pages-artifact@v3
  with:
    path: docs
```

Uploads the rendered `docs/` folder as a GitHub Pages deployment artifact.

No files are committed back to the repository.

---

# Deploy Job

```yaml
deploy:
  needs: build
```

The deploy job runs **only after** the build job succeeds.

---

## Deployment Step

```yaml
- uses: actions/deploy-pages@v4
```

This publishes the uploaded artifact to GitHub Pages.

The repository must have:

```
Settings → Pages → Source: GitHub Actions
```

---

# Deployment Model Summary

This workflow uses the modern GitHub Pages deployment method:

* ✔ Build site inside GitHub Actions
* ✔ Upload rendered output as artifact
* ✔ Deploy artifact to Pages
* ✖ No committing generated `docs/` to `main`

This keeps the repository history clean and avoids large auto-generated diffs.

---

# What Happens After a Push

When someone pushes to `main`:

1. GitHub Actions starts the workflow
2. Quarto renders the site
3. The `docs/` folder is uploaded
4. Pages deploys the artifact
5. The live website updates automatically

---

# Troubleshooting

### Site did not update

* Confirm the workflow run succeeded
* Check the “Deployments” tab in GitHub
* Verify Pages source is set to **GitHub Actions**

---

### Render failed

* Missing dependency in `requirements.txt`
* Python execution error inside a `.qmd` page
* Quarto configuration issue

Check the Actions logs for the failing step.
