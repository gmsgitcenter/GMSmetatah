# Premium Digital Wedding Invitation

Mobile-first static wedding invitation with Google Sheets RSVP backend.

## Project structure

- `index.html` — page structure
- `styles.css` — premium responsive styling
- `script.js` — countdown, calendar, maps, RSVP, wishes, music
- `config.js` — **the only file you normally edit per wedding**
- `apps-script/Code.gs` — Google Sheets backend
- `assets/` — photos/video/music

## 1. Configure the wedding

Open `config.js` and replace every `XXX`.

`startISO` and `endISO` should include the wedding timezone. For Bali/Indonesia use `+08:00`.

For Google Maps, set `venueMapsQuery` to the venue's name/address.

## 2. Google Sheets

Create a Google Sheet and open Extensions → Apps Script.

Paste `apps-script/Code.gs`.

Deploy as a Web app:
- Execute as: Me
- Who has access: Anyone

Copy the deployed `/exec` URL into `appsScriptUrl` in `config.js`.

The sheet will use:

| Timestamp | Name | Attendance | Guests | Message |
|---|---|---|---:|---|

Every RSVP creates a new row.

The invitation reads the same endpoint every 15 seconds and shows the latest wishes below RSVP.

### Important privacy note

The public GET endpoint exposes the names and messages stored in the sheet. Only use this design if guests have consented to public wedding wishes. If privacy is required, change the Apps Script to return only approved/public rows (recommended for production), or maintain a separate `PublicWishes` sheet.

## 3. GitHub Pages

Create a GitHub repository and upload the project files to its root.

In GitHub:
Settings → Pages → Build and deployment → Deploy from a branch → `main` → `/ (root)`.

Your URL will normally be:
`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`

No build step is required.

## 4. Assets

Put optimized files in `assets/`.

Expected optional files:
- `music.mp3`
- `hero.webp`
- `couple.webp`
- `gallery-01.webp`
- `wedding-video.mp4`

For the current template, replace the PHOTO placeholders with actual `<img>` elements and update the CSS as desired. Keep images around 1600px wide or less and use WebP/AVIF where possible.

## 5. Production checklist

- [ ] Replace all `XXX` values
- [ ] Add venue Maps query
- [ ] Set correct wedding start/end ISO timestamps
- [ ] Deploy Apps Script
- [ ] Paste Apps Script `/exec` URL
- [ ] Test RSVP creates a row
- [ ] Test wishes appear
- [ ] Test Google Maps
- [ ] Test Google Calendar
- [ ] Test mobile Safari/Chrome
- [ ] Add optimized media
- [ ] Enable GitHub Pages
- [ ] Test the final public URL

## Limitation requiring owner action

Google Apps Script deployment requires access to the Google account/Sheet and a one-time authorization/deployment by the owner. GitHub Pages likewise requires access to the target GitHub repository. Those credentials/authorizations cannot safely be completed from this template alone.
