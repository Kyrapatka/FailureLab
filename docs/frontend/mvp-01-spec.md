# FailureLab MVP-01 specification

## Discovery (2026-10-18)

The workspace contains only `go.mod` (`module FailureLab`) and `.idea/` metadata.
No frontend, README, tests, lockfile, AGENTS.md, or Git repository exists here.
`git status --short` reports “not a git repository”; no commits will be created.
The Go module stays untouched. Node is 22.16.0; use npm.cmd on Windows because
PowerShell blocks npm.ps1. Browser installations include Chrome and Edge.

## Scope and implementation sequence

Register a mock local repository, inspect its workspace, switch projects, and
reload without losing registered projects. No filesystem access, backend,
infrastructure execution, editors, or deployment.

1. Specify behavior and write domain, adapter, component and browser tests.
2. Establish React/TypeScript/Vite, router, query provider, storage and primitives.
3. Implement Projects and Add Project; validate this flow.
4. Implement Overview; run checks, browser scenarios and visual inspection.

## Functional requirements

- **FR-01 Routes:** `/` redirects to `/projects`; `/projects/:projectId` opens
  Overview. Unknown IDs and URLs show distinct recoverable not-found screens.
  Browser history and direct reload work through SPA fallback.
- **FR-02 Projects:** empty by default, compact list, name/path search (case
  insensitive search only), separate no-results, loading, error and Retry states.
- **FR-03 Add:** modal with required Repository path, optional Project name,
  explicitly mock Browse, Cancel. Trim user names; otherwise derive basename.
  Suggested names follow path changes until a custom name is entered. Browse
  preserves custom names. Errors preserve form values; pending blocks resubmit
  and dismissal; success creates one record and navigates to Overview.
- **FR-04 Paths:** trim surrounding whitespace; normalize Windows backslashes
  to slashes and remove trailing separators. Preserve case, including drive
  letters. Accept Unix absolute paths and drive-rooted Windows paths. Reject
  relative paths, UNC/device paths, URLs, repeated/internal mixed separators,
  dot segments, control characters and ambiguous roots. Root directories have
  no derivable project name and are rejected. This is textual comparison only,
  not physical equivalence or symlink resolution.
- **FR-05 Availability:** known demo directories have declared status;
  arbitrary paths are Not verified. Registration never checks or modifies disk.
- **FR-06 Readiness:** derive from available repository, at least one usable
  environment, and at least one usable scenario. Ready is compact; missing
  configurations show Setup Required; unavailable repository shows Needs
  Attention. Not verified shows Setup Required with verification explanation.
  Failed experiments never change readiness. Ready is preparation eligibility,
  not a guarantee of successful execution.
- **FR-07 Previews:** strictly project-scoped environments/scenarios (max 3),
  active Preparing/Running experiment, recent runs (max 5), newest createdAt
  first with ID tie-breaker. Display run ID, scenario, revision, status and time.
  Keep history visible for unavailable repositories. Future actions and tabs
  are disabled with visible explanations, with no fake routes or operations.
- **FR-08 Data:** Zod-validated models, typed async adapter, version-1 local
  storage envelope. Components never access storage. Invalid/unsupported
  storage raises a recoverable error without overwriting bytes. Failed writes
  do not report success. Explicit reset requires confirmation. Demo mode uses a
  separate in-memory adapter, never seeds user storage, and can be exited.
- **FR-09 Fixtures:** payment-api available, 0/0/0; auth-service available,
  2/3/5 (includes active run and failed run); order-service unavailable, 1/2/4.
  Stable IDs and foreign keys. Controlled delay/load/create failure injection
  through adapter options and documented development query parameters.
- **FR-10 Accessibility:** semantic navigation/main/headings, labels and linked
  errors, modal focus trap and restoration/Escape, visible focus, textual
  statuses, responsive sidebar and wrapping paths. English product UI.

## Data and boundaries

Project: id, name, repositoryPath, availability, createdAt, optional branch.
Environment/Scenario: id, projectId, name, description, usable.
Run: id, projectId, scenarioId, revision, status, createdAt.
Dataset: projects, environments, scenarios, runs. Readiness is never persisted.
Adapter: listProjects, getOverview, createProject, resetUserData.
TanStack Query owns async state; form state remains local. Demo and user modes
have separate caches. Storage parsing checks uniqueness and ownership links.

## Acceptance and test matrix

Results start Pending; the verification report records actual outcomes.

| AC | Observable contract | Planned evidence |
|---|---|---|
| AC-01 | Empty Projects | component + E2E-01 |
| AC-02 | Add opens form | component + E2E-02 |
| AC-03 | Browse shows demo directories | component + E2E-03 |
| AC-04 | Selection fills path | component + E2E-03 |
| AC-05 | Name derived from path | domain + E2E-02 |
| AC-06 | Custom name retained | component + E2E-03 |
| AC-07 | Empty path rejected | domain + component + E2E-04 |
| AC-08 | Duplicate blocked | adapter + component + E2E-05 |
| AC-09 | Cancel creates nothing | component + E2E |
| AC-10 | Exactly one record per submit | adapter concurrency + pending component + E2E |
| AC-11 | Creation navigates Overview | component + E2E-06 |
| AC-12 | Created record in Projects | E2E-07 |
| AC-13 | Search name and path | component + E2E |
| AC-14 | Separate No Search Results | component + E2E |
| AC-15 | Project switching changes Overview | E2E-08 |
| AC-16 | New project Setup Required | component + E2E-06 |
| AC-17 | Configured demo Ready | domain + component + E2E-09 |
| AC-18 | Preview limit 3 | domain + component |
| AC-19 | Recent limit 5 and sort | domain + component |
| AC-20 | Unavailable repository retains history | component + E2E-10 |
| AC-21 | Arbitrary path Not verified | adapter + E2E-02 |
| AC-22 | Persistence across reload | adapter + E2E-07 |
| AC-23 | Return preserves projects | E2E-07 |
| AC-24 | Future features clearly disabled | component + E2E-09 |
| AC-25 | Unknown project ID | component + E2E |
| AC-26 | Load/create error and retry | adapter + component + E2E |
| AC-27 | Project data isolation | domain + E2E-08 |
| AC-28 | Keyboard UX and modal focus | component + E2E |
| AC-29 | Narrow screen/long paths | browser layout assertions + screenshots |
| AC-30 | Typecheck/lint/tests/build | actual command logs |

## Risks

Dependency network access and browser launch may be restricted. Report actual
failures; never count environment errors as test RED. Storage is browser-local,
not a durable backend. Text path comparison intentionally does not infer case
sensitivity or resolve filesystem aliases. Demo data is visibly labelled.
