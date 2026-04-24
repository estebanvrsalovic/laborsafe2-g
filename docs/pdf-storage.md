# PDF storage and annex policy

The application previously appended an "ANEXO: Datos del formulario (JSON)" page to generated PDFs when the form payload exceeded QR capacity. That behavior has been removed.

Current behavior:

- Generated PDF files no longer include the full JSON annex.
- A deterministic serial is generated for each report and embedded in the PDF footer.
- The app attempts to store the full form payload to the server via `POST /api/reports` before creating the PDF. In production this endpoint persists data to Vercel Postgres; in local development a `tmp/reports/*.json` fallback is used.
- The PDF's QR encodes a short recovery URL (`/reports/{serial}`) that lets the viewer retrieve the stored payload from the server.

Rationale:

- Avoids embedding potentially sensitive or large JSON inside the PDF.
- Enables central storage, retrieval, and management of reports.

If you want the README updated as well, I can either patch `README.md` in place or add a short addendum file — let me know which you prefer.
