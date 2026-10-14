import fs from "fs"
import path from "path"

import { HELP, helpHref } from "./anchors"

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8")

describe("help anchors", () => {
  const helpPage = read("app/help/page.tsx")

  // The drift this prevents: a term linked from the UI to a section that no
  // longer exists, so clicking the label lands at the top of the page.
  it("should explain every term the UI can link to", () => {
    const missing = Object.entries(HELP).filter(
      ([, anchor]) => !helpPage.includes(`HELP.${anchorKey(anchor)}`)
    )
    expect(missing).toEqual([])
  })

  function anchorKey(anchor: string) {
    return Object.entries(HELP).find(([, v]) => v === anchor)![0]
  }

  it("should link labels to anchors that exist", () => {
    const sources = [
      "src/components/ClaimsCollectionTab/ClaimsCollectionTab.tsx",
      "src/components/UploadTab/UploadTab.tsx",
      "src/components/PipelineHistoryTab/PipelineHistoryTab.tsx",
    ].map(read)

    const used = sources.flatMap((source) => [
      ...source.matchAll(/helpHref\("(\w+)"\)/g),
      ...source.matchAll(/help="(\w+)"/g),
    ])
    expect(used.length).toBeGreaterThan(5)
    for (const [, key] of used) {
      expect(Object.keys(HELP)).toContain(key)
    }
  })

  it("should build hrefs that point at the help page", () => {
    expect(helpHref("mcnVsJfm")).toBe("/help#mcn-vs-jfm")
  })
})
