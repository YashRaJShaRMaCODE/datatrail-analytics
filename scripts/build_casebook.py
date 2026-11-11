import csv
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
OUTPUT = SITE / "data" / "casebook.json"
REPOSITORY = "https://github.com/YashRaJShaRMaCODE/Software-Internship-Projects-Python"
LEVEL_ORDER = {"Foundational": 0, "Intermediate": 1, "Advanced": 2}


def cell_text(value):
    return "".join(value) if isinstance(value, list) else str(value or "")


def plain_text(value):
    value = re.sub(r"`([^`]+)`", r"\1", value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"\1", value)
    return " ".join(value.split()).strip()


def section(markdown, name):
    match = re.search(rf"^##\s+{re.escape(name)}\s*$([\s\S]*?)(?=^##\s+|\Z)", markdown, re.MULTILINE | re.IGNORECASE)
    return match.group(1).strip() if match else ""


def notebook_dataset(code, folder):
    references = re.findall(r"[\"']([^\"']+\.csv)[\"']", code, re.IGNORECASE)
    files = {path.name.casefold(): path for path in folder.glob("*.csv")}
    selected = next((files[Path(reference.replace("\\", "/")).name.casefold()] for reference in references if Path(reference.replace("\\", "/")).name.casefold() in files), None)
    if selected is None and len(files) == 1:
        selected = next(iter(files.values()))
    if selected is None:
        return {"name": "No bundled CSV matched", "rows": None, "columns": None, "raggedRows": 0}

    with selected.open(encoding="utf-8-sig", errors="replace", newline="") as stream:
        reader = csv.reader(stream)
        header = next(reader, None)
        rows = 0
        ragged = 0
        for row in reader:
            rows += 1
            if len(row) != len(header or []):
                ragged += 1
    return {
        "name": selected.name,
        "rows": rows,
        "columns": len(header or []),
        "raggedRows": ragged,
    }


def build():
    projects = []
    for notebook_path in sorted(ROOT.glob("*/*/*.ipynb")):
        if ".ipynb_checkpoints" in notebook_path.parts:
            continue
        notebook = json.loads(notebook_path.read_text(encoding="utf-8"))
        cells = notebook.get("cells", [])
        markdown = "\n".join(cell_text(cell.get("source", [])) for cell in cells if cell.get("cell_type") == "markdown")
        code = "\n".join(cell_text(cell.get("source", [])) for cell in cells if cell.get("cell_type") == "code")
        title_match = re.search(r"^#\s+(.+)$", markdown, re.MULTILINE)
        title = plain_text(title_match.group(1)) if title_match else notebook_path.stem.replace("_", " ")
        objective = plain_text(section(markdown, "Objective"))
        tools_text = section(markdown, "Tools Used")
        tools = [plain_text(line.lstrip("-• ")) for line in tools_text.splitlines() if line.strip().startswith(("-", "•"))]
        if not tools:
            imports = set(re.findall(r"^\s*(?:import|from)\s+(pandas|numpy|matplotlib|seaborn|plotly|sklearn|nltk)\b", code, re.MULTILINE))
            tool_names = {"sklearn": "Scikit-learn", "nltk": "NLTK", "numpy": "NumPy"}
            tools = sorted({tool_names.get(name, name.title()) for name in imports})
        level = notebook_path.parts[-3]
        dataset = notebook_dataset(code, notebook_path.parent)
        relative_notebook = notebook_path.relative_to(ROOT).as_posix()
        projects.append({
            "slug": notebook_path.parent.name,
            "level": level,
            "title": title,
            "objective": objective,
            "tools": tools,
            "dataset": dataset,
            "notebook": f"{REPOSITORY}/blob/main/{relative_notebook}",
        })

    projects.sort(key=lambda item: (LEVEL_ORDER.get(item["level"], 99), item["title"].casefold()))
    if len(projects) != 9:
        raise ValueError(f"Expected 9 main notebooks, found {len(projects)}")
    return {"projects": projects, "levels": list(LEVEL_ORDER)}


if __name__ == "__main__":
    casebook = build()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(casebook, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(casebook['projects'])} case studies to {OUTPUT.relative_to(ROOT)}.")
