# FachowiecPRO — strona leadowa (demo)

Giełda zleceń budowlanych oparta na **renomie wykonawców**: oceny, punkty, ranking, subskrypcje dla firm.

## Uruchomienie
Wystarczy otworzyć `index.html` w przeglądarce, albo:
```
cd "strona leadowa" && python -m http.server 8000
```
i wejść na http://localhost:8000

Dane trzymane są w `localStorage` (klucz `fachowiecpro_db_v1`) — żeby zresetować demo do stanu początkowego, wyczyść localStorage albo wykonaj w konsoli przeglądarki:
```js
localStorage.removeItem('fachowiecpro_db_v1'); location.reload()
```

## Konta demo (hasło: `demo`)
- 👤 klient: `anna@example.com` (ma zlecenia w różnych statusach)
- 🏢 firma, plan Bez limitu: `biuro@budmax.pl`
- 🏢 firma, plan Start (limit 3 ofert, 2 zużyte): `jan@malarz.pl`

## Co działa
- Dodawanie zleceń (16 kategorii: wykończenia, budowa, hydraulika, elektryka, dachy…)
- Składanie ofert przez firmy — **zużywa limit z subskrypcji**
- Akceptacja oferty → realizacja → zakończenie → **wystawienie oceny** (ogólna + 4 kryteria + polecenie)
- System punktów renomy: gwiazdka ×10, polecenie +5, ukończone zlecenie +25, weryfikacja +50
- Poziomy renomy: Nowa → Brązowa → Srebrna → Złota → Diamentowa
- Ranking firm, profile firm z rozbiciem ocen na kryteria
- Plany subskrypcji: Start (0 zł / 3 oferty), Standard (149 zł / 15), PRO (349 zł / 50, wyróżnienie ofert), Bez limitu (699 zł)
- Rejestracja i logowanie (demo), panele klienta i firmy ze statystykami

## Struktura
- `index.html` — szkielet strony (SPA, routing po `#/...`)
- `js/data.js` — dane przykładowe (firmy, zlecenia, opinie, plany, kategorie)
- `js/app.js` — logika: router, renoma, oferty, oceny, subskrypcje
- `css/style.css` — style
