import { PipelineRun } from "@/types/PipelineRun";

export function formatRunFiles(
  files: PipelineRun['files'] | { claimsME?: File; claimsM2?: File; mcnVerdicts?: File; jfmVerdicts?: File; }, 
  useFileName = false
): string[] {
  const fileList = [];
  
  if (files.claimsME) {
    const name = useFileName ? files.claimsME.name : files.claimsME;
    fileList.push(`Claims (ME): ${name}`);
  }
  if (files.claimsM2) {
    const name = useFileName ? files.claimsM2.name : files.claimsM2;
    fileList.push(`Claims (M2): ${name}`);
  }
  if (files.mcnVerdicts) {
    const name = useFileName ? files.mcnVerdicts.name : files.mcnVerdicts;
    fileList.push(`MCN Verdicts: ${name}`);
  }
  if (files.jfmVerdicts) {
    const name = useFileName ? files.jfmVerdicts.name : files.jfmVerdicts;
    fileList.push(`JFM Verdicts: ${name}`);
  }
  
  return fileList;
}