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

const SEED_COMPANIES = [
  {id:'c1', name:'BudMax Construction', city:'Warszawa', cats:['budowa','ocieplenia','dachy'], desc:'Generalny wykonawca z 15-letnim doświadczeniem. Budowa domów jednorodzinnych pod klucz, termomodernizacje, konstrukcje żelbetowe. Własny park maszynowy i stała ekipa 24 pracowników.', plan:'unlimited', verified:true, joined:'2023-02-10', offersUsed:12, password:'demo', email:'biuro@budmax.pl'},
  {id:'c2', name:'Hydro-Tech Kowalski', city:'Kraków', cats:['hydraulika','klimatyzacja'], desc:'Instalacje wod-kan, centralne ogrzewanie, pompy ciepła. Autoryzowany instalator 3 producentów. Szybkie terminy, gwarancja 5 lat na instalacje.', plan:'pro', verified:true, joined:'2023-06-01', offersUsed:31, password:'demo', email:'kontakt@hydrotech.pl'},
  {id:'c3', name:'ElektroMistrz Nowak', city:'Warszawa', cats:['elektryka','fotowoltaika'], desc:'Uprawnienia SEP do 15kV. Instalacje elektryczne w domach i mieszkaniach, smart home, fotowoltaika z magazynami energii. Pomiary i protokoły.', plan:'pro', verified:true, joined:'2024-01-15', offersUsed:18, password:'demo', email:'nowak@elektromistrz.pl'},
  {id:'c4', name:'Perfekt Wykończenia', city:'Wrocław', cats:['wykonczenia','lazienki','podlogi'], desc:'Kompleksowe wykończenia mieszkań deweloperskich pod klucz. Gładzie bezpyłowe, łazienki premium, zabudowy GK. Portfolio 200+ mieszkań.', plan:'standard', verified:true, joined:'2024-03-20', offersUsed:9, password:'demo', email:'biuro@perfekt.pl'},
  {id:'c5', name:'Jan Malarz Usługi', city:'Poznań', cats:['wykonczenia'], desc:'Malowanie, tapetowanie, drobne remonty. Działalność jednoosobowa — solidnie i terminowo, faktura VAT.', plan:'start', verified:false, joined:'2025-09-12', offersUsed:2, password:'demo', email:'jan@malarz.pl'},
  {id:'c6', name:'GreenGarden Bruk i Ogrody', city:'Gdańsk', cats:['ogrody'], desc:'Układanie kostki brukowej, ogrodzenia, projektowanie i zakładanie ogrodów, systemy nawadniania. Realizacje od 50 do 5000 m².', plan:'standard', verified:true, joined:'2024-05-08', offersUsed:7, password:'demo', email:'biuro@greengarden.pl'},
  {id:'c7', name:'DachPol Pokrycia', city:'Łódź', cats:['dachy','ocieplenia'], desc:'Dachy ceramiczne, blachodachówka, papa termozgrzewalna. Więźby dachowe i obróbki blacharskie. 20 lat na rynku.', plan:'pro', verified:true, joined:'2023-04-11', offersUsed:22, password:'demo', email:'dachpol@dachpol.pl'},
  {id:'c8', name:'OknoPlus Montaż', city:'Katowice', cats:['okna-drzwi'], desc:'Sprzedaż i montaż okien PCV/ALU, drzwi zewnętrznych i bram garażowych. Ciepły montaż w standardzie.', plan:'standard', verified:true, joined:'2024-08-30', offersUsed:5, password:'demo', email:'biuro@oknoplus.pl'},
  {id:'c9', name:'Klima-Serwis 24', city:'Warszawa', cats:['klimatyzacja'], desc:'Montaż i serwis klimatyzacji. Certyfikat F-gazy. Montaż w 7 dni od zamówienia.', plan:'start', verified:false, joined:'2025-11-02', offersUsed:1, password:'demo', email:'serwis@klima24.pl'},
  {id:'c10', name:'MebloDom Stolarstwo', city:'Kraków', cats:['kuchnie','wykonczenia'], desc:'Meble na wymiar: kuchnie, szafy, zabudowy. Własna stolarnia, projekt 3D gratis.', plan:'standard', verified:true, joined:'2024-02-14', offersUsed:11, password:'demo', email:'biuro@meblodom.pl'},
];

const SEED_CLIENTS = [
  {id:'u1', name:'Anna Wiśniewska', city:'Warszawa', password:'demo', email:'anna@example.com'},
  {id:'u2', name:'Piotr Zieliński', city:'Kraków', password:'demo', email:'piotr@example.com'},
  {id:'u3', name:'Marta Kaczmarek', city:'Wrocław', password:'demo', email:'marta@example.com'},
  {id:'u4', name:'Tomasz Lewandowski', city:'Gdańsk', password:'demo', email:'tomasz@example.com'},
];

const SEED_JOBS = [
  {id:'j1', title:'Remont łazienki 6 m² — kompleksowo', cat:'lazienki', city:'Warszawa', clientId:'u1', budget:'25 000 – 35 000 zł', desc:'Do remontu łazienka w bloku z lat 90. Skucie starych płytek, wymiana instalacji wod-kan, hydroizolacja, ułożenie płytek (gres 60x60 + mozaika), biały montaż, podwieszany sufit z oświetleniem LED. Materiały wykończeniowe kupione, instalacyjne po stronie wykonawcy.', status:'open', created:'2026-06-08', urgent:false, offers:[
    {companyId:'c4', price:'29 500 zł', days:21, msg:'Dzień dobry, robimy ok. 40 łazienek rocznie. W cenie pełen zakres + utylizacja gruzu. Termin rozpoczęcia: 2 tygodnie. Zapraszam do portfolio na profilu.', date:'2026-06-09', accepted:false},
    {companyId:'c2', price:'31 000 zł', days:18, msg:'Witam, wykonamy remont z naciskiem na instalacje — pełna wymiana pionów w lokalu, gwarancja 5 lat. Możliwy start od zaraz.', date:'2026-06-09', accepted:false},
  ]},
  {id:'j2', title:'Budowa domu jednorodzinnego 140 m² — stan surowy zamknięty', cat:'budowa', city:'Konstancin-Jeziorna', clientId:'u2', budget:'450 000 – 550 000 zł', desc:'Posiadam projekt i pozwolenie na budowę. Dom parterowy z poddaszem użytkowym, ściany z silikatu, dach dwuspadowy dachówka ceramiczna. Szukam generalnego wykonawcy do stanu surowego zamkniętego z oknami. Działka uzbrojona, dojazd dobry.', status:'open', created:'2026-06-05', urgent:false, offers:[
    {companyId:'c1', price:'498 000 zł', days:160, msg:'Dzień dobry, budujemy 8-10 domów rocznie w tej technologii. Harmonogram i kosztorys szczegółowy po wizji lokalnej. Umowa z karami za opóźnienia po obu stronach.', date:'2026-06-06', accepted:false},
  ]},
  {id:'j3', title:'Wymiana instalacji elektrycznej w mieszkaniu 54 m²', cat:'elektryka', city:'Warszawa', clientId:'u1', budget:'8 000 – 12 000 zł', desc:'Mieszkanie w kamienicy, stara instalacja aluminiowa. Pełna wymiana na miedź, nowa rozdzielnica, ok. 40 punktów. Bruzdy i zaprawianie po stronie wykonawcy. Potrzebny protokół pomiarów na koniec.', status:'in_progress', created:'2026-05-20', urgent:false, acceptedCompany:'c3', offers:[
    {companyId:'c3', price:'10 400 zł', days:8, msg:'Witam, specjalizujemy się w kamienicach. W cenie pomiary i protokół, materiał Hager/NKT. Start za tydzień.', date:'2026-05-21', accepted:true},
  ]},
  {id:'j4', title:'Klimatyzacja do 3 pokoi — multisplit', cat:'klimatyzacja', city:'Warszawa', clientId:'u4', budget:'15 000 – 20 000 zł', desc:'Mieszkanie 75 m² na ostatnim piętrze, bardzo się nagrzewa. Potrzebny multisplit 3x wewnętrzna (2x sypialnia, salon). Preferowany Daikin lub Mitsubishi. Zgoda wspólnoty jest.', status:'open', created:'2026-06-10', urgent:true, offers:[
    {companyId:'c2', price:'18 200 zł', days:5, msg:'Daikin 3MXM68 + 3x Perfera. Montaż 2 dni, w cenie przeglądy przez 2 lata.', date:'2026-06-10', accepted:false},
    {companyId:'c9', price:'16 500 zł', days:7, msg:'Witam, proponuję Mitsubishi MXZ-3F68VF. Jesteśmy małą firmą, ale działamy szybko — termin montażu do 7 dni.', date:'2026-06-11', accepted:false},
  ]},
  {id:'j5', title:'Ułożenie kostki brukowej — podjazd i ścieżki, 120 m²', cat:'ogrody', city:'Gdańsk', clientId:'u4', budget:'30 000 – 40 000 zł', desc:'Nowy dom, teren wyrównany. Podjazd dla 2 aut + ścieżki wokół domu. Kostka bezfazowa szara/grafit, obrzeża, odwodnienie liniowe przy garażu. Materiał po stronie wykonawcy.', status:'open', created:'2026-06-07', urgent:false, offers:[
    {companyId:'c6', price:'36 800 zł', days:12, msg:'Dzień dobry, w cenie korytowanie, podbudowa 25 cm zagęszczana warstwowo, kostka Polbruk Ideo. Gwarancja 5 lat na zapadnięcia.', date:'2026-06-08', accepted:false},
  ]},
  {id:'j6', title:'Malowanie mieszkania 68 m² po remoncie', cat:'wykonczenia', city:'Poznań', clientId:'u3', budget:'4 000 – 6 000 zł', desc:'3 pokoje + kuchnia + przedpokój. Ściany po gładziach, do pomalowania 2x farbą ceramiczną (farba kupiona). Sufit biały, ściany kolory. Termin: do końca czerwca.', status:'open', created:'2026-06-11', urgent:true, offers:[]},
  {id:'j7', title:'Wymiana pokrycia dachu 180 m² — blachodachówka', cat:'dachy', city:'Łódź', clientId:'u2', budget:'60 000 – 80 000 zł', desc:'Dom z lat 80, eternit do utylizacji (firma z uprawnieniami!). Nowe łaty, membrana, blachodachówka modułowa, obróbki, rynny stalowe. Dach dwuspadowy, kąt 35°.', status:'completed', created:'2026-03-02', urgent:false, acceptedCompany:'c7', reviewed:true, offers:[
    {companyId:'c7', price:'72 000 zł', days:14, msg:'Posiadamy uprawnienia do utylizacji azbestu. W cenie pełen zakres z rynnami.', date:'2026-03-03', accepted:true},
  ]},
  {id:'j8', title:'Kuchnia na wymiar 9 mb zabudowy', cat:'kuchnie', city:'Kraków', clientId:'u2', budget:'35 000 – 45 000 zł', desc:'Kuchnia w nowym mieszkaniu, kształt L + wyspa. Fronty lakierowane mat, blat kompaktowy, sprzęt do zabudowy (kupiony). Potrzebny projekt, wykonanie i montaż.', status:'completed', created:'2026-02-10', urgent:false, acceptedCompany:'c10', reviewed:true, offers:[
    {companyId:'c10', price:'41 500 zł', days:45, msg:'Zapraszam do naszego showroomu, projekt 3D gratis. Fronty lakierujemy we własnej lakierni.', date:'2026-02-11', accepted:true},
  ]},
  {id:'j9', title:'Ocieplenie domu 160 m² elewacji — styropian 20 cm', cat:'ocieplenia', city:'Warszawa', clientId:'u1', budget:'55 000 – 70 000 zł', desc:'Dom piętrowy z lat 90. Styropian grafitowy 20 cm, tynk silikonowy baranek 1.5 mm. Parapety zewnętrzne i podbitka w zakresie. Czyste Powietrze — potrzebne dokumenty do dotacji.', status:'open', created:'2026-06-09', urgent:false, offers:[
    {companyId:'c1', price:'64 000 zł', days:30, msg:'Pomagamy w formalnościach Czyste Powietrze. System Ceresit, gwarancja 5 lat.', date:'2026-06-10', accepted:false},
    {companyId:'c7', price:'61 500 zł', days:35, msg:'Wykonujemy ocieplenia od 12 lat, system Bolix. Rusztowania własne, start od lipca.', date:'2026-06-10', accepted:false},
  ]},
  {id:'j10', title:'Montaż 8 okien PCV w domu jednorodzinnym', cat:'okna-drzwi', city:'Katowice', clientId:'u3', budget:'25 000 – 32 000 zł', desc:'Wymiana starych okien drewnianych na PCV 3-szybowe, 8 sztuk różnych wymiarów + drzwi balkonowe. Ciepły montaż, demontaż i utylizacja starych. Parapety wewnętrzne konglomerat.', status:'completed', created:'2026-04-01', urgent:false, acceptedCompany:'c8', reviewed:true, offers:[
    {companyId:'c8', price:'29 800 zł', days:21, msg:'Okna Veka Softline 82, pomiar gratis w tym tygodniu. Ciepły montaż w standardzie.', date:'2026-04-02', accepted:true},
  ]},
  {id:'j11', title:'Cyklinowanie i lakierowanie parkietu 60 m²', cat:'podlogi', city:'Wrocław', clientId:'u3', budget:'5 000 – 7 500 zł', desc:'Parkiet dębowy 25-letni, miejscami przetarcia. Cyklinowanie bezpyłowe, 3x lakier półmat, listwy przypodłogowe nowe dębowe. Mieszkanie puste.', status:'open', created:'2026-06-11', urgent:false, offers:[]},
  {id:'j12', title:'Fotowoltaika 9,9 kWp z magazynem energii', cat:'fotowoltaika', city:'Piaseczno', clientId:'u4', budget:'55 000 – 65 000 zł', desc:'Dach dwuspadowy południowy, blachodachówka. Panele min. 440 W, falownik hybrydowy, magazyn ok. 10 kWh. Wniosek o dotację Mój Prąd po stronie wykonawcy.', status:'open', created:'2026-06-06', urgent:false, offers:[
    {companyId:'c3', price:'59 900 zł', days:14, msg:'Panele Jinko 445W, falownik Deye, magazyn 10,2 kWh. Kompleksowo z dotacją i zgłoszeniem do OSD.', date:'2026-06-07', accepted:false},
  ]},
];

const SEED_REVIEWS = [
  // recenzje historyczne budujące renomę firm
  {id:'r1', companyId:'c7', jobId:'j7', clientId:'u2', clientName:'Piotr Zieliński', date:'2026-03-20', stars:5, crit:{jakosc:5, terminowosc:5, kontakt:5, cena:4}, text:'Dach zrobiony wzorowo, ekipa kulturalna, posprzątali po sobie. Eternit zutylizowany z dokumentami. Polecam w 100%.', recommend:true},
  {id:'r2', companyId:'c10', jobId:'j8', clientId:'u2', clientName:'Piotr Zieliński', date:'2026-04-05', stars:5, crit:{jakosc:5, terminowosc:4, kontakt:5, cena:4}, text:'Kuchnia wygląda lepiej niż na wizualizacji. Tydzień opóźnienia w montażu, ale uprzedzili z wyprzedzeniem.', recommend:true},
  {id:'r3', companyId:'c8', jobId:'j10', clientId:'u3', clientName:'Marta Kaczmarek', date:'2026-04-28', stars:4, crit:{jakosc:4, terminowosc:5, kontakt:4, cena:4}, text:'Sprawny montaż w 2 dni, drobne poprawki przy jednym parapecie wykonane od ręki. Solidna firma.', recommend:true},
  {id:'r4', companyId:'c1', jobId:null, clientId:'u3', clientName:'Marta Kaczmarek', date:'2025-10-15', stars:5, crit:{jakosc:5, terminowosc:5, kontakt:4, cena:4}, text:'Budowali nam dom do stanu deweloperskiego. Budowa prowadzona bardzo profesjonalnie, kierownik zawsze dostępny.', recommend:true},
  {id:'r5', companyId:'c1', jobId:null, clientId:'u4', clientName:'Tomasz Lewandowski', date:'2025-06-20', stars:5, crit:{jakosc:5, terminowosc:4, kontakt:5, cena:3}, text:'Nie najtańsi, ale jakość robót bardzo wysoka. Żadnych ukrytych kosztów, wszystko w kosztorysie.', recommend:true},
  {id:'r6', companyId:'c1', jobId:null, clientId:'u1', clientName:'Anna Wiśniewska', date:'2024-11-02', stars:4, crit:{jakosc:5, terminowosc:3, kontakt:4, cena:4}, text:'Ocieplenie domu wykonane bardzo dobrze, ale termin przesunął się o 3 tygodnie przez pogodę i inne budowy.', recommend:true},
  {id:'r7', companyId:'c2', jobId:null, clientId:'u1', clientName:'Anna Wiśniewska', date:'2025-12-12', stars:5, crit:{jakosc:5, terminowosc:5, kontakt:5, cena:5}, text:'Pompa ciepła zamontowana w 3 dni, wszystko wyjaśnione, aplikacja skonfigurowana. Mistrzostwo.', recommend:true},
  {id:'r8', companyId:'c2', jobId:null, clientId:'u2', clientName:'Piotr Zieliński', date:'2025-08-03', stars:5, crit:{jakosc:5, terminowosc:5, kontakt:4, cena:4}, text:'Wymiana całej instalacji CO w domu. Czysto, szybko, działa bez zarzutu drugi sezon.', recommend:true},
  {id:'r9', companyId:'c2', jobId:null, clientId:'u4', clientName:'Tomasz Lewandowski', date:'2024-09-18', stars:4, crit:{jakosc:4, terminowosc:5, kontakt:4, cena:4}, text:'Klimatyzacja działa dobrze, drobny problem ze skroplinami usunięty na gwarancji bez dyskusji.', recommend:true},
  {id:'r10', companyId:'c3', jobId:null, clientId:'u3', clientName:'Marta Kaczmarek', date:'2025-11-25', stars:5, crit:{jakosc:5, terminowosc:5, kontakt:5, cena:4}, text:'Fotowoltaika 10 kWp — od umowy do uruchomienia 3 tygodnie. Dokumentacja i dotacja załatwione za nas.', recommend:true},
  {id:'r11', companyId:'c3', jobId:null, clientId:'u2', clientName:'Piotr Zieliński', date:'2025-05-30', stars:5, crit:{jakosc:5, terminowosc:4, kontakt:5, cena:5}, text:'Smart home w całym mieszkaniu. Pan Nowak doradził tańsze rozwiązania zamiast wciskać najdroższe. Szacunek.', recommend:true},
  {id:'r12', companyId:'c4', jobId:null, clientId:'u1', clientName:'Anna Wiśniewska', date:'2025-09-09', stars:5, crit:{jakosc:5, terminowosc:5, kontakt:4, cena:4}, text:'Wykończenie mieszkania deweloperskiego pod klucz w 7 tygodni. Gładzie idealne, płytki równiutko.', recommend:true},
  {id:'r13', companyId:'c4', jobId:null, clientId:'u4', clientName:'Tomasz Lewandowski', date:'2025-04-14', stars:4, crit:{jakosc:5, terminowosc:4, kontakt:3, cena:4}, text:'Jakość prac super, ale czasem trudno było się dodzwonić do biura. Efekt końcowy bardzo dobry.', recommend:true},
  {id:'r14', companyId:'c6', jobId:null, clientId:'u2', clientName:'Piotr Zieliński', date:'2025-07-22', stars:5, crit:{jakosc:5, terminowosc:5, kontakt:5, cena:4}, text:'Podjazd + taras z kostki, 90 m². Równo, estetycznie, odwodnienie przemyślane. Po roku zero zapadnięć.', recommend:true},
  {id:'r15', companyId:'c6', jobId:null, clientId:'u3', clientName:'Marta Kaczmarek', date:'2024-10-30', stars:4, crit:{jakosc:4, terminowosc:4, kontakt:5, cena:5}, text:'Ogród zaprojektowany i założony od zera. Część roślin się nie przyjęła, wymienili wiosną na gwarancji.', recommend:true},
  {id:'r16', companyId:'c7', jobId:null, clientId:'u1', clientName:'Anna Wiśniewska', date:'2025-03-17', stars:5, crit:{jakosc:5, terminowosc:5, kontakt:4, cena:4}, text:'Nowy dach z dachówki ceramicznej. Ekipa zgrana, dach skończony przed terminem.', recommend:true},
  {id:'r17', companyId:'c7', jobId:null, clientId:'u4', clientName:'Tomasz Lewandowski', date:'2024-08-09', stars:4, crit:{jakosc:4, terminowosc:4, kontakt:4, cena:5}, text:'Remont dachu garażu — papa termozgrzewalna. Dobra cena, solidnie.', recommend:true},
  {id:'r18', companyId:'c8', jobId:null, clientId:'u1', clientName:'Anna Wiśniewska', date:'2025-02-11', stars:5, crit:{jakosc:5, terminowosc:5, kontakt:5, cena:4}, text:'Okna w całym domu wymienione zimą (!) sprawnie i bez bałaganu. Czuć różnicę w rachunkach.', recommend:true},
  {id:'r19', companyId:'c10', jobId:null, clientId:'u3', clientName:'Marta Kaczmarek', date:'2025-06-05', stars:5, crit:{jakosc:5, terminowosc:5, kontakt:5, cena:4}, text:'Szafy i zabudowa przedpokoju. Pomiar, projekt, montaż — wszystko punktualnie i milimetrowo.', recommend:true},
  {id:'r20', companyId:'c10', jobId:null, clientId:'u1', clientName:'Anna Wiśniewska', date:'2024-12-19', stars:4, crit:{jakosc:4, terminowosc:4, kontakt:5, cena:4}, text:'Kuchnia ładna, jedna szuflada do regulacji po miesiącu — przyjechali następnego dnia.', recommend:true},
  {id:'r21', companyId:'c5', jobId:null, clientId:'u3', clientName:'Marta Kaczmarek', date:'2026-01-20', stars:5, crit:{jakosc:5, terminowosc:5, kontakt:5, cena:5}, text:'Pan Jan pomalował mieszkanie 3-pokojowe w 4 dni. Czysto, równo, tanio. Gorąco polecam.', recommend:true},
  {id:'r22', companyId:'c5', jobId:null, clientId:'u4', clientName:'Tomasz Lewandowski', date:'2026-04-02', stars:4, crit:{jakosc:4, terminowosc:5, kontakt:4, cena:5}, text:'Malowanie klatki schodowej. Szybko i sprawnie, drobne zacieki poprawione od ręki.', recommend:true},
  {id:'r23', companyId:'c9', jobId:null, clientId:'u2', clientName:'Piotr Zieliński', date:'2026-03-08', stars:4, crit:{jakosc:4, terminowosc:5, kontakt:4, cena:5}, text:'Klimatyzacja zamontowana w 5 dni od telefonu. Młoda firma, ale widać, że się starają.', recommend:true},
];
