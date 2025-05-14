# Gitlab Scraper - Merge Requests

This tool will help scrape lines of code, contributions from each individuals.
These lines of additions and deletions can be configured to ignore test files and other patterns etc.

## Features

- Scrape lines of code (contributions) from a Gitlab repo based on assignees
- Group repositories to run reports on
- Scrape lines of code from multiple Gitlab repos
- View history of coverage


## Run the app

```bash
npm run dev
```

---------------------

## Build the app

# Build the react application
```bash
cd src/renderer
npm install
npm run build
```

# Build the electron application
```bash
cd ../..
npm install
npm run dist # or npm run pack
```
