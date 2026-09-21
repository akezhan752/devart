"""Собирает три markdown-документа в один HTML-файл, который открывается двойным кликом.
Источник правды — .md файлы; этот скрипт их только оформляет."""
import html
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = [
    "01_sources_and_assumptions.md",
    "02_AI_Usage_Note.md",
    "03_limitations_and_next_steps.md",
]


def inline(text):
    text = html.escape(text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    return text


def split_row(line):
    return [c.strip() for c in line.strip().strip("|").split("|")]


def convert(md):
    out = []
    lines = md.split("\n")
    i = 0
    in_list = False

    def close_list():
        nonlocal in_list
        if in_list:
            out.append("</ul>")
            in_list = False

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            close_list()
            i += 1
            continue

        if stripped.startswith("---") and set(stripped) == {"-"}:
            close_list()
            out.append("<hr>")
            i += 1
            continue

        m = re.match(r"^(#{1,4})\s+(.*)$", stripped)
        if m:
            close_list()
            lvl = len(m.group(1))
            out.append("<h%d>%s</h%d>" % (lvl, inline(m.group(2)), lvl))
            i += 1
            continue

        if stripped.startswith("|") and i + 1 < len(lines) and re.match(
                r"^\|[\s:|-]+\|$", lines[i + 1].strip()):
            close_list()
            head = split_row(stripped)
            i += 2
            body = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                body.append(split_row(lines[i].strip()))
                i += 1
            out.append("<table><thead><tr>")
            out.extend("<th>%s</th>" % inline(c) for c in head)
            out.append("</tr></thead><tbody>")
            for row in body:
                out.append("<tr>" + "".join("<td>%s</td>" % inline(c) for c in row) + "</tr>")
            out.append("</tbody></table>")
            continue

        if stripped.startswith("> "):
            close_list()
            out.append("<blockquote>%s</blockquote>" % inline(stripped[2:]))
            i += 1
            continue

        if re.match(r"^[-*]\s+", stripped):
            if not in_list:
                out.append("<ul>")
                in_list = True
            item = [re.sub(r"^[-*]\s+", "", stripped)]
            i += 1
            while i < len(lines) and lines[i].strip() and lines[i].startswith(" ") \
                    and not re.match(r"^\s*[-*]\s+", lines[i]):
                item.append(lines[i].strip())
                i += 1
            out.append("<li>%s</li>" % inline(" ".join(item)))
            continue

        buf = [stripped]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(
                r"^(#{1,4}\s|\||>|[-*]\s|---)", lines[i].strip()):
            buf.append(lines[i].strip())
            i += 1
        close_list()
        out.append("<p>%s</p>" % inline(" ".join(buf)))

    close_list()
    return "\n".join(out)


CSS = """
:root { --navy:#16233f; --teal:#1e93ab; --teal-dark:#146f83; --ice:#eaf1f6;
        --text:#1c2733; --muted:#5b6b7b; --border:#d7e3ec; }
* { box-sizing:border-box; }
body { margin:0; background:#f4f7fa; color:var(--text); line-height:1.55;
       font-family:"Segoe UI",-apple-system,Roboto,Helvetica,Arial,sans-serif; }
.page { max-width:900px; margin:0 auto; background:#fff; padding:56px 64px;
        box-shadow:0 1px 3px rgba(22,35,63,.08); }
.cover { background:var(--navy); color:#fff; padding:44px 64px; }
.cover .brand { font-weight:800; letter-spacing:.04em; color:#9fd8e4; font-size:.85rem; }
.cover h1 { margin:10px 0 6px; font-size:1.9rem; }
.cover p { margin:0; color:#b9cbd6; }
nav { background:var(--ice); padding:18px 64px; border-bottom:1px solid var(--border); }
nav a { color:var(--teal-dark); margin-right:22px; font-weight:600; font-size:.92rem; }
h1,h2,h3,h4 { color:var(--navy); line-height:1.25; }
h1 { font-size:1.6rem; margin:0 0 6px; }
h2 { font-size:1.25rem; margin:38px 0 12px; }
h3 { font-size:1.05rem; margin:26px 0 8px; }
p { margin:0 0 12px; }
ul { margin:0 0 14px; padding-left:22px; }
li { margin-bottom:6px; }
code { background:var(--ice); padding:1px 5px; border-radius:4px;
       font-family:"Courier New",monospace; font-size:.9em; }
hr { border:0; border-top:1px solid var(--border); margin:30px 0; }
table { border-collapse:collapse; width:100%; margin:0 0 18px; font-size:.92rem; }
th { background:var(--navy); color:#fff; text-align:left; padding:9px 12px; font-weight:600; }
td { border-bottom:1px solid var(--border); padding:9px 12px; vertical-align:top; }
tr:nth-child(even) td { background:#fafcfd; }
blockquote { margin:0 0 14px; padding:10px 16px; background:var(--ice);
             border-left:3px solid var(--teal); color:var(--muted); }
.doc + .doc { margin-top:16px; border-top:2px solid var(--ice); padding-top:34px; }
@media print { body{background:#fff} .page{box-shadow:none;padding:0} nav{display:none} }
@media (max-width:700px){ .page,.cover,nav{padding-left:22px;padding-right:22px} }
"""


def main():
    parts = []
    links = []
    for n, name in enumerate(DOCS, 1):
        with open(os.path.join(HERE, name), encoding="utf-8") as f:
            md = f.read()
        title = md.strip().split("\n")[0].lstrip("# ").strip()
        links.append('<a href="#doc%d">%s</a>' % (n, html.escape(title)))
        parts.append('<section class="doc" id="doc%d">%s</section>' % (n, convert(md)))

    page = (
        '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        "<title>Devart × KazService — сопроводительные документы</title>"
        "<style>%s</style></head><body>"
        '<div class="cover"><div class="brand">DEVART × KAZSERVICE · CORE TEAM</div>'
        "<h1>Сопроводительные документы</h1>"
        "<p>Направление 3 — AI Content &amp; Digital Product</p></div>"
        "<nav>%s</nav>"
        '<div class="page">%s</div></body></html>'
    ) % (CSS, " ".join(links), "\n".join(parts))

    out = os.path.join(HERE, "documents.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(page)
    print("saved:", out)


if __name__ == "__main__":
    main()
