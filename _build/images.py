# Готовит иллюстрации страниц: python _build/images.py <папка с исходниками>
# Нужен Pillow (pip install pillow). Исходник ищется как <папка>/<имя> или <папка>/<имя>.png.
# Для каждой картинки пишет img/<имя>.webp для страницы и img/og/<имя>.jpg 1200x630 для соцсетей,
# а затем _src/images.json, который читает сборщик.

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PAGE_WIDTH = 1200
OG_SIZE = (1200, 630)

# имя исходника -> (адрес страницы, alt)
IMAGES = {
    "sc-kategorii": ("/kategorii/", "Светящиеся плитки-экраны с трансляциями: каталог категорий"),
    "sc-gid": ("/gid/", "Открытая книга-гид с иконками вопросов, безопасности и токенов"),
    "sc-tokeny": ("/gid/tokeny/", "Стопки светящихся монет-токенов"),
    "sc-privat": ("/gid/privat/", "Закрытая дверь с замком: приватное шоу"),
    "sc-anonimnost": ("/gid/anonimnost/", "Маска и щит: анонимность зрителя"),
    "sc-telefon": ("/kategorii/s-telefona/", "Смартфон с прямой трансляцией и сообщениями чата"),
    "sc-vr": ("/kategorii/vr/", "VR-шлем для просмотра трансляций"),
    "sc-chat": ("/gid/vebkam-chat/", "Ноутбук с облачками чата и сердечками"),
    "sc-sajty": ("/gid/vebkam-sajty/", "Три экрана вебкам-платформ рядом для сравнения"),
    "sc-model": ("/model/", "Домашнее рабочее место вебкам-модели: камера, свет, ноутбук"),
    "sc-oborudovanie": ("/model/oborudovanie/", "Оборудование для стрима: веб-камера, кольцевая лампа, микрофон"),
    "sc-bezopasnost": ("/model/bezopasnost/", "Щит с замком над картой мира: защита и блокировка регионов"),
    "sc-vyplaty": ("/model/vyplaty/", "Кошелёк, календарь и график: выплаты"),
    "sc-studiya": ("/model/studiya-ili-samostoyatelno/", "Развилка: студия или работа из дома"),
    "sc-partner": ("/partner/", "Сеть связанных сайтов и растущий график: партнёрская программа"),
    "sc-github": ("/partner/sajt-na-github/", "Окно браузера с макетом сайта и кодом"),
}


def find_source(src_dir: Path, name: str) -> Path | None:
    for candidate in (src_dir / name, src_dir / f"{name}.png", src_dir / f"{name}.webp", src_dir / f"{name}.jpg"):
        if candidate.is_file():
            return candidate
    return None


def main() -> None:
    src_dir = Path(sys.argv[1])
    out_dir = ROOT / "img"
    (out_dir / "og").mkdir(parents=True, exist_ok=True)
    manifest_path = ROOT / "_src" / "images.json"
    manifest = json.loads(manifest_path.read_text("utf-8")) if manifest_path.exists() else {}

    for name, (url, alt) in IMAGES.items():
        src = find_source(src_dir, name)
        if not src:
            continue
        img = Image.open(src).convert("RGB")

        page = img.resize((PAGE_WIDTH, round(img.height * PAGE_WIDTH / img.width)), Image.LANCZOS)
        page.save(out_dir / f"{name}.webp", "WEBP", quality=80, method=6)

        # обложка: заполняем 1200x630 и обрезаем по центру
        scale = max(OG_SIZE[0] / img.width, OG_SIZE[1] / img.height)
        cover = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
        left, top = (cover.width - OG_SIZE[0]) // 2, (cover.height - OG_SIZE[1]) // 2
        cover.crop((left, top, left + OG_SIZE[0], top + OG_SIZE[1])).save(out_dir / "og" / f"{name}.jpg", "JPEG", quality=85, optimize=True, progressive=True)

        manifest[url] = {"src": f"/img/{name}.webp", "og": f"/img/og/{name}.jpg", "w": page.width, "h": page.height, "alt": alt}
        print(f"{name}: {url}")

    manifest_path.write_text(json.dumps(dict(sorted(manifest.items())), ensure_ascii=False, indent=2) + "\n", "utf-8")


if __name__ == "__main__":
    main()
