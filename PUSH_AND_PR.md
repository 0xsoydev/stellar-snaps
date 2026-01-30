# Push & Create PR (against upstream)

Use these steps to push your changes and open a PR to **upstream** (`0xsoydev/stellar-snaps`).

## 1. Check status and branch

```bash
cd "c:\Users\Wajiha Kulsum\Downloads\stellar\stellar-snaps"
git status
git branch
```

If you're on `main`, create a feature branch (or use existing `feature-ui`):

```bash
git checkout -b feature-ui-updates
```

## 2. Stage and commit

```bash
git add .
git status
git commit -m "feat(web): UI updates - developers hub, wallet flow, favicon, navbar

- Developers: wallet connection page with grid/glow background, API Key Creation card
- Developers hub: API Keys & Application ID page (product cards, Project/Keys/ID sections)
- Wallet flow: 'Connected. Wrong wallet? Change Wallet', no grey card on grid bg
- Developer hub: reddish-orange faded/blurred grid, scroll-based header animation
- Navbar: consistent on developers, hub, api-keys pages; initial transparent style
- Favicon: use stellardark.png for browser tab
- Hub header: wallet address + orange gradient Disconnect button, sticky scroll animation"
```

## 3. Fetch latest upstream (optional but recommended)

```bash
git fetch upstream
git merge upstream/main
# resolve any conflicts if needed, then:
# git add . && git commit -m "Merge upstream/main"
```

## 4. Push to your fork (origin)

```bash
git push -u origin feature-ui-updates
```

If the branch already exists on origin:

```bash
git push origin feature-ui-updates
```

## 5. Open PR against upstream

1. Go to **your fork**: https://github.com/wajiha-kulsum/stellar-snaps
2. You should see a banner **"feature-ui-updates had recent pushes"** with a **Compare & pull request** button.
3. **Important:** Change the base repo from `wajiha-kulsum/stellar-snaps` to **`0xsoydev/stellar-snaps`** (upstream).
   - Click "compare across forks".
   - **base repository:** `0xsoydev/stellar-snaps`, **base:** `main`
   - **head repository:** `wajiha-kulsum/stellar-snaps`, **compare:** `feature-ui-updates`
4. Add a title and description, then click **Create pull request**.

**Direct link** (after pushing):

- https://github.com/0xsoydev/stellar-snaps/compare/main...wajiha-kulsum:stellar-snaps:feature-ui-updates

(Replace `feature-ui-updates` with your branch name if different.)

---

## Quick one-liner (after you're on the right branch)

```bash
cd "c:\Users\Wajiha Kulsum\Downloads\stellar\stellar-snaps" && git add . && git status
```

Then run the `git commit` and `git push` from above.
