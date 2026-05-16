# Vicvian Feedmill

A lightweight feed mill management dashboard built as a static HTML/CSS/JS app.

## Preview Locally

1. Open `index.html` directly in your browser for a quick local preview.
2. For a proper local web server, run:
   ```bash
   cd /workspaces/Vicvian-Feedmill
   python3 -m http.server 8000
   ```
3. Visit `http://127.0.0.1:8000` in your browser.

## App Structure

- `index.html` — main app shell
- `styles.css` — layout and theme styles
- `script.js` — application behavior and data storage

## Default admin login

- Username: `victor`
- Password: `VicvianAdmin@2024`

## GitHub Pages Hosting

This repository includes a GitHub Actions workflow that publishes the site from the `main` branch to GitHub Pages automatically.

Once the workflow runs successfully, the public URL will be:

`https://vicvianfeed-source.github.io/Vicvian-Feedmill/`

> If you want GitHub Pages to serve from the repository root instead of the action-based deployment, enable Pages in the repo settings and choose `main` branch, root.

## Notes

- The app stores data locally using `localStorage`.
- For best results, open it over HTTPS when hosted.
- If you need a custom domain later, add a `CNAME` file and update GitHub Pages settings accordingly.

