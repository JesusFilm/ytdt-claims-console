import { PipelineRun } from "@/types/PipelineRun"

export function formatRunFiles(
  files:
    | PipelineRun["files"]
    | {
        claimsME?: File | null
        claimsM2?: File | null
        mcnVerdicts?: File | null
        jfmVerdicts?: File | null
      },
  useFileName = false
): string[] {
  const fileList = []

  if (
    files &&
    typeof files === "object" &&
    "claimsME" in files &&
    files.claimsME
  ) {
    const name = useFileName ? files.claimsME.name : files.claimsME
    fileList.push(`Claims (ME): ${name}`)
  }
  if (
    files &&
    typeof files === "object" &&
    "claimsM2" in files &&
    files.claimsM2
  ) {
    const name = useFileName ? files.claimsM2.name : files.claimsM2
    fileList.push(`Claims (M2): ${name}`)
  }
  if (
    files &&
    typeof files === "object" &&
    "mcnVerdicts" in files &&
    files.mcnVerdicts &&
    typeof files.mcnVerdicts === "object" &&
    "name" in files.mcnVerdicts
  ) {
    const name = useFileName ? files.mcnVerdicts.name : files.mcnVerdicts
    fileList.push(`MCN Verdicts: ${name}`)
  }
  if (
    files &&
    typeof files === "object" &&
    "jfmVerdicts" in files &&
    files.jfmVerdicts &&
    typeof files.jfmVerdicts === "object" &&
    "name" in files.jfmVerdicts
  ) {
    const name = useFileName ? files.jfmVerdicts.name : files.jfmVerdicts
    fileList.push(`JFM Verdicts: ${name}`)
  }

  return fileList
}
