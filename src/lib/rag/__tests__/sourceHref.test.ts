import { describe, expect, it } from "vitest";
import { sourceHref } from "@/lib/rag/sourceHref";

describe("sourceHref", () => {
  it("maps corpus files onto portfolio sections", () => {
    expect(sourceHref("about.md", "en")).toBe("/#intro");
    expect(sourceHref("skills.md", "es")).toBe("/es/#skills");
    expect(sourceHref("experience.md", "en")).toBe("/#work");
    expect(sourceHref("projects.md", "en")).toBe("/#projects");
    expect(sourceHref("work/embedded-rag.md", "en")).toBe("/work/embedded-rag");
    expect(sourceHref("work/mensura.md", "ca")).toBe("/ca/work/mensura");
    expect(sourceHref("notes.txt", "en")).toBe("/#projects");
  });

  it("maps education and contact onto the homepage sections that render them", () => {
    expect(sourceHref("education.md", "en")).toBe("/#edu");
    expect(sourceHref("education.md", "ca")).toBe("/ca/#edu");
    expect(sourceHref("contact.md", "en")).toBe("/#contact");
    expect(sourceHref("contact.md", "es")).toBe("/es/#contact");
  });

  it("maps privacy and Trace Theater onto their routes", () => {
    expect(sourceHref("privacy.md", "en")).toBe("/privacy");
    expect(sourceHref("privacy.md", "de")).toBe("/de/privacy");
    expect(sourceHref("trace-theater.md", "en")).toBe("/lab/trace");
    expect(sourceHref("trace-theater.md", "it")).toBe("/it/lab/trace");
  });

  it("maps CV citations onto the on-site CV download control", () => {
    expect(sourceHref("cv/marc-fors-cv.pdf", "en")).toBe("/cv#cv-download");
    expect(sourceHref("cv/marc-fors-cv.pdf", "es")).toBe("/es/cv#cv-download");
    expect(sourceHref("cv/other.pdf", "en")).toBe("/cv#cv-download");
    expect(sourceHref("marc-fors-cv.pdf", "fr")).toBe("/fr/cv#cv-download");
  });

  it("keeps projects without a case study on the projects section", () => {
    expect(sourceHref("projects/fileshelf.md", "en")).toBe("/#projects");
    expect(sourceHref("projects/media-downloader.md", "es")).toBe("/es/#projects");
    expect(sourceHref("projects/spotiapp.md", "fr")).toBe("/fr/#projects");
    expect(sourceHref("projects/gh-dashboard.md", "en")).toBe("/#projects");
    expect(sourceHref("projects/business-manager.md", "de")).toBe("/de/#projects");
    expect(sourceHref("work/fileshelf.md", "en")).toBe("/work/fileshelf");
  });
});
