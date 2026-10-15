import Link from "next/link"

import HelpSection from "@/components/HelpSection"
import { HELP } from "@/help/anchors"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Help — YouTube Claims Pipeline",
  robots: "noindex",
}

// Written for whoever opens this once a month. Each entry is reachable from the
// label it explains, so the explanation arrives where the question does.
const SECTIONS: Array<{
  title: string
  entries: Array<{ id: string; term: string; body: React.ReactNode }>
}> = [
  {
    title: "Collection",
    entries: [
      {
        id: HELP.claimsAsOf,
        term: "Claims as of",
        body: (
          <>
            The day the claims data covers, not the day we fetched it. YouTube
            publishes each report about two and a half days after the day it
            describes, so this date is always a few days behind. When the two
            content owners are on different days, both are shown as a range and
            the age refers to the older one.
          </>
        ),
      },
      {
        id: HELP.newClaims,
        term: "New claims",
        body: (
          <>
            How many claims the last collection added, out of all the rows it
            read. Most rows in a report are claims we already have — only the
            new ones are stored.
          </>
        ),
      },
      {
        id: HELP.queuedForReview,
        term: "Queued for review",
        body: (
          <>
            Claims waiting for a verdict, handed to YT-Validator so it can work
            out what language each video is in. The number grows as claims
            arrive and shrinks when verdicts are applied.
          </>
        ),
      },
      {
        id: HELP.owners,
        term: "Matter Entertainment and Matter 2",
        body: (
          <>
            Our two YouTube content owner accounts. Each publishes its own
            report on its own schedule, so one can be a few days ahead of the
            other. An owner marked <em>no newer report yet</em> simply has
            nothing new — its claims are still loaded, from the date shown.
          </>
        ),
      },
      {
        id: HELP.recentRuns,
        term: "Recent runs",
        body: (
          <>
            The last few daily collections. <em>No new snapshot</em> is the
            normal outcome on a day YouTube published nothing; it is not a
            failure. Click a row to see it in full on the History tab.
          </>
        ),
      },
    ],
  },
  {
    title: "Collection timeline",
    entries: [
      {
        id: HELP.published,
        term: "Published",
        body: (
          <>
            When YouTube made the report available to download. The gap between
            the data date and this is YouTube&apos;s, not ours.
          </>
        ),
      },
      {
        id: HELP.ingested,
        term: "Ingested",
        body: (
          <>
            When we downloaded the report, kept the claims on Jesus Film
            content, and stored the new ones.
          </>
        ),
      },
      {
        id: HELP.queued,
        term: "Queued",
        body: (
          <>
            When the claims still awaiting a verdict were sent to YT-Validator.
            This happens right after collection, every day.
          </>
        ),
      },
      {
        id: HELP.audioLanguage,
        term: "Audio language",
        body: (
          <>
            What language YouTube&apos;s own speech recognition heard in each
            video. It is evidence gathered for the monthly review, not a
            decision: nothing is approved or rejected here. Videos with no
            usable answer are counted as <em>none usable</em>, which covers a
            video with no automatic captions, one that forbids reading them, and
            one that has been deleted.
          </>
        ),
      },
      {
        id: HELP.collector,
        term: "Audio language collector",
        body: (
          <>
            The service that looks those languages up, 180 videos a day, limited
            by YouTube&apos;s daily budget. Its figures change once a day, after
            its 08:15 UTC run — the page says which run they came from.{" "}
            <em>Stopped</em> means it hit the daily limit or YouTube became
            unreachable, so fewer videos were looked up than usual.
          </>
        ),
      },
    ],
  },
  {
    title: "Running verdicts",
    entries: [
      {
        id: HELP.slackDrop,
        term: "Sending verdicts in Slack",
        body: (
          <>
            The simplest route: drop the verdict CSVs into{" "}
            <strong>#ytdt-pipeline</strong>. The bot reads them, says which is
            which, and offers a <strong>Run Pipeline</strong> button. Nothing
            runs until that button is pressed. If you prefer to be walked
            through it, type <code>/run-verdicts</code> instead.
          </>
        ),
      },
      {
        id: HELP.verdicts,
        term: "Verdicts",
        body: (
          <>
            Ben&apos;s decisions about claimed videos: which film and language
            each contains, or that it is not our content. Applying them is a
            monthly job. Claims arrive on their own every day, so verdicts are
            usually the only thing anyone uploads.
          </>
        ),
      },
      {
        id: HELP.mcnVsJfm,
        term: "MCN verdicts vs JFM verdicts",
        body: (
          <>
            <strong>MCN</strong> verdicts are about videos on other
            people&apos;s channels that use our content. <strong>JFM</strong>{" "}
            verdicts are about videos on our own channels. The two files look
            identical — same columns — so the difference is whose videos are
            listed inside. In Slack the bot works this out itself and tells you
            what it found.
          </>
        ),
      },
      {
        id: HELP.claimsUpload,
        term: "Uploading claims by hand",
        body: (
          <>
            Rarely needed. Claims are collected automatically every morning. Use
            this only if collection has stopped and someone has downloaded the
            claims report from YouTube Studio. If collection is merely stuck,
            the pipeline can usually fetch the newest report itself.
          </>
        ),
      },
      {
        id: HELP.scoreUnprocessed,
        term: "Score Unprocessed Claims",
        body: (
          <>
            Runs the scoring step alone, on the claims already collected,
            without uploading anything. Useful after the model changes; it
            applies no verdicts.
          </>
        ),
      },
    ],
  },
  {
    title: "History",
    entries: [
      {
        id: HELP.history,
        term: "What History shows",
        body: (
          <>
            Both kinds of activity, newest first: the daily claims collections
            and the pipeline runs that apply verdicts. The filters narrow it to
            one kind.
          </>
        ),
      },
      {
        id: HELP.runModes,
        term: "Full, scoring and partial runs",
        body: (
          <>
            <strong>Full</strong> did everything. <strong>Scoring</strong> only
            re-scored existing claims, with nothing uploaded.{" "}
            <strong>Partial</strong> ran a chosen subset of steps, usually after
            a failure.
          </>
        ),
      },
      {
        id: HELP.invalidIds,
        term: "Invalid MCIDs and language IDs",
        body: (
          <>
            Rows in a verdicts file whose media component id or language id does
            not exist in our reference data — usually a typo or an outdated
            code. They are reported, not applied. The run shows how many ids are
            wrong and how many rows they cost: one bad id repeated over a
            hundred rows is still one fix. The download lists each bad id once,
            with the videos carrying it, so they can be corrected and sent
            again.
          </>
        ),
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-4">
      <header className="space-y-2">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to the console
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          What the console is telling you
        </h1>
        <p className="text-gray-600">
          Plain explanations of the figures and buttons on each tab. Every
          heading here is linked from the label it explains.
        </p>
        <p className="text-gray-700">
          Doing the monthly verdicts?{" "}
          <Link href="/help/verdicts" className="text-blue-600 underline">
            Step-by-step, with screenshots →
          </Link>
        </p>
      </header>

      {SECTIONS.map((section) => (
        <HelpSection
          key={section.title}
          title={section.title}
          anchors={section.entries.map((entry) => entry.id)}
        >
          {section.entries.map((entry) => (
            <div key={entry.id} id={entry.id} className="scroll-mt-6 space-y-1">
              <h3 className="font-medium text-gray-900">{entry.term}</h3>
              <p className="text-gray-700">{entry.body}</p>
            </div>
          ))}
        </HelpSection>
      ))}

      <footer className="border-t border-gray-200 pt-4 text-xs text-gray-400">
        Part of the console, updated with it — console v
        {process.env.NEXT_PUBLIC_APP_VERSION || "2.0.0"}
        {process.env.NEXT_PUBLIC_COMMIT_SHA
          ? ` (${process.env.NEXT_PUBLIC_COMMIT_SHA.slice(0, 7)})`
          : ""}
        .
      </footer>
    </main>
  )
}
