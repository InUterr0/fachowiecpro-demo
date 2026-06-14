// ===== Dane startowe (seed) — zapisywane do localStorage przy pierwszym uruchomieniu =====

const CATEGORIES = [
  {id:'wykonczenia', name:'Wykończenia wnętrz', icon:'🛋️', desc:'Gładzie, malowanie, panele, zabudowy GK'},
  {id:'budowa', name:'Duże roboty budowlane', icon:'🏗️', desc:'Budowa domów, fundamenty, mury, stropy'},
  {id:'hydraulika', name:'Hydraulika', icon:'🔧', desc:'Instalacje wod-kan, CO, biały montaż'},
  {id:'elektryka', name:'Elektryka', icon:'⚡', desc:'Instalacje elektryczne, pomiary, smart home'},
  {id:'dachy', name:'Dachy i rynny', icon:'🏠', desc:'Pokrycia dachowe, więźby, obróbki, rynny'},
  {id:'okna-drzwi', name:'Okna i drzwi', icon:'🚪', desc:'Montaż okien, drzwi, bram, rolet'},
  {id:'lazienki', name:'Łazienki i glazura', icon:'🚿', desc:'Remonty łazienek, układanie płytek'},
  {id:'kuchnie', name:'Kuchnie i meble', icon:'🍳', desc:'Meble na wymiar, montaż kuchni, stolarka'},
  {id:'ogrody', name:'Ogrody i bruk', icon:'🌳', desc:'Kostka brukowa, ogrodzenia, zieleń'},
  {id:'ocieplenia', name:'Ocieplenia i elewacje', icon:'🧱', desc:'Termomodernizacja, tynki, elewacje'},
  {id:'klimatyzacja', name:'Klimatyzacja i wentylacja', icon:'❄️', desc:'Montaż klimatyzacji, rekuperacja, pompy ciepła'},
  {id:'fotowoltaika', name:'Fotowoltaika', icon:'☀️', desc:'Instalacje PV, magazyny energii'},
  {id:'podlogi', name:'Podłogi', icon:'🪵', desc:'Parkiety, panele, wylewki, cyklinowanie'},
  {id:'przeprowadzki', name:'Przeprowadzki i transport', icon:'🚚', desc:'Przeprowadzki, wywóz gruzu, transport'},
  {id:'sprzatanie', name:'Sprzątanie pobudowlane', icon:'🧹', desc:'Sprzątanie po remontach, mycie okien'},
  {id:'inne', name:'Pozostałe usługi', icon:'🛠️', desc:'Złota rączka, drobne naprawy, inne'},
];

const PLANS = [
  {id:'start', name:'Demo', price:0, offers:3, features:['3 oferty na start (jednorazowo)','Profil firmy z ocenami','Dostęp do wszystkich zleceń (podgląd)','Po wykorzystaniu: subskrypcja lub zakup pojedynczych ofert']},
  {id:'standard', name:'Standard', price:149, offers:15, features:['15 ofert miesięcznie','Profil firmy z ocenami','Pełne dane kontaktowe klientów','Odznaka "Zweryfikowana firma"','Statystyki skuteczności']},
  {id:'pro', name:'PRO', price:349, offers:50, featured:true, features:['50 ofert miesięcznie','Wyróżnienie ofert (na górze listy)','Priorytetowe powiadomienia o zleceniach','Odznaka "Zweryfikowana firma"','Pełne raporty i analityka','Opiekun konta']},
  {id:'unlimited', name:'Bez limitu', price:699, offers:Infinity, features:['Nielimitowane oferty','Wszystko z planu PRO','Promowanie profilu w rankingu','Dedykowane leady z regionu','API / integracje']},
];

// Poziomy renomy wg punktów
const REP_LEVELS = [
  {name:'Diamentowa', min:2000},
  {name:'Złota', min:1000},
  {name:'Srebrna', min:500},
  {name:'Brązowa', min:150},
  {name:'Nowa', min:0},
];
