# PsychPhiDims website: setup guide

This folder is the full website for **psychphidims.com**: five pages (Home, About, Speaking & Training, Writing & Media, Contact), a thank-you page, and an editing screen at **/admin**.

You only do these steps once. Allow about an hour. Once it's live, updating the site is just: open psychphidims.com/admin → edit → Publish.

---

## What you need

- Your **GitHub** account (the one your affirmation app uses)
- Your **Cloudflare** account, with psychphidims.com added to it
- Your **Substack** address (for example `https://philipdimka.substack.com`)
- Optional now, easy later: photos, social media links, your Balm website link

---

## Step 1: Put the site on GitHub

1. Go to **github.com → New repository**.
2. Name it `psychphidims-site`. Choose **Private** or **Public** (either works). Click **Create repository**.
3. On the next screen, click **uploading an existing file**.
4. Unzip `psychphidims-site.zip` on your computer. Open the folder, select **everything inside it**, and drag it onto the GitHub page. Wait for the upload to finish.
5. Click **Commit changes**.

## Step 2: Tell the editor where the site lives

1. In your new GitHub repository, open `src/admin/config.yml`.
2. Click the **pencil** icon (Edit).
3. On the line `repo: YOUR-GITHUB-USERNAME/psychphidims-site`, replace `YOUR-GITHUB-USERNAME` with your GitHub username (for example `phidims-4225`).
4. Click **Commit changes**.

## Step 3: Publish on Cloudflare

1. In Cloudflare, go to **Workers & Pages → Create**. Choose the **Pages** tab. If you only see Workers, look for the link that says *"Looking to deploy Pages?"*.
2. Choose **Connect to Git**, sign in to GitHub if asked, and pick `psychphidims-site`.
3. Use these build settings:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `_site`
   - Under **Environment variables**, add `NODE_VERSION` = `20`
4. Click **Save and Deploy**. After a minute or two you'll get a preview address ending in `.pages.dev`. Open it and look around.

## Step 4: Connect psychphidims.com

1. In the Pages project, open **Custom domains → Set up a custom domain**.
2. Add `psychphidims.com`, then add `www.psychphidims.com` as well.
3. Cloudflare sets up the records and the padlock (https) for you. This usually takes a few minutes.

## Step 5: Sign in to the editing screen

1. Create a key for the editor. On GitHub, go to **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - **Name:** `PsychPhiDims editor`
   - **Expiration:** 1 year (set a reminder to renew it)
   - **Repository access:** Only select repositories → `psychphidims-site`
   - **Permissions → Repository → Contents:** Read and write
   - Click **Generate** and copy the token. Keep it private, like a password.
2. Go to **psychphidims.com/admin**, choose **Sign in with token**, and paste it in.
3. You'll see **Website**, with Site settings and one entry for each page. Edit, then click **Save/Publish**. The live site updates in about 1–2 minutes.

## Step 6: Fill in your details (in /admin → Site settings)

| Setting | What to enter |
|---|---|
| Substack address | Your Substack link. The latest posts then appear automatically. |
| Social links | Your Facebook, Instagram, Substack and YouTube links |
| Balm Therapeutic Services website | Balm's web address. This is where therapy enquiries go. |
| Photos | Upload your portrait, a speaking photo and a training photo |
| Reply time | For example `3` |
| Contact form key | See Step 7 |

Then replace the remaining **[bracketed]** text:

- **About page:** your story and your education/certifications
- **Contact page:** your reply time

## Step 7: Make the contact form deliver to your inbox

1. Go to **web3forms.com**, enter the email address that should receive messages, and they'll email you an **Access Key**.
2. Paste it into **/admin → Site settings → Contact form key** and publish.

Until the key is set, the Send button opens the visitor's own email app instead, so no message is lost.

## Step 8: Email address and affirmation app

- **hello@psychphidims.com:** in Cloudflare, go to **Email → Email Routing**, turn it on, and forward `hello@` to your Gmail. To reply *from* that address, add it in Gmail under **Settings → Accounts → Send mail as**.
- **affirm.psychphidims.com:**
  1. In **Vercel**, open your Today's Affirmation project → **Settings → Domains** and add `affirm.psychphidims.com`.
  2. In **Cloudflare DNS**, add a **CNAME** record: name `affirm`, target `cname.vercel-dns.com`, proxy status **DNS only** (grey cloud).

---

## How the live parts work

- **Latest writing** reads your Substack feed every 30 minutes. Nothing to update by hand.
- **Today's Affirmation.** The date changes daily. The text comes from the *fallback affirmation* you write in /admin → Home page. If your affirmation app gets a small data address (for example `https://affirm.psychphidims.com/api/today`), put it in **Site settings → Affirmation data address** and the homepage will show the app's affirmation each day.
- **Newsletter signup** sends people to your Substack to confirm their subscription.
- **Speaking page:** "Recent engagements" and the quote stay hidden until you add them in /admin. Only use real quotes, with permission.
- **Videos:** add YouTube links in /admin → Writing & Media page. The thumbnails appear automatically.

## Short links included

- `psychphidims.com/affirmation` → your affirmation app
- `psychphidims.com/book` → the contact page

---

## For a developer (optional)

- Built with **Eleventy 3** (`npm install`, `npm start` for a local preview, `npm run build` → `_site/`).
- Content lives in `src/_data/*.json`, and `/admin` edits those files (Sveltia CMS, GitHub backend).
- Cloudflare Pages Functions: `functions/api/substack.js` (RSS → JSON, cached) and `functions/api/affirmation.js` (optional proxy to the affirmation app).
- Styles: `src/assets/css/site.css`. Behaviour: `src/assets/js/site.js`.
