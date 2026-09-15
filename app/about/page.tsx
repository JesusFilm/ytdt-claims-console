import Link from "next/link"

import type { Metadata } from "next"

// Public page (no sign-in), used as the application home page on the Google
// OAuth consent screen, which must explain the app without a login.
export const metadata: Metadata = {
  title: "About YouTube Claims Pipeline — Jesus Film Project",
  description:
    "Internal Jesus Film Project tool that reviews YouTube Content ID claims on Jesus Film content.",
  robots: "index, follow",
}

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600">Jesus Film Project</p>
        <h1 className="text-3xl font-bold text-gray-900">
          YouTube Claims Pipeline
        </h1>
        <p className="text-gray-600">
          An internal tool used by Jesus Film Project staff to review YouTube
          Content ID claims made on Jesus Film content.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">What it does</h2>
        <p className="text-gray-700">
          Jesus Film Project manages its films on YouTube through YouTube
          Content ID. Each day the pipeline loads the claims report for our
          content owner accounts, identifies new videos that use Jesus Film
          content, and prepares them for staff review, for example confirming
          which film and language a video contains.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">
          Google data it uses
        </h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li>
            <strong>YouTube Analytics and Reporting</strong> (
            <code>yt-analytics.readonly</code>): read-only access to the
            system-managed claims reports of Jesus Film Project&apos;s own
            YouTube content owner accounts. Nothing is changed on YouTube.
          </li>
          <li>
            <strong>Google Sign-In</strong> (name, email): to let authorized
            Jesus Film Project staff sign in to this dashboard.
          </li>
        </ul>
        <p className="text-gray-700">
          Data stays within Jesus Film Project systems, is used only to review
          claims on our content, and is not sold or shared with third parties.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Who can use it</h2>
        <p className="text-gray-700">
          Access is limited to Jesus Film Project staff with organization Google
          accounts. It is not a public service.
        </p>
      </section>

      <footer className="border-t border-gray-200 pt-6 text-sm text-gray-600 space-x-4">
        <Link className="text-blue-600 hover:underline" href="/">
          Staff sign-in
        </Link>
        <a
          className="text-blue-600 hover:underline"
          href="https://www.jesusfilm.org/privacy/"
        >
          Privacy policy
        </a>
        <a
          className="text-blue-600 hover:underline"
          href="https://www.jesusfilm.org/terms/"
        >
          Terms of use
        </a>
      </footer>
    </main>
  )
}
