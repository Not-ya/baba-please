# Baba, Please — GitHub Pages edition

A playful one-page interactive plea with sticky notes, full-screen launch, a 5-question timed IGCSE-style Physics electricity quiz, and a final verdict.

## Launch from GitHub Actions

1. Create a **new public repository** at https://github.com/new, named `baba-please` (or another name). Your GitHub account is `Not-ya`.
2. Extract this ZIP and open your terminal in the `baba-github-pages` folder.
3. Run (replace the remote URL if you chose another name):

```bash
git init
git branch -M main
git add .
git commit -m "Launch Baba Please website with GitHub Actions"
git remote add origin https://github.com/Not-ya/baba-please.git
git push -u origin main
```

4. In the repository, open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
5. Open the **Actions** tab and watch **Deploy Baba Please to GitHub Pages**. If it has not started automatically, use **Run workflow**.
6. Once deployment succeeds, visit `https://not-ya.github.io/baba-please/` (replace the repository name if different).

### Important limitations

- GitHub Pages is static hosting. It **cannot by itself save quiz results to a remote database**. This version saves the quiz answers and the verdict in the **visitor's browser only** using `localStorage`. It does not send the result to the owner. Never tell visitors their data is stored online until a backend is configured.
- Browsers require a user gesture for fullscreen; the **Enter Presentation** button asks for fullscreen when supported. Visitors can exit fullscreen.
- The five-minute quiz is **informal practice**, not an official Cambridge exam.
- Hosting here will **not** update `baba.floot.app`: that site belongs to Floot. The GitHub Pages URL is separate.
