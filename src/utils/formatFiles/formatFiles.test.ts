import { formatRunFiles } from "."

describe("formatFiles", () => {
  describe("formatRunFiles", () => {
    it("should return empty array for empty object", () => {
      expect(formatRunFiles({})).toEqual([])
    })

    it("should format File objects with useFileName=true", () => {
      const files = {
        claimsME: new File([], "claims_me.csv"),
        claimsM2: new File([], "claims_m2.csv"),
        mcnVerdicts: new File([], "mcn.csv"),
        jfmVerdicts: new File([], "jfm.csv"),
      }
      const result = formatRunFiles(files, true)
      expect(result).toEqual([
        "Claims (ME): claims_me.csv",
        "Claims (M2): claims_m2.csv",
        "MCN Verdicts: mcn.csv",
        "JFM Verdicts: jfm.csv",
      ])
    })

    it("should format File objects with useFileName=false", () => {
      const file1 = new File([], "test1.csv")
      const file2 = new File([], "test2.csv")
      const file3 = new File([], "test3.csv")
      const file4 = new File([], "test4.csv")
      const files = {
        claimsME: file1,
        claimsM2: file2,
        mcnVerdicts: file3,
        jfmVerdicts: file4,
      }
      const result = formatRunFiles(files, false)
      expect(result).toEqual([
        "Claims (ME): [object File]",
        "Claims (M2): [object File]",
        "MCN Verdicts: [object File]",
        "JFM Verdicts: [object File]",
      ])
    })

    it("should handle partial files", () => {
      const files = {
        claimsME: new File([], "claims_me.csv"),
      }
      const result = formatRunFiles(files, true)
      expect(result).toEqual(["Claims (ME): claims_me.csv"])
    })

    it("should skip null/undefined files", () => {
      const files = {
        claimsME: null,
        claimsM2: undefined,
        mcnVerdicts: new File([], "mcn.csv"),
      }
      const result = formatRunFiles(files, true)
      expect(result).toEqual(["MCN Verdicts: mcn.csv"])
    })
  })
})
