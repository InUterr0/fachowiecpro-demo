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

// ===== ZLECENIA PRZYKŁADOWE (DEMO) =====
// Dane poglądowe pokazujące, jak działa serwis. NIE pochodzą od realnych
// klientów/firm i są wyraźnie oznaczone plakietką „Przykładowe" w UI
// (flaga demo:true). Renderowane tylko po stronie front-endu — nie są
// zapisywane do bazy. Do usunięcia, gdy pojawią się prawdziwe zlecenia.
const _do = (id, jobId, price, start, days, msg) =>
  ({id, jobId, companyId:'demo-'+id, price, start, days, msg, accepted:false, date:start});

const DEMO_JOBS = [
  {id:'demo-1', demo:true, clientId:'demo-cl1', clientName:'Anna K.', title:'Remont łazienki 5 m² w bloku',
   cat:'lazienki', city:'Gdańsk Wrzeszcz', budget:'12 000 – 16 000 zł', area:'5', length:'', deadline:'2026-07-20',
   photos:[], urgent:false, status:'open', acceptedCompany:null, reviewed:false, created:'2026-06-14',
   desc:'Kompleksowy remont małej łazienki w bloku z wielkiej płyty — skucie starych płytek, nowa hydroizolacja, glazura do sufitu, kabina bez brodzika, biały montaż. Proszę o wycenę robocizny, materiały dobiorę z wykonawcą.',
   offers:[ _do('1a','demo-1','13 800 zł','2026-07-05',14,'Kompleksowo, materiały hurtowe w cenie hurtowni. Doświadczenie w blokach na Wrzeszczu.'),
            _do('1b','demo-1','15 200 zł','2026-06-28',12,'Wolny termin od końca czerwca, gwarancja 24 mc na robociznę.'),
            _do('1c','demo-1','12 500 zł','2026-07-15',16,'Solidnie i terminowo, możliwość obejrzenia realizacji.') ]},

  {id:'demo-2', demo:true, clientId:'demo-cl2', clientName:'Marcin P.', title:'Wykończenie mieszkania 48 m² (stan deweloperski)',
   cat:'wykonczenia', city:'Gdynia Chwarzno', budget:'do uzgodnienia', area:'48', length:'', deadline:'2026-09-01',
   photos:[], urgent:false, status:'open', acceptedCompany:null, reviewed:false, created:'2026-06-13',
   desc:'Mieszkanie w nowym budownictwie, stan deweloperski. Zakres: gładzie, malowanie, panele winylowe, płytki w łazience i kuchni, biały montaż, montaż drzwi wewnętrznych. Szukam ekipy „pod klucz".',
   offers:[ _do('2a','demo-2','58 000 zł','2026-07-10',45,'Pełne wykończenie pod klucz, harmonogram tygodniowy, jeden koordynator.'),
            _do('2b','demo-2','52 500 zł','2026-07-20',50,'Wykańczamy mieszkania w Chwarznie i Karwinach, referencje z osiedla.') ]},

  {id:'demo-3', demo:true, clientId:'demo-cl3', clientName:'Joanna M.', title:'Wymiana instalacji wod-kan w mieszkaniu',
   cat:'hydraulika', city:'Sopot', budget:'6 000 – 9 000 zł', area:'', length:'', deadline:'2026-06-30',
   photos:[], urgent:true, status:'open', acceptedCompany:null, reviewed:false, created:'2026-06-12',
   desc:'Stara kamienica w Dolnym Sopocie — wymiana pionów i poziomów wod-kan w mieszkaniu, przeniesienie punktów w łazience i kuchni. Potrzebny doświadczony hydraulik znający stare budownictwo.',
   offers:[ _do('3a','demo-3','7 400 zł','2026-06-25',6,'Specjalizacja w kamienicach, instalacje miedź/PEX, próby ciśnieniowe.'),
            _do('3b','demo-3','8 200 zł','2026-06-23',5,'Szybki termin, faktura VAT, sprzątanie po robocie.') ]},

  {id:'demo-4', demo:true, clientId:'demo-cl4', clientName:'Tomasz W.', title:'Wymiana pokrycia dachu domu jednorodzinnego',
   cat:'dachy', city:'Gdańsk Oliwa', budget:'do uzgodnienia', area:'140', length:'', deadline:'2026-08-15',
   photos:[], urgent:false, status:'open', acceptedCompany:null, reviewed:false, created:'2026-06-11',
   desc:'Dom ok. 140 m² połaci, wymiana starej dachówki na blachodachówkę, nowe obróbki, rynny i częściowo łaty. Proszę o wycenę z materiałem i bez.',
   offers:[ _do('4a','demo-4','46 000 zł','2026-07-25',18,'Z materiałem (blachodachówka modułowa), gwarancja na szczelność.') ]},

  {id:'demo-5', demo:true, clientId:'demo-cl5', clientName:'Katarzyna L.', title:'Zabudowa kuchni na wymiar + montaż',
   cat:'kuchnie', city:'Gdynia Śródmieście', budget:'18 000 – 25 000 zł', area:'', length:'6', deadline:'2026-08-10',
   photos:[], urgent:false, status:'open', acceptedCompany:null, reviewed:false, created:'2026-06-10',
   desc:'Kuchnia w kształcie L, ok. 6 mb zabudowy, fronty lakierowane, blat kompozytowy, montaż AGD do zabudowy. Szukam stolarza/firmy meblowej z projektem 3D.',
   offers:[ _do('5a','demo-5','22 500 zł','2026-07-15',30,'Projekt 3D gratis, fronty lakierowane, okucia Blum.'),
            _do('5b','demo-5','19 900 zł','2026-07-22',35,'Realizacje w Śródmieściu Gdyni, raty 0%.') ]},

  {id:'demo-6', demo:true, clientId:'demo-cl6', clientName:'Paweł S.', title:'Wymiana instalacji elektrycznej w mieszkaniu 60 m²',
   cat:'elektryka', city:'Gdańsk Przymorze', budget:'8 000 – 12 000 zł', area:'60', length:'', deadline:'2026-07-31',
   photos:[], urgent:true, status:'open', acceptedCompany:null, reviewed:false, created:'2026-06-15',
   desc:'Mieszkanie w bloku, stara instalacja aluminiowa — pełna wymiana na miedź, nowa rozdzielnica, więcej punktów, pomiary i protokół. Mieszkanie puste, można zaczynać od zaraz.',
   offers:[]},
];
