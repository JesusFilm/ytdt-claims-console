import Link from "next/link"

import HelpSection from "@/components/HelpSection"
import Screenshot from "@/components/Screenshot"
import { helpHref } from "@/help/anchors"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Running the monthly verdicts — YouTube Claims Pipeline",
  robots: "noindex",
}

// Screenshots are real: taken from the live console and the #ytdt-pipeline bot,
// cropped to the part being described rather than the whole window.
// Captured with the browser's region zoom, so these are true pixels rather than
// a 1x screenshot stretched: 2.3x the CSS size, drawn at half their width.
const SHOTS: Record<string, { w: number; h: number }> = {
  "/help/slack-detected.png": { w: 1486, h: 332 },
  "/help/slack-guided.png": { w: 1568, h: 335 },
  "/help/console-upload-empty.png": { w: 1568, h: 748 },
  "/help/console-upload-ready.png": { w: 1456, h: 829 },
  "/help/console-collection.png": { w: 1568, h: 719 },
}

const Shot = ({ src, alt }: { src: string; alt: string }) => (
  <Screenshot src={src} alt={alt} width={SHOTS[src].w} height={SHOTS[src].h} />
)

export default function VerdictsRunbookPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
      <header className="space-y-2">
        <Link href="/help" className="text-sm text-blue-600 hover:underline">
          ← All help
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Running the monthly verdicts
        </h1>
        <p className="text-gray-600">
          Two ways to do the same thing. Slack is fewer steps; the console shows
          more detail. Claims arrive on their own every morning, so verdicts are
          the only files anyone sends.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
          In Slack — the short way
        </h2>
        <ol className="list-decimal pl-5 space-y-2 text-gray-700">
          <li>
            Drag both verdict CSVs into the <strong>#ytdt-pipeline</strong>{" "}
            channel and send them. No command needed.
          </li>
          <li>
            The bot reads each file and replies with what it found — which is
            MCN, which is JFM, and how many rows. Check those two lines.
          </li>
          <li>
            Press <strong>▶ Run Pipeline</strong>. Nothing happens until you
            do.
          </li>
          <li>
            It takes about half an hour. The bot posts the result in the same
            channel, with buttons to the console and the Drive folder.
          </li>
        </ol>
        <Shot
          src="/help/slack-detected.png"
          alt="The bot naming each file — MCN verdicts and JFM verdicts — above a Run Pipeline button"
        />
        <p className="text-gray-700">
          If a line looks wrong — say a file named as MCN when you meant JFM —
          press <strong>Cancel</strong> and send it again on its own. The bot
          decides by looking at whose videos are listed inside the file, not by
          its name.
        </p>
        <p className="text-gray-700">
          Sending a claims file by mistake is safe: the bot says it is a claims
          file, ignores it, and runs nothing.
        </p>
      </section>

      <HelpSection
        title="In Slack — guided, if you prefer prompts"
        anchors={["guided"]}
      >
        <p className="text-gray-700">
          Type <code>/run-verdicts</code> and the bot asks for one file at a
          time: MCN first, then JFM. You can skip either. It behaves the same
          way afterwards.
        </p>
        <Shot
          src="/help/slack-guided.png"
          alt="The guided flow asking for the MCN verdicts file, step 1 of 2"
        />
      </HelpSection>

      <HelpSection title="In the console" anchors={["console"]}>
        <ol className="list-decimal pl-5 space-y-2 text-gray-700">
          <li>
            Open <strong>Upload &amp; Run</strong>. The{" "}
            <strong>Verdicts</strong> box is at the top — that is the one you
            want.
          </li>
          <li>
            Drop the MCN verdicts on the left and the JFM verdicts on the right.{" "}
            <Link href={helpHref("mcnVsJfm")} className="underline">
              Which is which?
            </Link>
          </li>
          <li>
            Check <strong>Ready to Process</strong> underneath: it lists the
            file names it is about to use.
          </li>
          <li>
            Press <strong>Run Pipeline</strong>, then watch{" "}
            <strong>Current Status</strong>. When the Drive step finishes it
            links straight to the folder.
          </li>
        </ol>
        <Shot
          src="/help/console-upload-empty.png"
          alt="Upload & Run with the Verdicts boxes first and claims collapsed below"
        />
        <Shot
          src="/help/console-upload-ready.png"
          alt="Both verdict files attached, with Ready to Process listing them"
        />
      </HelpSection>

      <HelpSection title="Afterwards" anchors={["afterwards"]}>
        <p className="text-gray-700">
          The notification says how many verdicts were applied, and how many ids
          were wrong — with the rows they affect — for{" "}
          <Link href={helpHref("invalidIds")} className="underline">
            invalid ids
          </Link>{" "}
          — those rows were not applied. The download lists each bad id once,
          with the videos carrying it, so you fix the id rather than scroll the
          rows. The scored file lands in the run&apos;s Drive folder.
        </p>
        <p className="text-gray-700">
          The{" "}
          <Link href="/" className="underline">
            Collection
          </Link>{" "}
          tab is separate: it shows the claims arriving daily, and needs nothing
          from you.
        </p>
        <Shot
          src="/help/console-collection.png"
          alt="The Collection tab, showing claims arriving automatically each morning"
        />
      </HelpSection>

      <HelpSection
        title="If something looks wrong"
        anchors={["troubleshooting"]}
      >
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>
            <strong>The bot says nothing after you send files.</strong> They may
            not be CSVs. Re-export from the spreadsheet as CSV and send again.
          </li>
          <li>
            <strong>It says a file is neither claims nor verdicts.</strong> The
            columns are not the expected ones — usually a renamed or missing
            column.
          </li>
          <li>
            <strong>A run fails.</strong> The channel gets a message saying what
            broke. Nothing is half-applied: verdicts are applied together or not
            at all.
          </li>
          <li>
            <strong>Claims look stale on the Collection tab.</strong> Nothing to
            do with verdicts — the daily collection is separate, and failures
            there are reported in the same channel.
          </li>
        </ul>
      </HelpSection>
    </main>
  )
}
