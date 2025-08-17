from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Iterable, Dict, Any, List, Optional

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from players.models import Player


def _norm(s: Optional[str]) -> str:
    return (s or "").strip()


def _read_csv(path: Path, encoding: str, delimiter: Optional[str]) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    with path.open("r", encoding=encoding, newline="") as f:
        sample = f.read(4096)
        f.seek(0)
        if delimiter is None:
            try:
                sniffed = csv.Sniffer().sniff(sample)
                delim = sniffed.delimiter
            except Exception:
                # default to comma, .tsv → tab
                delim = "\t" if path.suffix.lower() == ".tsv" else ","
        else:
            delim = delimiter

        reader = csv.DictReader(f, delimiter=delim)
        headers = [h.strip().lower() for h in (reader.fieldnames or [])]

        # Accept flexible headers: "name", "nickname" (case-insensitive).
        # If only one column, treat it as name.
        def map_row(raw: Dict[str, str]) -> Dict[str, str]:
            lower = {k.strip().lower(): (v or "").strip() for k, v in raw.items()}
            if "name" in lower:
                name = lower.get("name", "")
                nickname = lower.get("nickname", "")
            else:
                # headerless or unknown headers -> take first column as name, second as nickname if present
                ordered = list(lower.values())
                name = ordered[0] if ordered else ""
                nickname = ordered[1] if len(ordered) > 1 else ""
            return {"name": name, "nickname": nickname}

        for raw in reader:
            rows.append(map_row(raw))
    return rows


def _read_txt(path: Path, encoding: str) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    with path.open("r", encoding=encoding) as f:
        for line in f:
            name = _norm(line)
            if name:
                rows.append({"name": name, "nickname": ""})
    return rows


def _read_json(path: Path, encoding: str) -> List[Dict[str, str]]:
    data = json.loads(path.read_text(encoding=encoding))
    rows: List[Dict[str, str]] = []
    if isinstance(data, list):
        for item in data:
            if isinstance(item, str):
                rows.append({"name": _norm(item), "nickname": ""})
            elif isinstance(item, dict):
                rows.append({
                    "name": _norm(item.get("name")),
                    "nickname": _norm(item.get("nickname")),
                })
    else:
        raise CommandError("JSON must be an array of strings or objects.")
    return rows


class Command(BaseCommand):
    help = "Import players from CSV/TSV/TXT/JSON. Columns: name[,nickname]"

    def add_arguments(self, parser):
        parser.add_argument("file", type=str, help="Path to the input file (.csv/.tsv/.txt/.json)")
        parser.add_argument("--encoding", default="utf-8", help="File encoding (default: utf-8)")
        parser.add_argument("--delimiter", default=None, help="CSV delimiter override (auto-detect by default)")
        parser.add_argument("--dedupe-by", choices=["name", "nickname"], default="name",
                            help="Deduplicate on this field (default: name)")
        parser.add_argument("--update", action="store_true",
                            help="If a matching player exists, update nickname if provided")
        parser.add_argument("--dry-run", action="store_true", help="Parse and show summary without writing")

    def handle(self, *args, **opts):
        path = Path(opts["file"])
        if not path.exists():
            raise CommandError(f"File not found: {path}")

        encoding = opts["encoding"]
        delimiter = opts["delimiter"]
        dedupe_by = opts["dedupe_by"]
        update = bool(opts["update"])
        dry_run = bool(opts["dry_run"])

        ext = path.suffix.lower()
        if ext in (".csv", ".tsv"):
            rows = _read_csv(path, encoding, delimiter)
        elif ext == ".txt":
            rows = _read_txt(path, encoding)
        elif ext == ".json":
            rows = _read_json(path, encoding)
        else:
            raise CommandError("Unsupported file type. Use .csv, .tsv, .txt, or .json")

        # Normalize and validate
        cleaned: List[Dict[str, str]] = []
        for r in rows:
            name = _norm(r.get("name"))
            nickname = _norm(r.get("nickname"))
            if not name:
                self.stderr.write("Skipping row with empty name")
                continue
            if len(name) > 100:
                self.stderr.write(f"Name too long (>100 chars), truncating: {name[:100]}…")
                name = name[:100]
            if nickname and len(nickname) > 50:
                self.stderr.write(f"Nickname too long (>50 chars), truncating: {nickname[:50]}…")
                nickname = nickname[:50]
            cleaned.append({"name": name, "nickname": nickname})

        created = updated = skipped = 0
        existing_seen = set()  # for duplicate rows within the file

        lookups = {"name": lambda v: Player.objects.filter(name__iexact=v).first(),
                   "nickname": lambda v: Player.objects.filter(nickname__iexact=v).first()}

        with transaction.atomic():
            for r in cleaned:
                key = (dedupe_by, r[dedupe_by].lower())
                if key in existing_seen:
                    skipped += 1
                    continue
                existing_seen.add(key)

                existing = lookups[dedupe_by](r[dedupe_by]) if r[dedupe_by] else None

                if existing:
                    if update and r["nickname"] and r["nickname"].lower() != (existing.nickname or "").lower():
                        if not dry_run:
                            existing.nickname = r["nickname"]
                            existing.save(update_fields=["nickname"])
                        updated += 1
                    else:
                        skipped += 1
                else:
                    if not dry_run:
                        Player.objects.create(name=r["name"], nickname=r["nickname"])
                    created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Done. created={created}, updated={updated}, skipped={skipped}, total_input_rows={len(rows)}"
        ))
        if dry_run:
            self.stdout.write(self.style.WARNING("Dry-run only: no database changes were made."))
