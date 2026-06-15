// ===================== WĄTKI PRZYKŁADOWE (DEMO) =====================
// Renderowane po stronie frontu, oznaczone plakietką „Przykładowy".
// Czysto poglądowe — pokazują, jak żyje forum, zanim narośnie realny ruch.
// Realne wątki użytkowników (z Supabase) wyświetlają się obok i ponad nimi.

const DEMO_FORUM = [
  // --- remonty-wykonczenia ---
  {id:'demo-r1', category:'remonty-wykonczenia', author_name:'Kasia', author_type:'client', pinned:true,
   title:'Jak zaplanować remont mieszkania pod klucz — od czego zacząć?',
   body:'Kupiliśmy mieszkanie w stanie deweloperskim na Przymorzu. Chcemy zrobić wszystko jednym ciągiem. W jakiej kolejności brać się za prace, żeby ekipy sobie nie wchodziły w drogę? Najbardziej boję się o terminy.',
   created:'2026-06-10T08:30:00Z', comments:[
     {author_name:'Remont-Bud Gdańsk', author_type:'company', body:'Standard: instalacje (elektryka, hydraulika) → tynki/gładzie → wylewki → biały montaż i glazura → podłogi → malowanie → montaż drzwi i mebli. Kluczowe, żeby przed instalacjami mieć gotowy projekt rozmieszczenia gniazdek i punktów wodnych — przeróbki później są najdroższe.', created:'2026-06-10T10:15:00Z'},
     {author_name:'Marek', author_type:'client', body:'Z doświadczenia: zarezerwujcie 15-20% budżetu na niespodzianki. U nas wyszły krzywe ściany i trzeba było więcej gładzi.', created:'2026-06-11T07:40:00Z'},
   ]},
  {id:'demo-r2', category:'remonty-wykonczenia', author_name:'Tomek', author_type:'client', pinned:false,
   title:'Gładź czy tynk gipsowy na ściany w salonie?',
   body:'Ekipa proponuje tynk gipsowy maszynowy zamiast tradycyjnej gładzi. Twierdzą, że szybciej i równo. Ktoś miał i poleca?',
   created:'2026-06-12T12:00:00Z', comments:[
     {author_name:'Glazura&Tynk Trójmiasto', author_type:'company', body:'Tynk gipsowy maszynowy daje gładką powierzchnię od razu i jest tańszy w robociźnie na większych metrażach. Pod malowanie zwykle wystarczy. Pod bardzo gładkie wykończenie (światło boczne, ciemne kolory) i tak warto przejść cienką gładzią szpachlową.', created:'2026-06-12T14:30:00Z'},
   ]},

  // --- lazienki-hydraulika ---
  {id:'demo-l1', category:'lazienki-hydraulika', author_name:'Ania', author_type:'client', pinned:false,
   title:'Pęka fuga w nowej łazience po 3 miesiącach — co poszło nie tak?',
   body:'Łazienka robiona pół roku temu, a w kabinie zaczęła pękać i kruszyć się fuga przy brodziku. Czy to wina materiału, czy wykonania? Reklamować u wykonawcy?',
   created:'2026-06-09T16:20:00Z', comments:[
     {author_name:'Hydro-Fix Gdynia', author_type:'company', body:'Przy brodziku i narożnikach NIE powinno być fugi cementowej, tylko silikon sanitarny — to miejsca pracujące. Jeśli dali sztywną fugę, pęknie zawsze. To błąd wykonawczy, jak najbardziej do reklamacji w ramach gwarancji.', created:'2026-06-09T18:05:00Z'},
     {author_name:'Paweł', author_type:'client', body:'Dokładnie to samo miałem. Wykonawca poprawił silikonem w gwarancji, od roku trzyma.', created:'2026-06-10T09:10:00Z'},
   ]},
  {id:'demo-l2', category:'lazienki-hydraulika', author_name:'Grzegorz', author_type:'client', pinned:false,
   title:'Ile kosztuje przeniesienie punktu wodnego w łazience?',
   body:'Chcę przesunąć umywalkę o ok. 1,5 m. Stara kamienica we Wrzeszczu. Jakieś orientacyjne ceny zanim zacznę zbierać oferty?',
   created:'2026-06-13T10:45:00Z', comments:[
     {author_name:'Hydro-Fix Gdynia', author_type:'company', body:'Przeniesienie punktu wod-kan to orientacyjnie 160-360 zł za punkt robocizny, ale w starej kamienicy dochodzi kucie, nowe rury i odtworzenie ściany — realnie zaplanuj więcej. Najlepiej, żeby ktoś obejrzał, bo dużo zależy od dostępu do pionu.', created:'2026-06-13T13:00:00Z'},
   ]},

  // --- elektryka-instalacje ---
  {id:'demo-e1', category:'elektryka-instalacje', author_name:'Robert', author_type:'client', pinned:false,
   title:'Wymiana instalacji elektrycznej w mieszkaniu 55 m² — koszt i czas',
   body:'Mieszkanie z lat 80., aluminiowe przewody. Elektryk mówi, że trzeba wymienić całość. Ile to mniej więcej kosztuje i na ile dni odciąć prąd?',
   created:'2026-06-11T11:30:00Z', comments:[
     {author_name:'ElektroPro Gdańsk', author_type:'company', body:'Aluminium do wymiany bez dyskusji — to kwestia bezpieczeństwa. Przy 55 m² liczcie kilka dni kucia bruzd + układanie + biały montaż. Koszt mocno zależy od liczby punktów; warto z góry rozplanować gniazdka, bo dokładanie później to kolejne kucie.', created:'2026-06-11T15:20:00Z'},
   ]},

  // --- dachy-okna-elewacje ---
  {id:'demo-d1', category:'dachy-okna-elewacje', author_name:'Zofia', author_type:'client', pinned:false,
   title:'Dachówka ceramiczna czy blachodachówka na dom w Sopocie?',
   body:'Budujemy dom pod Sopotem, blisko morza. Słyszałam, że blacha przy morzu szybciej koroduje. Co wybrać, żeby nie żałować za 10 lat?',
   created:'2026-06-08T09:00:00Z', comments:[
     {author_name:'Dach-Mistrz Trójmiasto', author_type:'company', body:'Przy morzu kluczowa jest jakość powłoki. Dachówka ceramiczna jest droższa i cięższa (potrzeba mocniejszej więźby), ale praktycznie wieczna i odporna na sól. Jeśli budżet pozwala i konstrukcja udźwignie — ceramika. Z blach wybierajcie tylko te z dobrą powłoką i gwarancją antykorozyjną.', created:'2026-06-08T12:40:00Z'},
     {author_name:'Krzysztof', author_type:'client', body:'Mam ceramikę 12 lat w Gdyni Orłowo, zero problemów. Sąsiad tania blacha — już rdzewieją zarysowania.', created:'2026-06-09T08:15:00Z'},
   ]},

  // --- koszty-wyceny ---
  {id:'demo-k1', category:'koszty-wyceny', author_name:'Natalia', author_type:'client', pinned:true,
   title:'Jak porównywać oferty wykonawców, żeby nie dać się naciągnąć?',
   body:'Mam 3 oferty na remont łazienki i różnią się prawie dwukrotnie. Najtańsza kusi, ale boję się. Na co patrzeć poza ceną?',
   created:'2026-06-12T08:00:00Z', comments:[
     {author_name:'Remont-Bud Gdańsk', author_type:'company', body:'Porównujcie ZAKRES, nie kwotę. Najtańsza oferta często nie zawiera materiałów, wywozu gruzu, hydroizolacji albo „drobnych" prac, które potem są płatne ekstra. Proście o kosztorys pozycja po pozycji i pytajcie o gwarancję. Skrajnie niska cena = albo brak doświadczenia, albo dopłaty w trakcie.', created:'2026-06-12T09:30:00Z'},
     {author_name:'Ewa', author_type:'client', body:'Dodam: sprawdźcie oceny i poproście o adres ostatniej realizacji do obejrzenia. Uczciwy wykonawca nie ma z tym problemu.', created:'2026-06-12T17:50:00Z'},
   ]},
  {id:'demo-k2', category:'koszty-wyceny', author_name:'Michał', author_type:'client', pinned:false,
   title:'Czyste Powietrze / Czyste Mieszkanie — da się jeszcze załapać na dotację?',
   body:'Wymieniam okna i planuję pompę ciepła. Ktoś przechodził przez wniosek o dofinansowanie w 2026? Warto, czy więcej zachodu niż pożytku?',
   created:'2026-06-14T10:10:00Z', comments:[
     {author_name:'Termo-Eko Gdańsk', author_type:'company', body:'Warto, ale dofinansowanie zależy od programu i Waszych dochodów — progi się zmieniają. Kluczowe: zbierajcie faktury imienne i protokoły, bo bez dokumentacji wniosek przepada. Część wykonawców pomaga skompletować papiery.', created:'2026-06-14T12:25:00Z'},
   ]},

  // --- strefa-wykonawcow ---
  {id:'demo-w1', category:'strefa-wykonawcow', author_name:'Glazura&Tynk Trójmiasto', author_type:'company', pinned:false,
   title:'Jak wyceniać robociznę przy układaniu glazury w 2026?',
   body:'Koledzy fachowcy — jak liczycie układanie płytek: za m² czy ryczałtem za łazienkę? I jak doliczacie format wielkoformatowy oraz mozaikę?',
   created:'2026-06-11T18:00:00Z', comments:[
     {author_name:'Hydro-Fix Gdynia', author_type:'company', body:'Bazowo za m², z dopłatą za wielki format (cięższy, wymaga poziomowania) i osobno za mozaikę/dekory — bo czasochłonne. Małe łazienki częściej ryczałtem, bo m² mało, a roboty z docinkami dużo.', created:'2026-06-11T20:30:00Z'},
     {author_name:'Dach-Mistrz Trójmiasto', author_type:'company', body:'I zawsze osobna pozycja za przygotowanie podłoża + hydroizolację. Klient musi widzieć, że to oddzielna praca, a nie „przy okazji".', created:'2026-06-12T07:05:00Z'},
   ]},
];
