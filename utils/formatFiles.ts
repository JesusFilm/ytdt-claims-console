import { PipelineRun } from "@/types/PipelineRun";

export function formatRunFiles(
  files: PipelineRun['files'] | { claims?: File; mcnVerdicts?: File; jfmVerdicts?: File; }, 
  useFileName = false
): string[] {
  const fileList = [];
  
  if (files.claims) {
    const name = useFileName ? files.claims.name : files.claims;
    fileList.push(`Claims: ${name}${!useFileName && files.claimsSource ? ` (${files.claimsSource})` : ''}`);
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