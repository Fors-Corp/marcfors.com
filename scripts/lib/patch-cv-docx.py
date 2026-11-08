#!/usr/bin/env python3
"""Replace the GitHub activity clause inside docs/cv/Marc_Fors_CV_AI.docx."""

from __future__ import annotations

import argparse
import re
import sys
import zipfile
from pathlib import Path

ACTIVITY_RE = re.compile(
    r"\d{1,3}(?:,\d{3})* GitHub contributions in the past year; "
    r"\d+ pull requests \(\d+ merged\) across \d+ repositories in the last 30 days\."
)


def patch(docx: Path, clause: str) -> bool:
    if not ACTIVITY_RE.fullmatch(clause) and not ACTIVITY_RE.match(clause):
        # Accept the clause as the replacement body; it must look like the template.
        if "GitHub contributions in the past year" not in clause:
            raise SystemExit(f"Refusing unexpected clause: {clause!r}")

    with zipfile.ZipFile(docx, "r") as zin:
        xml = zin.read("word/document.xml").decode("utf-8")
        others = {
            info.filename: zin.read(info.filename)
            for info in zin.infolist()
            if info.filename != "word/document.xml"
        }
        infos = [info for info in zin.infolist() if info.filename != "word/document.xml"]

    if not ACTIVITY_RE.search(xml):
        raise SystemExit("CV activity clause not found in word/document.xml")

    next_xml, n = ACTIVITY_RE.subn(clause, xml, count=1)
    if n != 1:
        raise SystemExit(f"Expected 1 replacement, got {n}")
    if next_xml == xml:
        return False

    tmp = docx.with_suffix(".docx.tmp")
    with zipfile.ZipFile(docx, "r") as zin, zipfile.ZipFile(tmp, "w") as zout:
        for info in zin.infolist():
            data = next_xml.encode("utf-8") if info.filename == "word/document.xml" else zin.read(info.filename)
            # Preserve compression type when possible.
            zout.writestr(info, data)
    tmp.replace(docx)
    return True


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("docx", type=Path)
    parser.add_argument("clause")
    args = parser.parse_args()
    changed = patch(args.docx, args.clause)
    print("changed" if changed else "unchanged")


if __name__ == "__main__":
    main()
