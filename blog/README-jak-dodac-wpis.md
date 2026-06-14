# Jak dodać nowy wpis na blog (krok po kroku)

Każdy wpis to osobny plik `.html` w katalogu `blog/` — tak Google indeksuje go najlepiej.

## 1. Skopiuj szablon
Skopiuj `blog/jak-wybrac-ekipe-remontowa-gdansk.html` i nazwij nowy plik **slugiem** opartym na słowie kluczowym, np.:
`blog/ile-kosztuje-remont-lazienki-gdansk.html`
(małe litery, myślniki zamiast spacji, bez polskich znaków w nazwie pliku).

## 2. Podmień w nowym pliku (to jest SEO — zrób dokładnie):
- `<title>` — ~55-60 znaków, na początku główne słowo kluczowe. Wzór: `Słowo kluczowe — dopowiedzenie | FachowiecPRO`
- `<meta name="description">` — ~150 znaków, zachęcająco, z frazą kluczową.
- `<link rel="canonical">` — pełny URL nowego pliku.
- bloki `og:title`, `og:description`, `og:url` — to samo.
- w JSON-LD: `headline`, `description`, `datePublished`, `dateModified`, `mainEntityOfPage`.
- `<h1>` — jeden na stronę, zawiera główną frazę.
- nagłówki `<h2>`/`<h3>` — używaj fraz pobocznych (long-tail).
- treść — pisz dla człowieka: krótkie akapity, listy, konkret. 600-1200 słów.

## 3. Dodaj kafelek na liście
W `blog/index.html` skopiuj blok `<a class="card post-card">...</a>` i podmień tytuł, opis, link, datę.

## 4. Dopisz wpis do sitemap.xml (w katalogu głównym)
Dodaj nowy `<url>` z `loc` = pełny URL wpisu i aktualnym `lastmod`.

## 5. Po publikacji
- W Google Search Console (patrz niżej) zgłoś nowy URL do zaindeksowania.

## Zasady SEO w skrócie
- 1 wpis = 1 główne słowo kluczowe (+ kilka pobocznych w H2/H3).
- Tytuł i pierwszy akapit muszą zawierać frazę.
- Linkuj wewnętrznie: z wpisu do `/#/dodaj` (CTA) i do innych wpisów.
- Treść ma realnie odpowiadać na pytanie, którego ktoś szuka w Google.

## Badanie słów kluczowych — gdzie sprawdzać klikalność
- **Google Search Console** (za darmo, najważniejsze) — pokazuje, na jakie frazy JUŻ wyświetla się Twoja strona, ile klików i jaki CTR. To realne dane z Twojej domeny.
- **Google Keyword Planner** (Google Ads, za darmo) — wolumen wyszukiwań fraz w Polsce/Gdańsku.
- **Podpowiedzi Google** — wpisz frazę w wyszukiwarkę i zobacz autouzupełnianie + sekcję „Podobne pytania" i „Wyszukiwania podobne do".
- **AnswerThePublic / Ubersuggest / Senuto / Ahrefs** — narzędzia do fraz long-tail (część płatna).
- Celuj w frazy **long-tail z intencją** (np. „ile kosztuje remont łazienki w Gdańsku") — mniejsza konkurencja, wyższa klikalność i konwersja niż ogólne „remont".
