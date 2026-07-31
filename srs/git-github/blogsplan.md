# Git and GitHub series: the parts people use daily and cannot explain

Same test as the Next.js series: **it belongs here only if someone can use the
command correctly for two years and still not be able to say what it does.**

Git is unusually good source material for this, because almost everybody learns
it as a list of incantations. The posts that land are the ones that replace a
memorised command with a model, because the model answers the next twenty
questions too.

- Category: `git`
- Tags: `Git`, `GitHub`, plus `Interviews` where it applies
- Kind: `essay` for the model-building ones, `note` for the sharp ones

---

## The one idea the whole series hangs off

**A commit is a snapshot, not a diff.**

Almost every Git confusion is downstream of getting this backwards. If commits
were diffs, rebase would be dangerous, cherry-pick would be free, and reflog
could not exist. Once a reader believes snapshots, half the list below becomes
obvious, which is exactly the feeling to aim for.

Post 1 establishes it. Every later post can lean on it in one sentence.

---

## Phase 1: the model

### 1. A commit is a snapshot, not a diff

- **Scene:** someone deletes a branch after merging, then panics because "the
  work is gone".
- **Worse fix:** re-cloning the repo.
- **Mechanism:** a commit is a full tree plus parent pointers. Diffs are
  computed on demand, for display. Branches are 41-byte files containing a hash.
- **The line:** a branch is a sticky note pointing at a commit, not a container
  holding one.
- **Boundary:** the snapshot model explains *storage*, not *sharing*. Push and
  pull are still the hard part.

Tags: `Git`, `Interviews`. Art: `schema`.

### 2. The three trees: working directory, index, HEAD

`reset --soft`, `--mixed` and `--hard` are one command moving three pointers.
Once the reader sees three trees, they stop memorising flags. Includes the only
one that destroys work, and why.

Tags: `Git`, `Interviews`. Art: `schema`.

### 3. Nothing is lost for ninety days

Reflog. The post that turns Git from frightening into recoverable. Recovering a
hard reset, a deleted branch, and a botched rebase, then explaining why it works
(commits are unreachable, not deleted, until gc runs).

Tags: `Git`. Art: `backfill`.

---

## Phase 2: history

### 4. Rebase does not move commits, it makes new ones

- **Scene:** rebase, force-push, a colleague pulls, and forty duplicate commits
  appear.
- **Mechanism:** rebase replays. New parent means new hash means a different
  commit, even with identical content.
- **The line:** rebase is copy-and-delete, not move.
- **Rule:** rewrite only what nobody else has.
- **Boundary:** "never rebase a public branch" is about *identity*, not danger.

Tags: `Git`, `Interviews`. Art: `pipeline`.

### 5. Why merge commits exist, and when the fast-forward hides one

Fast-forward vs three-way. Why `--no-ff` is a policy choice, and what
`git log --graph` is actually drawing.

Tags: `Git`. Art: `network`.

### 6. Squash merge is a trap for the branch you keep

Squashing produces one new commit that shares no ancestry with the branch's
originals. Merge that branch again and Git replays everything. The reason
long-lived branches and squash merge are a bad pair.

Tags: `Git`, `GitHub`, `Interviews`. Art: `pipeline`.

### 7. Cherry-pick, and the duplicate commit mystery

Same content, different hash. Why the commit appears twice in the log after the
branches merge, and what `-x` is for.

Tags: `Git`. Art: `pipeline`.

### 8. Force-push with lease

`--force` overwrites whatever is there. `--force-with-lease` refuses if someone
else pushed since you last fetched. One flag between "rewrote my branch" and
"deleted a colleague's afternoon".

Tags: `Git`. Art: `terminal`.

---

## Phase 3: daily friction

### 9. .gitignore does not untrack anything

The single most-asked Git question. Ignore rules apply to *untracked* files. The
file is already in the index, so Git keeps honouring it. `git rm --cached`, and
the committed `.env` problem. *This site had exactly that: `.gitignore` covered
`.env*.local` but not `.env`.*

Tags: `Git`, `Interviews`. Art: `terminal`.

### 10. Detached HEAD is not an error message

It is HEAD pointing at a commit instead of a branch. What is safe to do there,
how to keep work made in it, and why checking out a tag says it.

Tags: `Git`. Art: `network`.

### 11. Stash is a commit wearing a disguise

Two or three commits on an unnamed ref. Why `stash pop` can conflict, why `-u`
matters for untracked files, and why popping into a different branch usually
works. *Used in this repo to carry font work across a pull.*

Tags: `Git`. Art: `backfill`.

### 12. Bisect: finding the bad commit in seven steps instead of seventy

Binary search over history, and `bisect run` to automate it. The most valuable
Git command almost nobody has typed.

Tags: `Git`, `Interviews`. Art: `retrieval`.

---

## Phase 4: GitHub

### 13. Three merge buttons, three different histories

Merge commit, squash, rebase-and-merge. What each does to the graph, to
bisectability, and to reverting later. The choice is a team policy, not a
preference.

Tags: `GitHub`, `Interviews`. Art: `pipeline`.

### 14. A fork is just a clone with a link in the UI

What forks actually are, why PRs from them cannot read your secrets, and what
`pull_request_target` unlocked and why that is dangerous.

Tags: `GitHub`. Art: `network`.

### 15. Your Actions cache is not being hit

Cache keys, restore-keys, why a lockfile hash is the right key, and why the
cache silently misses on the default branch. Reading the timing to prove it.

Tags: `GitHub`, `Performance`. Art: `retrieval`.

### 16. Branch protection people think they have

Required checks that never run, so the PR waits forever. Reviews that do not
apply to admins. The settings that look enforced and are not.

Tags: `GitHub`. Art: `schema`.

### 17. The repo that got slow

Large files, why history keeps them forever, LFS, shallow and partial clones.

Tags: `Git`, `Performance`. Art: `backfill`.

### 18. Signed commits and what the badge proves

What "Verified" verifies, why it is not identity, and how the web editor signs
as GitHub.

Tags: `GitHub`. Art: `network`.

---

## Publishing order

1, 2, 3 first, in that order. They build the model, and every later post can
reference it instead of re-explaining. Then 9 and 4, which are the two most
searched. GitHub posts can interleave freely once the model posts are up.

Posts 9 and 11 both have a real incident in this repo attached, which is worth
more than any invented example.
