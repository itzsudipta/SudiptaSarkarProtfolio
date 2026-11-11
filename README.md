# Sudipta Sarkar · Portfolio IDE

Developed By Sudipta

A React portfolio modeled on a JetBrains workspace. Profile opens first. Visitors can browse projects, read research and patent records, view certificates, and send an enquiry. Projects and certificates come from editable JSON files fetched by the browser.

## Quick start

Use Node.js 20 or newer and npm. Extract the ZIP, open a terminal inside `sudipta-portfolio-ide/`, and run:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. To check the production site locally:

```sh
npm run build
npm run preview
```

## Project structure

```text
public/
  data/
    projects.json          Project catalog, featured selection and order
    certificates.json      Certificate titles, descriptions, scans and URLs
  images/
    certificates/          Certificate images and demo previews
    profile/               Portraits
    projects/              Project covers
  files/
    certificates/          Certificate PDFs
    projects/              Project documents
    research/              Paper and patent PDFs
    resume/                Downloadable CV
  certificates/            Optional automatic discovery inbox
src/
  assets/
    icons/                 Bundled technology and brand artwork
    style.css              Theme tokens, responsive layout, scrollbars
  components/               Project and certificate cards, panels, portrait,
                            search dialog, contacts and technology icons
  data/
    data.js                Profile, stack, contacts, research, and workspace files
    certificateGallery.js  Merge configured cards with discovered inbox files
  layouts/                 Title bar, toolbar and status bar
  pages/                   Profile, Home, Projects, Research, Certificates, Contact
  services/
    catalogs.js            Fetch, validate, retry and expose public JSON catalogs
    contact.js             Submit messages to FormSubmit
  utils/                   Downloads and workspace file helpers
  App.jsx                  IDE window state, tab selection, keyboard and actions
  main.jsx                 React entry point and stylesheet import
```

## Edit projects using JSON

Open `public/data/projects.json`. It contains an array of records. To **create**, copy a record, give it a new stable `id`, and change its fields. To **read** it, open Projects. To **update**, edit that record. To **delete**, remove the record from the array. The home page, tag filters, detail dialog, and generated CV use the same catalog.

| Field                           | Purpose                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------- |
| `id`                            | Required unique string, e.g. `filestacker`                                      |
| `name`                          | Required display title                                                          |
| `kind`, `description`, `detail` | Category, short card description, and full project brief                        |
| `tags`                          | Required array of strings; drives stack icons and filters                       |
| `featured`                      | Set to `true` to include on Home. Array order controls display order.           |
| `image`                         | Optional cover path, e.g. `/images/projects/preview.webp`                       |
| `art`                           | Built-in illustration if no image is supplied: `graph`, `fabric`, or `database` |
| `github`, `live`                | Repository and demo URLs. Leave empty to hide a link.                           |

Example record to insert into the array:

```json
{
  "id": "example-api",
  "name": "Example API",
  "kind": "BACKEND / JAVA",
  "description": "Customer records API built with Spring Boot.",
  "detail": "The service stores customer data in PostgreSQL.",
  "tags": ["Java", "Spring Boot", "PostgreSQL"],
  "featured": true,
  "art": "database",
  "image": "",
  "github": "",
  "live": ""
}
```

## Edit certificates using JSON

Use `public/data/certificates.json` for full control. A JSON-managed image belongs in `public/images/certificates/`, and a PDF belongs in `public/files/certificates/`. Enter the browser path without the `public` prefix. Deleting a managed record removes its card even if its asset is still on disk.

```json
{
  "id": "iot-credential",
  "title": "Internet of Things",
  "image": "/files/certificates/iot.pdf",
  "description": "Coursework on sensors, connected devices, and IoT applications.",
  "issuer": "NPTEL",
  "institution": "IIT Kharagpur",
  "url": ""
}
```

Use an existing file for `image`. An entry can instead use `demoImage` for a labeled demonstration. Add a verification URL to `url` when available. A scan opens in a keyboard-accessible viewer. PDFs also have a direct full-size link.

**Quick file-drop workflow:** Copy a PNG, JPEG, GIF, WebP, AVIF, SVG, or PDF into `public/certificates/`. Subfolders are supported. For example, `AWS-Cloud-Practitioner.pdf` becomes **AWS Cloud Practitioner**. Vite indexes this inbox at build time. Remove an automatic card by removing its inbox file. A scan named `iot.jpg` in the inbox replaces the configured `iot.svg` demo and keeps its description. To manage an automatic card solely through JSON, move its file into the managed images/files folders and add its record.

**Updating the hosted site:** JSON is fetched on page load. When you edit the source, deploy the updated JSON and any new assets, then refresh the page. The file-drop inbox requires a rebuild. Both JSON files must be valid arrays with unique IDs. Empty arrays are supported. A failed fetch or invalid record displays an error and a retry action.

## Personalize the portfolio

- Edit the biography, academic journey, current work, experience, contact URLs, technologies and footer credit in `src/data/data.js`.
- Set `photoUrl` to a published image or a path under `/images/profile/`. The Attach photo control creates a browser-local preview. Set `cvUrl` to a PDF under `/files/resume/` to use your own CV. Otherwise a text CV is generated from profile and catalog data.
- Research uses a five-column table. Each research entry has `id`, `type`, `title`, `details`, `url`, `linkLabel` and `demo`. The initial links are clearly marked demonstration searches. Replace them with the DOI, IEEE article, patent record, or a PDF from `/files/research/`, then set `demo` to `false`. Search Everywhere can find these records by title, type, or details.
- The contact form sends to the email configured in `data.js` through FormSubmit. Submit the live form once and confirm the activation message in the recipient inbox. Until that confirmation, delivery is dependent on FormSubmit activation. The form keeps visitor input after a failed request.
- Darcula and IntelliJ Light use CSS variables. Tech marks keep their brand colors in both themes. A new tag with no registered logo uses a code icon and retains its accessible name.
- The project tree level guides are controlled by the commented border declaration in the `.nested` rule in `style.css`.

## Workspace controls

Double Shift or Ctrl+Shift+F opens Search Everywhere. Arrow keys and Enter select a result. Use the project tree or Navigate menu to open files. Tabs support drag reorder, close buttons, middle-click, and keyboard navigation. Ctrl+Tab cycles tabs and Ctrl+W closes one when the browser forwards the shortcut. Window and File menus provide equivalent actions. The terminal supports `help`, `about`, `ls`, `open <file>`, `theme` and `clear`.

On phones the project panel becomes a drawer, the tool strip moves to the bottom, and the research table scrolls horizontally. Certificate previews contain the whole document and can be expanded with a tap.

## Deployment and credits

Deploy the contents of `dist/` to a static host after running `npm run build`. The default configuration uses the site root. The build includes both JSON files and public assets. Dependencies are pinned in `package-lock.json`.

Built with React, Vite, Tailwind CSS, Lucide and React Icons. Technology artwork comes from Devicon (license bundled in `src/assets/icons/`), Simple Icons (YOLO), and SVG Logos via Iconify (Gmail). Brand names and logos belong to their respective owners.

## Workspace appearance and recovery

First visits use Darcula. An explicitly saved light theme is restored before React mounts. When the last tab closes, the editor displays six keyboard-accessible file rows. Tab headings retain the same colors on hover; the active-tab indicator and keyboard focus outline are independent of hover.

The app applies one scrollbar style across scrolling elements, subject to OS and browser scrollbar settings. Catalog errors offer a retry, and each page has a render-error fallback so an error can be retried without closing other tabs. Console messages identify the failing operation. Contact-form values stay in place after an unsuccessful submission.

## Standalone blog (disabled)

Edit the sample entries in `src/data/blogs.json`. Each contains an id, title, unique slug, ISO date, author, summary, plain-text content, tags, and a boolean published flag. `src/data/blogPosts.js` selects published records, filters titles case-insensitively, and sorts by date. `src/pages/BlogPage.jsx` renders the grid and expandable post content; its stylesheet is local to that module. App does not import the page. The header link is commented out, and the blog JSON is outside public/. The sample posts are included in the source ZIP only.

Workspace minimize, maximize, and close controls are commented out in `src/layouts/TitleBar.jsx`. Their optional Window menu actions are commented out in `src/App.jsx`. Individual editor tabs retain their close buttons and keyboard shortcuts.

Search Everywhere and the theme switch are in the upper-right title bar. Download CV and GitHub are on the right of the second toolbar. Editor content begins directly beneath the tabs.
