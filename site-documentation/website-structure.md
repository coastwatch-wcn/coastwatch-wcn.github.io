# Website Structure Documentation

This document describes the structure and organization of the CoastWatch West Code Node website. The site is built using **Quarto** and rendered to the `docs/` directory for publication via GitHub Pages.

---

## 1. Quarto Configuration (`_quarto.yml`)

The `_quarto.yml` file defines the overall site structure, navigation, styling, and rendering behavior.

### Project Settings

```yml
project:
  type: website
  output-dir: docs
  resources:
    - files/**
    - images/**
    - projects/**
```

- type: website → Enables multi-page website mode.
- output-dir: docs → Rendered HTML is written to docs/ (served by GitHub Pages).
- resources: → Ensures static assets (files, images, project content) are copied into the rendered site.

### Website Metadata & Navigation

``` yml
website:
  title: "CoastWatch West Code Node"
  favicon: images/coastwatch.png
  page-navigation: true
```

### Navbar Structure

The navigation bar is defined hierarchically:

**Top-Level Sections**

- Home
- Data Access
- Tools and Training
- Applications
- About

**Data Access**

- Data Catalog (data_catalog.qmd)
- Data Server (data_server.qmd)

**Tools and Training**

- Tools (tools.qmd)
- Training (training.qmd)
- Code Gallery (code_gallery.qmd)

**Applications**

- applications.qmd
  - Dynamically populated from a CSV (see spreadsheets/applications.csv)

**About**

- CoastWatch (coastwatch.qmd)
- Contact Us (contact_us.qmd)
- Customer Survey (customer_survey.qmd)
- News Archive (news_archive.qmd)

### HTML Output Settings

``` yml
format:
  html:
    theme: lux
    fontsize: 1.15em
    css: styles.css
    toc: true
    include-after-body: footer.html
    grid:
      body-width: 1100px
```

- theme: lux → Base Bootstrap theme.
- fontsize → Global text scaling.
- css: styles.css → Custom styling.
- toc: true → Enables table of contents on pages.
- include-after-body → Injects custom footer.
- grid.body-width → Controls content width.

**Execution Settings**

``` yml
execute:
  echo: false
  warning: false
  error: false
```

- Hides code by default.
- Suppresses warnings and errors in rendered output.
- Intended for clean production display.

---

## 2. Core Directory Structure

```
/docs/
```

- Auto-generated output from quarto render
- Contains final HTML site
- Should not be manually edited

```
/images/
```

- Global site images (logos, icons, figures)

```
/files/
```

- Static downloadable assets (PDFs, documents, etc.)

---

## 3. ```/projects/``` Directory

This folder contains all major web applications displayed on the Applications page.

Examples:

- projects/turtlewatch/
- projects/ecocast/

Each project may contain:

- Project-specific .qmd files
- Data folders
- Images
- Scripts
- JSON outputs
- Custom CSS/JS 

Projects are linked from:

- applications.qmd
- spreadsheets/applications.csv

---

## 4. ```/spreadsheets/``` Directory (Dynamic Content Sources)

This folder contains CSV files used as structured data sources for site pages.

```
applications.csv
```

- Controls which projects appear on the Applications page
- Add new rows to display additional projects

```
data_catalog_excel.csv
```

- Source for Data Catalog products
- Add/update rows to modify catalog entries

```
news_archive.csv
```

- Controls the News & Events archive page

```
tutorials.csv
```

- Controls tutorial listings on training/code pages

These CSV files act as content databases for Quarto pages that dynamically generate cards, tables, and listings.

---

## 5. Rendering Workflow

### Local Development

1. Edit .qmd, CSV, or project files

2. Run:

```
quarto render
```
3. Confirm changes in docs/

### Deployment

- Push changes to main
- GitHub Pages serves the docs/ folder
- Some projects may also rely on GitHub Actions for automated updates

---

## 6. Maintenance Notes

- Never manually edit files inside docs/
- When adding a new project:
  - Create folder under /projects/
  - Add entry to spreadsheets/applications.csv
  - Ensure paths are relative to rendered output
- When modifying data-driven pages, verify CSV schema consistency
