#!/usr/bin/env python3
"""Extract one or more page ranges from a PDF into a new PDF.

Examples:

  python scripts/extract_pdf_pages.py bgbl1-50.pdf --pages 29-30
  python scripts/extract_pdf_pages.py bgbl1-50.pdf --pages 29-30,33-35
  python scripts/extract_pdf_pages.py bgbl1-50.pdf --pages 29-30 --output src/assets/generated/chapter-6.pdf

Page numbers are 1-based when passed on the command line.
"""

from __future__ import annotations

import argparse
import re
import unicodedata
from pathlib import Path
from typing import List, Sequence, Tuple


Range = Tuple[int, int]


def parse_range(part: str) -> Range:
    text = part.strip()
    if not text:
        raise ValueError("empty page range")

    if "-" in text:
        start_text, end_text = text.split("-", 1)
    elif ":" in text:
        start_text, end_text = text.split(":", 1)
    else:
        start_text, end_text = text, text

    start = int(start_text)
    end = int(end_text)

    if start < 1 or end < 1:
        raise ValueError(f"page numbers must be positive: {part!r}")
    if end < start:
        raise ValueError(f"page range end must be >= start: {part!r}")

    return start, end


def parse_ranges(spec: str) -> List[Range]:
    ranges: List[Range] = []
    for raw in spec.split(","):
        raw = raw.strip()
        if raw:
            ranges.append(parse_range(raw))
    if not ranges:
        raise ValueError("no page ranges provided")
    return ranges


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_text = ascii_text.lower()
    ascii_text = re.sub(r"[^a-z0-9]+", "-", ascii_text)
    ascii_text = ascii_text.strip("-")
    return ascii_text or "pages"


def format_range_label(ranges: Sequence[Range]) -> str:
    parts = []
    for start, end in ranges:
        if start == end:
            parts.append(f"p{start:03d}")
        else:
            parts.append(f"p{start:03d}-{end:03d}")
    return "_".join(parts)


def open_source_pdf(pdf_path: Path):
    try:
        import fitz  # type: ignore

        return ("fitz", fitz.open(pdf_path.as_posix()))
    except ImportError:
        try:
            from pypdf import PdfReader  # type: ignore

            return ("pypdf", PdfReader(pdf_path.as_posix()))
        except ImportError as exc:
            raise RuntimeError(
                "Install either pymupdf (fitz) or pypdf to use this script."
            ) from exc


def write_with_fitz(src_doc, ranges: Sequence[Range], output_path: Path) -> None:
    import fitz  # type: ignore

    dst_doc = fitz.open()
    for start, end in ranges:
        dst_doc.insert_pdf(src_doc, from_page=start - 1, to_page=end - 1)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    dst_doc.save(output_path.as_posix(), garbage=4, deflate=True)
    dst_doc.close()


def write_with_pypdf(src_reader, ranges: Sequence[Range], output_path: Path) -> None:
    from pypdf import PdfWriter  # type: ignore

    writer = PdfWriter()
    for start, end in ranges:
        for page_num in range(start - 1, end):
            writer.add_page(src_reader.pages[page_num])

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("wb") as handle:
        writer.write(handle)


def build_output_path(input_pdf: Path, ranges: Sequence[Range], output: Path | None, outdir: Path) -> Path:
    if output is not None:
        return output

    stem = slugify(input_pdf.stem)
    suffix = format_range_label(ranges)
    return outdir / f"{stem}_{suffix}.pdf"


def validate_ranges(ranges: Sequence[Range], page_count: int) -> None:
    for start, end in ranges:
        if end > page_count:
            raise ValueError(
                f"page range {start}-{end} exceeds document length of {page_count} pages"
            )


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Extract one or more page ranges from a PDF into a new PDF."
    )
    parser.add_argument("pdf", type=Path, help="Source PDF file")
    parser.add_argument(
        "--pages",
        required=True,
        help="Page ranges to extract, using 1-based page numbers. Examples: 29-30 or 29-30,33-35",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Explicit output PDF path. If omitted, a name is derived from the input file and page ranges.",
    )
    parser.add_argument(
        "--outdir",
        type=Path,
        default=Path("./pdf-extracts"),
        help="Directory used when --output is not supplied.",
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        help="Optional JSON manifest path to record the exported page ranges.",
    )

    args = parser.parse_args(argv)

    if not args.pdf.exists():
        raise SystemExit(f"PDF not found: {args.pdf}")

    ranges = parse_ranges(args.pages)
    source_type, source_doc = open_source_pdf(args.pdf)

    try:
        page_count = source_doc.page_count if source_type == "fitz" else len(source_doc.pages)
        validate_ranges(ranges, page_count)

        output_path = build_output_path(args.pdf, ranges, args.output, args.outdir)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        if source_type == "fitz":
            write_with_fitz(source_doc, ranges, output_path)
        else:
            write_with_pypdf(source_doc, ranges, output_path)

        print(f"Wrote {output_path} from pages {args.pages}")

        if args.manifest:
            import json

            manifest = {
                "source": str(args.pdf),
                "output": str(output_path),
                "pages": args.pages,
                "ranges": [{"start": start, "end": end} for start, end in ranges],
                "pageCount": page_count,
            }
            args.manifest.parent.mkdir(parents=True, exist_ok=True)
            args.manifest.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
            print(f"Wrote manifest {args.manifest}")
    finally:
        if source_type == "fitz":
            source_doc.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
