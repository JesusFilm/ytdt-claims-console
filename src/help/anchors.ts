// Every term the console explains, in one place: the label links to the anchor
// and the help page renders the same key, so a term cannot drift away from its
// explanation. scripts/check-help-anchors (a test) fails if one loses the other.
export const HELP = {
  claimsAsOf: "claims-as-of",
  newClaims: "new-claims",
  queuedForReview: "queued-for-review",
  published: "published",
  ingested: "ingested",
  queued: "queued",
  audioLanguage: "audio-language",
  collector: "collector",
  owners: "owners",
  recentRuns: "recent-runs",
  verdicts: "verdicts",
  mcnVsJfm: "mcn-vs-jfm",
  claimsUpload: "claims-upload",
  scoreUnprocessed: "score-unprocessed",
  slackDrop: "slack-drop",
  history: "history",
  runModes: "run-modes",
  invalidIds: "invalid-ids",
} as const

export type HelpKey = keyof typeof HELP

export const helpHref = (key: HelpKey) => `/help#${HELP[key]}`
