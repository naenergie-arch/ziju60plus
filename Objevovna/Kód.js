const OBJ_SHEET_ID = '1Q5gJiDz-8yS1Z31BvFU_RSGbSBO2L8zjzNGaL8-cido';

function setupObjevovna() {
  const ss = SpreadsheetApp.openById(OBJ_SHEET_ID);
  const sh = ss.getSheets()[0];
  sh.setName('Objevovna_Archive');
  sh.clearContents();

  const headers = [
    'ID','Název','Kategorie','Popis_krátký','Wow_text','URL',
    'Datum_přidání','Den_trial','Poradi_v_dni','Obtížnost',
    'Čas_min','Jazyk','Cena','Hodnocení','Aktivní'
  ];

  const dnes = '2026-07-06';

  const data = [
    ['OBJ001','Google Arts & Culture','kultura','Virtuální procházka světovými muzei – Van Gogh, Louvre, Hermitage','Dnes tě vezmeme do muzea, kam možná nikdy nepůjdeš. Nepotřebuješ letenku.','https://artsandculture.google.com',dnes,1,1,'lehká',10,'CZ/EN','zdarma',9,true],
    ['OBJ002','Remini – AI oprava fotek','fotografie','AI opraví starou rozmazanou fotografii tvých rodičů za 30 sekund','Stará fotografie prarodičů bude najednou ostrá. Jako by ji nafotil profesionál.','https://remini.ai',dnes,2,1,'lehká',5,'CZ','zdarma/placená',9,true],
    ['OBJ003','Radio Garden','hudba/svět','Klikneš na jakékoliv město na světě a okamžitě slyšíš tamní rádio živě','Za 10 sekund budeš poslouchat rádio z Tokia, Nairobi nebo Buenos Aires.','https://radio.garden',dnes,2,2,'lehká',15,'EN','zdarma',10,true],
    ['OBJ004','Windy.com','příroda/věda','Fascinující živá vizualizace větru, bouří a počasí po celém světě','Nikdy jsi neviděl, jak vítr skutečně vypadá. Teď uvidíš.','https://windy.com',dnes,2,3,'lehká',10,'CZ','zdarma',8,true],
    ['OBJ005','Staré mapy Česka','historie','Jak vypadalo tvoje město před 100 lety – historické letecké snímky','Najdi svůj dům na mapě z roku 1920. Možná tam ještě nebyl.','https://mapy.cz',dnes,3,1,'lehká',15,'CZ','zdarma',8,true],
    ['OBJ006','Merlin Bird ID','příroda','Nahraješ ptačí zpěv z okna, AI za 5 sekund řekne, který pták to je','Otevři okno. Pusť aplikaci. Dozvíš se, kdo každý ráno zpívá pod tvým oknem.','https://merlin.allaboutbirds.org',dnes,3,2,'lehká',5,'EN','zdarma',9,true],
    ['OBJ007','NASA Eyes on the Solar System','věda/vesmír','3D cestování sluneční soustavou – kde je právě teď sonda Voyager?','Právě teď letí sonda Voyager mimo naši sluneční soustavu. Podívej se kde.','https://eyes.nasa.gov/apps/solar-system/',dnes,4,1,'lehká',20,'EN','zdarma',10,true],
    ['OBJ008','What3Words','technologie/svět','Každé místo na Zemi má 3 unikátní slova. Tvůj dům má svoji adresu.','Tvůj dům má adresu ze 3 slov. Zjisti jakou.','https://what3words.com',dnes,4,2,'lehká',5,'CZ','zdarma',8,true],
    ['OBJ009','MyHeritage AI – animace fotek','fotografie/rodina','Stará fotografie se pohne – prarodiče mrknou nebo se usmějí','Nahraj fotografii prarodičů. Za chvíli se pohnou. Bude to silný zážitek.','https://myheritage.com/deep-nostalgia',dnes,4,3,'lehká',10,'EN','zdarma/placená',9,true],
    ['OBJ010','Akinator','hra/zábava','AI uhádne jakoukoliv osobu, na kterou myslíš – za 20 otázek. Vždy.','Mysli na kohokoliv. Akinator to uhádne. Vsadíme se.','https://akinator.com',dnes,4,4,'lehká',10,'CZ','zdarma',9,true],
    ['OBJ011','The Deep Sea','příroda/věda','Scrolluješ dolů do hlubin oceánu – každých pár metrů nový tvor','Čím hlouběji scrolluješ, tím podivnější tvorové. Až 11 km dolů.','https://neal.fun/deep-sea',dnes,4,5,'lehká',15,'EN','zdarma',10,true],
    ['OBJ012','Národní divadlo online','kultura/divadlo','Archiv divadelních představení a oper zdarma – celý večer kultury z pohovky','Dnes večer – opera, balet nebo drama. Bez oblékání. Z pohovky.','https://online.narodni-divadlo.cz',dnes,5,1,'lehká',90,'CZ','zdarma',9,true],
    ['OBJ013','Google Street View časový stroj','historie/cestování','Podívej se jak vypadala tvoje ulice v roce 2009, 2012, 2016...','Zadej svoji adresu. Pak se přesuň v čase. Jak se změnil svět za 15 let?','https://maps.google.com',dnes,6,1,'lehká',15,'CZ','zdarma',8,true],
    ['OBJ014','Radiooooo','hudba/historie','Hudební časový stroj – vyber rok a zemi, okamžitě hraje hudba z té doby','1960, Francie. Co se tehdy hrálo? Jedním kliknutím zjistíš.','https://radiooooo.com',dnes,6,2,'lehká',20,'EN','zdarma',9,true],
    ['OBJ015','Librivox','knihy/audio','Audioknihy zdarma – tisíce titulů čtených dobrovolníky po celém světě','Zavři oči. Nech si číst. Tisíce knih zdarma.','https://librivox.org',dnes,6,3,'lehká',30,'CZ/EN','zdarma',8,true],
    ['OBJ016','iNaturalist','příroda/věda','Vyfoť rostlinu nebo hmyz – AI řekne co to je a ty přispěješ vědě','Vyfoť cokoliv živého. AI to pozná. A ty se staneš vědcem.','https://inaturalist.org',dnes,6,4,'lehká',10,'CZ','zdarma',9,true],
    ['OBJ017','Stellarium – mapa hvězd','vesmír/příroda','Reálná mapa noční oblohy nad tebou právě teď – namiř telefon na nebe','Dnes večer vyjdi ven, namiř telefon na nebe a popiš hvězdy jménem.','https://stellarium-web.org',dnes,7,1,'lehká',15,'CZ','zdarma',10,true],
    ['OBJ018','FutureMe – dopis do budoucnosti','inspirace/osobní','Napiš dopis sám sobě – dorazí ti za přesně 1 rok','Co si přeješ, aby se za rok splnilo? Napiš to. Za rok dostaneš odpověď.','https://futureme.org',dnes,7,2,'střední',15,'EN','zdarma',10,true],
  ];

  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.getRange(2, 1, data.length, headers.length).setValues(data);
  sh.getRange(1, 1, 1, headers.length).setBackground('#f0c060').setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, headers.length);

  Logger.log('Hotovo! ' + data.length + ' překvapení uloženo.');
}

// Přidá překvapení pro dny 8–37 (spustit jednou po setupObjevovna)
// Rytmus: 2,1,3,2,1,4,2,1,3,2,4,1,2,3,1,2,4,1,3,2,1,3,2,4,1,2,3,1,2,3
function setupDny8az37() {
  const ss = SpreadsheetApp.openById(OBJ_SHEET_ID);
  const sh = ss.getSheetByName('Objevovna_Archive');
  if (!sh) { Logger.log('Sheet nenalezen'); return; }

  const dnes = new Date().toISOString().slice(0, 10);

  const data = [
    ['D8001','iVysílání ČT','kultura/TV','Archiv České televize – tisíce pořadů, dokumentů a filmů zdarma','Celý archív České televize. Dokumenty, filmy, pořady. Zdarma. Bez reklam.','https://www.ceskatelevize.cz/ivysilani/',dnes,8,1,'lehká',60,'CZ','zdarma',9,true,false],
    ['D8002','Recepty.cz','vaření','Největší česká databáze receptů – hledej podle surovin co máš doma','Zadej co máš v lednici. Dostaneš recepty na celý týden.','https://www.recepty.cz',dnes,8,2,'lehká',15,'CZ','zdarma',8,true,false],
    ['D9001','TED – Inspirující přednášky','vzdělání','Nejlepší přednášky světových myslitelů – mnohé s českými titulky','18 minut. Jedna myšlenka. Která tě může změnit.','https://www.ted.com/talks?language=cs',dnes,9,1,'lehká',20,'CZ/EN','zdarma',10,true,false],
    ['D10001','Chess.com','hra/logika','Zahraj šachy online – proti počítači nebo živým hráčům z celého světa','Šachy jsou zpátky. Miliony hráčů online. Ty jsi na tahu.','https://www.chess.com/play/computer',dnes,10,1,'lehká',20,'CZ','zdarma',9,true,false],
    ['D10002','Křížovky online','hra/čeština','Křížovky, osmisměrky a sudoku přímo v prohlížeči – denně nové','Klasika, která trénuje mozek. Nová křížovka každý den.','https://krizovky.seznam.cz',dnes,10,2,'lehká',15,'CZ','zdarma',8,true,false],
    ['D10003','Ábíčko – retro hry','hra/nostalgic','Hry z dětství a mládí – lodě, piškvorky, had a desítky dalších','Vzpomínáš na první počítačové hry? Tady jsou. Zadarmo.','https://www.abicko.cz/hry',dnes,10,3,'lehká',10,'CZ','zdarma',7,true,false],
    ['D11001','Headspace – meditace','zdraví/mindfulness','Průvodce meditací pro začátečníky – 3 minuty denně stačí','Zavři oči. Dýchej. Tři minuty. Uvidíš rozdíl.','https://www.headspace.com/meditation/meditation-for-beginners',dnes,11,1,'lehká',5,'EN','zdarma/trial',8,true,false],
    ['D11002','Zdravě.cz','zdraví','Tipy na zdravý životní styl, výživu a pohyb pro 60+','Co jíst, jak se hýbat, jak spát lépe. Česky a prakticky.','https://www.zdravi.euro.cz',dnes,11,2,'lehká',10,'CZ','zdarma',7,true,false],
    ['D12001','Spotify – bezplatný poslech','hudba','Miliony skladeb zdarma – vytvoř si vlastní playlist nebo poslouchej rádio','Najdi hudbu svého mládí. Zadej rok. Poslouchej.','https://open.spotify.com',dnes,12,1,'lehká',30,'CZ','zdarma',9,true,false],
    ['D13001','Wikipedie – Tento den v historii','historie','Co se stalo právě dnes v historii – od starověku po moderní dobu','Dnes v historii zemřel, narodil se, nebo byl objeven... Kdo? Zjisti.','https://cs.wikipedia.org/wiki/Wikipedie:Tento_den_v_historii',dnes,13,1,'lehká',10,'CZ','zdarma',8,true,false],
    ['D13002','Národní filmový archív','filmy/kultura','České filmy z archivu NFA – klasiky, dokumenty, krátkometrážní filmy','Filmy, které jsi viděl v kině. Teď znovu, doma, zdarma.','https://nfa.cz/cs/digitalni-kino/',dnes,13,2,'lehká',90,'CZ','zdarma',9,true,false],
    ['D13003','Čtenářský klub – Databáze knih','knihy','Největší česká databáze knih – najdi co číst, přidej recenzi','Co si přečíst příště? Tady jsou tisíce doporučení od čtenářů.','https://www.databazeknih.cz',dnes,13,3,'lehká',15,'CZ','zdarma',8,true,false],
    ['D13004','Google Foto – záloha vzpomínek','technologie','Ulož fotografie z mobilu do cloudu – zdarma, bezpečně, navždy','Fotky na mobilu jsou v bezpečí jen dokud telefon funguje. Zalohuj je.','https://photos.google.com',dnes,13,4,'lehká',20,'CZ','zdarma',9,true,false],
    ['D14001','Mapy.cz – Turistické mapy','příroda/cestování','Nejlepší turistické mapy Česka – naplánuj výlet, najdi stezku','Kde jsi ještě nebyl? Jaká stezka čeká 5 km od tebe?','https://mapy.cz/turisticka',dnes,14,1,'lehká',15,'CZ','zdarma',9,true,false],
    ['D14002','Počasí ČHMÚ','příroda/věda','Oficiální předpověď počasí s radarem srážek a bouřkovou mapou','Sleduj bouřku na radaru živě. Přesně nad svým domem.','https://www.chmi.cz/files/portal/docs/meteo/rad/data_out/radarCR/',dnes,14,2,'lehká',5,'CZ','zdarma',7,true,false],
    ['D15001','Duolingo – Čeština pro cizince','jazyky/hra','Zkus Duolingo opačně – uč se jak cizinci vidí češtinu','Proč je čeština tak těžká? Tohle tě překvapí.','https://www.duolingo.com/course/cs/en/Learn-Czech',dnes,15,1,'lehká',10,'EN','zdarma',7,true,false],
    ['D16001','Česká filharmonie online','hudba/kultura','Záznamy koncertů České filharmonie – světová hudba z Rudolfina','Zavři oči. Pusť. Jsi v Rudolfinu.','https://www.ceskafilharmonie.cz/koncerty/online-archiv/',dnes,16,1,'lehká',60,'CZ','zdarma',10,true,false],
    ['D16002','Muzeum online – Národní muzeum','kultura/historie','Virtuální prohlídky sbírek Národního muzea – minerály, příroda, historie','Národní muzeum – celé. Online. Bez čekání ve frontě.','https://www.nm.cz/virtualni-muzeum',dnes,16,2,'lehká',20,'CZ','zdarma',8,true,false],
    ['D16003','Old Maps Online','historie/mapy','Historické mapy celého světa – jak vypadala Evropa v roce 1800','Najdi své město na mapě z roku 1800. Bylo tam vůbec?','https://www.oldmapsonline.org',dnes,16,3,'lehká',15,'EN','zdarma',8,true,false],
    ['D17001','Kurzovní lístek a kalkulačka','finance','Přepočítej jakoukoli měnu – kolik stojí dovolená, co platíš v zahraničí','Plánuješ cestu? Kolik vezmeš eur? Za minutu to víš.','https://www.kurzy.cz/kurzy-men/nejlepsi-kurzy/',dnes,17,1,'lehká',5,'CZ','zdarma',7,true,false],
    ['D17002','Jak na počítač – video návody','technologie','Česky vysvětlené video návody pro začátečníky – mobil, počítač, internet','Nevíš jak na to? Tady to někdo vysvětlí česky, pomalu a srozumitelně.','https://www.youtube.com/@JakNaPocitac',dnes,17,2,'lehká',15,'CZ','zdarma',8,true,false],
    ['D18001','Antikvárium – staré knihy online','knihy/kultura','Prohlížej a čti digitalizované staré české knihy zdarma','Knihy z roku 1890. Pohádky, romány, poezie. Přečti si co četli vaši prarodiče.','https://kramerius5.nkp.cz',dnes,18,1,'lehká',20,'CZ','zdarma',9,true,false],
    ['D18002','Česká muzika – Folk a country','hudba','Archív české folkové a country hudby – Nohavica, Merta, Hutka','Písničkáři co měnili dobu. Poslouchej a vzpomínej.','https://www.youtube.com/results?search_query=česká+folk+music',dnes,18,2,'lehká',30,'CZ','zdarma',9,true,false],
    ['D18003','Geocaching – poklad za domem','hra/příroda','Hra na hledání skrytých pokladů GPS – je jeden schovaný 500m od tebe','Někdo schoval poklad blízko tvého domu. Jdeš ho najít?','https://www.geocaching.com/play',dnes,18,3,'střední',60,'CZ','zdarma',8,true,false],
    ['D18004','SkyView Lite – AR hvězdy','vesmír','Namiř telefon na oblohu – ukáže se mapa hvězd, planet i satelitů','Namiř na modré nebe. Uvidíš co je za ním – planety, hvězdy, ISS.','https://apps.apple.com/app/skyview-lite/id413936865',dnes,18,4,'lehká',10,'CZ','zdarma',9,true,false],
    ['D19001','Zonky – komunita a příběhy','inspirace','Příběhy lidí co změnili svůj život po 50 – inspirativní čtení','Nejsi jediný kdo začal znovu po šedesátce. Přečti si jejich příběhy.','https://blog.zonky.cz',dnes,19,1,'lehká',10,'CZ','zdarma',7,true,false],
    ['D20001','Google Keep – zápisník','technologie','Jednoduché poznámky v telefonu – nikdy nezapomeneš co si říkal','Nápad uprostřed noci? Zápisky z doktora? Nákupní seznam? Vše na jednom místě.','https://keep.google.com',dnes,20,1,'lehká',10,'CZ','zdarma',8,true,false],
    ['D20002','Jóga pro seniory – video','zdraví/pohyb','Jemná jóga pro 60+ – 20 minut, bez vstávání ze židle','Dělej se mnou. 20 minut. Zůstaneš sedět na židli. Ale pocítíš rozdíl.','https://www.youtube.com/results?search_query=jóga+pro+seniory+čeština',dnes,20,2,'lehká',20,'CZ','zdarma',8,true,false],
    ['D21001','Záhady a detektivky – podcast','kultura/zábava','Česky mluvené podcasty o záhadách, historii a nevyřešených případech','Záhada. Detektiv. Odhalení. Poslouchej jako u rozhlasové hry.','https://www.mujrozhlas.cz/detektivky',dnes,21,1,'lehká',30,'CZ','zdarma',8,true,false],
    ['D21002','Kvíz ze školy – ČT edu','vzdělání/hra','Otestuj znalosti ze základní školy – zeměpis, historie, příroda','Vzpomínáš na školu? Víš to ještě? Zkus to zjistit.','https://edu.ceskatelevize.cz/kviz',dnes,21,2,'lehká',10,'CZ','zdarma',8,true,false],
    ['D21003','Pinterest – inspirace na doma','kreativita','Tisíce nápadů na zahradu, vaření, ruční práce a úpravu domova','Co uděláš příští víkend? Tady najdeš 1000 nápadů.','https://www.pinterest.com/ideas/',dnes,21,3,'lehká',15,'CZ','zdarma',7,true,false],
    ['D22001','Filmová databáze ČSFD','filmy','Největší česká databáze filmů – najdi co dát večer na televizi','Jaký film dát dnes večer? Za 2 minuty víš.','https://www.csfd.cz/zebricky/nejlepsi-filmy/',dnes,22,1,'lehká',10,'CZ','zdarma',9,true,false],
    ['D23001','Výslovnost jmen – Forvo','jazyky','Jak se správně vyslovují cizí jména – Macron, Beethoven, Kyjev','Beethoven nebo Betóven? Poslechni si jak to říkají rodilí mluvčí.','https://cs.forvo.com',dnes,23,1,'lehká',5,'CZ','zdarma',7,true,false],
    ['D23002','Křížovky ČRo','hra/čeština','Křížovky Českého rozhlasu – klasické, soutěžní, slovní hry','Rozhlasové křížovky. Jako dřív. Ale teď online.','https://www.rozhlas.cz/zabava/krizovky/',dnes,23,2,'lehká',15,'CZ','zdarma',8,true,false],
    ['D24001','Virtuální prohlídka Vatikánu','kultura/cestování','Procházka Vatikánem – Sixtinská kaple, Bazilika sv. Petra, zahrady','Bez fronty. Bez letadla. Sixtinská kaple – jen ty a Michelangelo.','https://www.vatican.va/various/cappelle/sistina_vr/index.html',dnes,24,1,'lehká',20,'EN','zdarma',10,true,false],
    ['D24002','Ikebana – japonská aranžistika','kreativita/kultura','Umění japonské ikebany – základy aranžování květin podle starých mistrů','Tři stonky. Správný úhel. Klid. Ikebana tě naučí dívat se jinak.','https://www.youtube.com/results?search_query=ikebana+tutorial+beginners',dnes,24,2,'lehká',15,'EN','zdarma',8,true,false],
    ['D24003','ČRo Vltava – kulturní rádio','hudba/kultura','Nejkulturnější české rádio – vážná hudba, literatura, divadlo','Pusť Vltavu. Usaď se. Toto je jiné rádio.','https://vltava.rozhlas.cz',dnes,24,3,'lehká',30,'CZ','zdarma',9,true,false],
    ['D24004','Jak funguje mozek','věda/zdraví','Vizuální vysvětlení jak pracuje mozek, paměť a emoce','Proč zapomínáš klíče? Proč tě baví hudba? Mozek vysvětlený za 10 minut.','https://www.youtube.com/results?search_query=jak+funguje+mozek+česky',dnes,24,4,'lehká',10,'CZ','zdarma',8,true,false],
    ['D25001','Zápisník vděčnosti','zdraví/mindfulness','Napiš tři věci za které jsi dnes vděčný – vědecky prokázaný efekt','Tři věci. Každý den. Výzkumy říkají: změní ti to pohled na život.','https://www.futureme.org',dnes,25,1,'lehká',5,'CZ/EN','zdarma',8,true,false],
    ['D26001','Archív Lidových novin','historie','Historické vydání novin z roku tvého narození – co se psalo tehdy','Co se psalo v den kdy jsi se narodil? Najdi to.','https://www.digitalniknihovna.cz/mzk/periodical/uuid:a8a0b462-435d-11dd-b505-00145e5790ea',dnes,26,1,'střední',20,'CZ','zdarma',9,true,false],
    ['D26002','Procházka lesem – ASMR','příroda/relax','Zvuky lesa, potoka a ptáků – 1 hodina relaxace pro uvolnění mysli','Nemusíš nikam chodit. Les přijde za tebou. Pusť a zavři oči.','https://www.youtube.com/results?search_query=czech+forest+sounds+4k',dnes,26,2,'lehká',20,'EN','zdarma',8,true,false],
    ['D26003','Slepá mapa světa – kvíz','vzdělání/hra','Poznáš státy světa na slepé mapě? Otestuj zeměpisné znalosti','Africké státy, ostrovy v Pacifiku... Kolik jich poznáš?','https://www.seterra.com/cs/vgp/3575',dnes,26,3,'lehká',10,'CZ','zdarma',8,true,false],
    ['D27001','Street Food po světě','cestování/vaření','Krátké dokumenty o pouličním jídle – Thajsko, Mexiko, Maroko','Jídlo je kultura. Podívej se jak jedí na druhém konci světa.','https://www.youtube.com/results?search_query=street+food+documentary',dnes,27,1,'lehká',20,'EN','zdarma',8,true,false],
    ['D27002','Háčkování a krajkování online','kreativita','Návody na tradiční česká řemesla – krajkování, háčkování, pletení','Babiččiny vzory jsou zpátky. A tohle tě nebolí záda.','https://www.youtube.com/results?search_query=háčkování+návod+začátečníci',dnes,27,2,'lehká',20,'CZ','zdarma',7,true,false],
    ['D28001','Generátor citátů','inspirace','Náhodný citát moudrých lidí – Seneca, Stoici, Dalajlama, Čapek','Jeden citát. Přečti pomalu. Nech ho doznít.','https://citaty.net/nahodny/',dnes,28,1,'lehká',5,'CZ','zdarma',7,true,false],
    ['D29001','Virtuální prohlídka ISS','vesmír/věda','Procházka Mezinárodní vesmírnou stanicí – tak žijí astronauti','Kuchyň, ložnice, záchod – ve vznosu. Vesmírná stanice zevnitř.','https://spotthestation.nasa.gov/tracking_map.cfm',dnes,29,1,'lehká',15,'EN','zdarma',9,true,false],
    ['D29002','Jak se dělá – dokumenty','věda/technologie','Dokumenty o výrobě každodenních věcí – čokoláda, tužky, sklo, papír','Jak se vyrábí tužka? Sklenice? Nikdy ses nezamyslel. Teď uvidíš.','https://www.youtube.com/c/HowItsMade',dnes,29,2,'lehká',15,'EN','zdarma',8,true,false],
    ['D29003','Hudba první republiky','hudba/historie','Nahrávky z 20. let – takto zněla hudba za první republiky','Hudba z roku 1925. Takto zpívali vaši prarodiče. Vzácný zvukový archív.','https://www.youtube.com/results?search_query=hudba+první+republika+1920',dnes,29,3,'lehká',15,'CZ','zdarma',9,true,false],
    ['D30001','Dopis budoucím generacím','inspirace/osobní','Napiš vzkaz svým vnoučatům – co chceš aby věděli o tvém životě','Co chceš aby vnuci věděli? Napiš jim to teď. Nečekej.','https://www.futureme.org',dnes,30,1,'střední',20,'CZ/EN','zdarma',10,true,false],
    ['D30002','30 dní – reflexe cesty','inspirace','Ohlédni se za 30 dny – co tě nejvíc překvapilo?','30 dní. Co bylo nejlepší? Co tě překvapilo? Co chceš prozkoumat víc?','https://ziju60plus.cz',dnes,30,2,'lehká',10,'CZ','zdarma',10,true,false],
    ['D31001','Louvre – online sbírky','kultura/umění','Celá sbírka Louvru online – 480 000 děl, každé s popisem a historií','Mona Lisa. Venuše Milóská. A 479 998 dalších. Bez fronty. Zadarmo.','https://collections.louvre.fr/en/',dnes,31,1,'lehká',20,'EN','zdarma',10,true,false],
    ['D31002','Kuchyně světa – vaření','vaření','Autentické recepty z 50 zemí světa – vyber si co uvařit tento víkend','Španělská paella. Thajské kari. Marocký tagine. Dnes vaříš jinak.','https://www.allrecipes.com/recipes/233/world-cuisine/',dnes,31,2,'lehká',15,'EN','zdarma',8,true,false],
    ['D31003','Ptáci ČR – databáze zpěvu','příroda','Databáze ptačích zpěvů – každý pták, každý hlas, vše česky','Slyšíš ráno za oknem pěnici? Kosa? Špaček? Klikni a zjisti.','https://www.birds.cz/avif/atlas.php',dnes,31,3,'lehká',10,'CZ','zdarma',8,true,false],
    ['D31004','Dechová cvičení 4-7-8','zdraví','Vědecky ověřená dechová technika pro uvolnění stresu a lepší spánek','Nádech 4 sekundy. Zadržení 7. Výdech 8. Třikrát. Zkus to teď.','https://www.youtube.com/results?search_query=4-7-8+dechová+cvičení+čeština',dnes,31,4,'lehká',5,'CZ','zdarma',9,true,false],
    ['D32001','Slovník cizích slov','vzdělání/čeština','Vysvětlení cizích slov která slýcháš ale nevíš co znamenají','Udržitelnost, konsolidace, inflace... Co to vlastně znamená?','https://slovnik-cizich-slov.abz.cz',dnes,32,1,'lehká',5,'CZ','zdarma',7,true,false],
    ['D33001','Živý přenos z ISS','vesmír','Živý přenos z Mezinárodní vesmírné stanice – Země z výšky 400 km','Právě teď. Živě. Pohled na Zemi z vesmíru. ISS letí 28 000 km/h.','https://www.nasa.gov/nasatv/iss-hdev-payload.html',dnes,33,1,'lehká',10,'EN','zdarma',10,true,false],
    ['D33002','České pohádky – archív ČT','kultura/nostalgie','Klasické české pohádky z archivu ČT – Křemílek, Mach a Šebestová','Křemílek. Vochomůrka. Mach a Šebestová. Vzpomínáš?','https://www.ceskatelevize.cz/porady/10267562059-kremilek-a-vochomurka/',dnes,33,2,'lehká',20,'CZ','zdarma',9,true,false],
    ['D34001','Antický Řím ve 3D','historie/cestování','Projdi se antickým Římem v době slávy – 3D rekonstrukce města','Řím v roce 320 n.l. – takto vypadalo centrum světa. Ve 3D.','https://www.romereborn.virginia.edu',dnes,34,1,'lehká',15,'EN','zdarma',9,true,false],
    ['D34002','Zvuky přírody – generátor','příroda/relax','Nastav si vlastní mix zvuků přírody – les, déšť, oceán, potok','Les + déšť + zpěv ptáků. Tvůj osobní relaxační zvuk.','https://mynoise.net/NoiseMachines/jungleSoundscapeNoiseGenerator.php',dnes,34,2,'lehká',30,'EN','zdarma',9,true,false],
    ['D34003','Jak fotit mobilem lépe','technologie/kreativita','Jednoduché tipy jak fotit hezčí fotky mobilem – světlo, kompozice','Jedna změna. Fotky budou vypadat profesionálně. Opravdu.','https://www.youtube.com/results?search_query=jak+fotit+mobilem+lépe+česky',dnes,34,3,'lehká',10,'CZ','zdarma',8,true,false],
    ['D35001','Zahrada – sezónní tipy','příroda/kreativita','Sezónní zahradnické rady – co sázet, kdy plít, jak pečovat o zeleninu','Zahrada ví kdy je jaký čas. A tady se to dozvíš taky.','https://www.zahrada.cz',dnes,35,1,'lehká',10,'CZ','zdarma',8,true,false],
    ['D36001','Tibetské mísy – relaxace','zdraví/kultura','Zvuky tibetských mís pro meditaci a uvolnění – vědecky ověřený efekt','Zavři oči. Pusť. Nech zvuk projít tělem. Pět minut.','https://www.youtube.com/results?search_query=tibetan+singing+bowls+1+hour',dnes,36,1,'lehká',10,'EN','zdarma',8,true,false],
    ['D36002','Planety sluneční soustavy – 3D','vesmír/věda','Interaktivní 3D model sluneční soustavy – prozkoumej planety a měsíce','Kde je teď Mars? Kolik měsíců má Jupiter? Klikni a zjisti.','https://solarsystemscope.com',dnes,36,2,'lehká',15,'EN','zdarma',9,true,false],
    ['D37001','Reflexe 37 dní','inspirace/osobní','Zamysli se: co ti Objevovna dala? Co z toho zůstane?','37 dní. Co se změnilo? Co tě překvapilo? Napiš si to.','https://www.futureme.org',dnes,37,1,'střední',15,'CZ/EN','zdarma',10,true,false],
    ['D37002','Nejkrásnější místa Česka','cestování/příroda','4K videa nejkrásnějších míst České republiky – příroda, hrady, panoramata','Česká republika jak ji neznáš. Letecky, za úsvitu, v mlze.','https://www.youtube.com/results?search_query=czech+republic+4k+drone+nature',dnes,37,2,'lehká',15,'EN','zdarma',9,true,false],
    ['D37003','Gratulace – dokončil jsi!','inspirace','Dokončil jsi 37denní program Objevovny. To není samozřejmost.','Dokázal jsi to. 37 dní. Každý den něco nového. Gratulujeme.','https://ziju60plus.cz/result.html',dnes,37,3,'lehká',5,'CZ','zdarma',10,true,false],
  ];

  data.forEach(row => sh.appendRow(row));
  Logger.log('Přidáno ' + data.length + ' překvapení pro dny 8–37.');
}

// Web App endpoint – vrací překvapení pro daný den nebo archív
// ?day=N          → překvapení pro den N
// ?maxDay=N       → všechny dny 1..N (archív)
function doGet(e) {
  const params = e.parameter || {};
  const day = parseInt(params.day || '1', 10);
  const maxDay = params.maxDay ? parseInt(params.maxDay, 10) : null;

  try {
    const ss = SpreadsheetApp.openById(OBJ_SHEET_ID);
    const sh = ss.getSheetByName('Objevovna_Archive');
    if (!sh) throw new Error('Sheet nenalezen');

    const rows = sh.getDataRange().getValues();
    const headers = rows[0];
    const idxId     = headers.indexOf('ID');
    const idxDen    = headers.indexOf('Den_trial');
    const idxNazev  = headers.indexOf('Název');
    const idxPopis  = headers.indexOf('Popis_krátký');
    const idxWow    = headers.indexOf('Wow_text');
    const idxUrl    = headers.indexOf('URL');
    const idxKat    = headers.indexOf('Kategorie');
    const idxCas    = headers.indexOf('Čas_min');
    const idxAktivni = headers.indexOf('Aktivní');
    const idxZaloha  = headers.indexOf('Záloha');

    const dataRows = rows.slice(1).filter(r =>
      r[idxAktivni] === true && !(r[idxZaloha] === true && r[idxDen] == 0)
    );

    const mapRow = r => ({
      objId: r[idxId],
      nazev: r[idxNazev],
      popis: r[idxPopis],
      wow: r[idxWow],
      url: r[idxUrl],
      kategorie: r[idxKat],
      cas_min: r[idxCas],
      den: r[idxDen],
    });

    if (maxDay !== null) {
      // Vrať archív: objekt { den: [překvapení] } pro dny 1..maxDay
      const archive = {};
      for (let d = 1; d <= maxDay; d++) {
        archive[d] = dataRows.filter(r => r[idxDen] == d).map(mapRow);
      }
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, maxDay, archive }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const surprises = dataRows.filter(r => r[idxDen] == day).map(mapRow);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, day, surprises }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── INTERAKCE ────────────────────────────────────────────────────────────────
// POST { action:"saveInterakce", email, objId, nazev, den, url }
// GET  ?action=getInterakce&email=...  → vrátí seznam kliknutých ObjID
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(OBJ_SHEET_ID);

    if (data.action === 'saveInterakce') {
      let sh = ss.getSheetByName('Interakce');
      if (!sh) {
        sh = ss.insertSheet('Interakce');
        sh.appendRow(['Datum','Email','ObjID','Název','Den_trial','URL']);
        sh.getRange(1,1,1,6).setBackground('#c9daf8').setFontWeight('bold');
        sh.setFrozenRows(1);
      }
      sh.appendRow([
        new Date().toISOString(),
        data.email || '',
        data.objId || '',
        data.nazev || '',
        data.den || 0,
        data.url || '',
      ]);
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'Neznámá akce' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── ZÁLOŽNÍ POOL ──────────────────────────────────────────────────────────────
// Přidá záložní překvapení do sheetu (spustit jednou ručně)
function setupZalohy() {
  const ss = SpreadsheetApp.openById(OBJ_SHEET_ID);
  const sh = ss.getSheetByName('Objevovna_Archive');
  if (!sh) { Logger.log('Sheet nenalezen'); return; }

  // Přidej sloupec "Záloha" pokud chybí
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  let idxZaloha = headers.indexOf('Záloha');
  if (idxZaloha === -1) {
    const newCol = sh.getLastColumn() + 1;
    sh.getRange(1, newCol).setValue('Záloha');
    sh.getRange(1, newCol).setBackground('#f0c060').setFontWeight('bold');
    idxZaloha = newCol - 1;
    Logger.log('Přidán sloupec Záloha');
  }

  const dnes = new Date().toISOString().slice(0, 10);
  // Den_trial=0 znamená "záloha – nepřiřazeno"
  const zalohy = [
    ['ZAL001','Google Earth Web','cestování','Přeleť nad jakýmkoliv místem na Zemi v 3D – domy, hory, oceány','Zadej svoji ulici. Pak odleť na druhý konec světa. Vše za 60 sekund.','https://earth.google.com/web/',dnes,0,0,'lehká',10,'CZ','zdarma',9,true,true],
    ['ZAL002','Duolingo','jazyky','Nauč se 5 slov v japonštině, arabštině nebo svahilštině – za 10 minut','Dnes se nauč 5 slov v jazyce, který jsi nikdy neslyšel. Překvapí tě, jak lehké to je.','https://duolingo.com',dnes,0,0,'lehká',10,'CZ','zdarma',8,true,true],
    ['ZAL003','Musicmap','hudba','Interaktivní mapa všech hudebních žánrů a jejich vztahů','Kde na mapě je jazz? Kde folk? Kde tango? A co je mezi nimi?','https://musicmap.info',dnes,0,0,'lehká',15,'EN','zdarma',8,true,true],
    ['ZAL004','The True Size Of','věda/zeměpis','Jak velká jsou skutečně africká země, Rusko nebo Česko – bez zkreslení map','Mapy lžou. Grensko není tak velké jak vypadá. Přetáhni ho na Afriku a uvidíš.','https://thetruesize.com',dnes,0,0,'lehká',10,'EN','zdarma',9,true,true],
    ['ZAL005','Incredibox','hudba/hra','Vytvoř vlastní hudbu – přetahuj ikonky a skládáš beatbox kapelu','Za 3 minuty budeš mít vlastní hudební skladbu. Žádné znalosti nepotřebuješ.','https://www.incredibox.com',dnes,0,0,'lehká',15,'EN','zdarma',9,true,true],
    ['ZAL006','NASA Image of the Day','vesmír/fotografie','Každý den nová úžasná fotografie z vesmíru s vysvětlením vědců','Dnes: co NASA vyfotografovala právě teď.','https://www.nasa.gov/image-of-the-day/',dnes,0,0,'lehká',5,'EN','zdarma',9,true,true],
    ['ZAL007','MapCrunch','cestování','Náhodný Google Street View kdekoliv na světě – teleport do neznáma','Klikni. Ocitneš se někde na světě. Kde jsi? Hádej.','https://www.mapcrunch.com',dnes,0,0,'lehká',10,'EN','zdarma',8,true,true],
    ['ZAL008','PolyFauna','příroda/umění','Interaktivní svět živočichů od Radiohead – surreálný zážitek','Pohybuj myší. Sleduj co se děje. Tohle je jiný internet.','https://www.google.com/doodles',dnes,0,0,'lehká',10,'EN','zdarma',7,true,true],
  ];

  // Nastav Záloha=false pro stávající řádky (pokud sloupec existuje ale je prázdný)
  const lastRow = sh.getLastRow();
  const colZaloha = idxZaloha + 1;
  for (let r = 2; r <= lastRow; r++) {
    const val = sh.getRange(r, colZaloha).getValue();
    if (val === '' || val === null) sh.getRange(r, colZaloha).setValue(false);
  }

  // Přidej záložní řádky
  zalohy.forEach(row => sh.appendRow(row));
  Logger.log('Přidáno ' + zalohy.length + ' záložních překvapení.');
}

// ── KONTROLA URL + AUTOMATICKÁ VÝMĚNA ────────────────────────────────────────
function checkAllUrls() {
  const ss = SpreadsheetApp.openById(OBJ_SHEET_ID);
  const sh = ss.getSheetByName('Objevovna_Archive');
  if (!sh) { Logger.log('Sheet nenalezen'); return; }

  const allValues = sh.getDataRange().getValues();
  const headers = allValues[0];
  const idxNazev   = headers.indexOf('Název');
  const idxUrl     = headers.indexOf('URL');
  const idxDen     = headers.indexOf('Den_trial');
  const idxPoradi  = headers.indexOf('Poradi_v_dni');
  const idxAktivni = headers.indexOf('Aktivní');
  const idxZaloha  = headers.indexOf('Záloha');

  const replaced = [];   // co bylo vyměněno
  const noBackup = [];   // co nešlo vyměnit

  allValues.slice(1).forEach((row, i) => {
    const rowNum = i + 2; // 1-indexed + header
    if (!row[idxAktivni]) return;        // neaktivní přeskočíme
    if (idxZaloha >= 0 && row[idxZaloha] === true) return; // zálohy netestujeme
    if (row[idxDen] === 0) return;       // nepřiřazené zálohy přeskočíme

    const url   = row[idxUrl];
    const nazev = row[idxNazev];
    const den   = row[idxDen];
    const poradi = row[idxPoradi];
    if (!url || !url.startsWith('http')) return;

    let ok = false;
    try {
      const resp = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        followRedirects: true,
        validateHttpsCertificates: false,
      });
      ok = resp.getResponseCode() < 400;
    } catch (_) { ok = false; }

    if (ok) {
      Logger.log('OK: ' + nazev);
      return;
    }

    Logger.log('NEFUNKČNÍ: ' + nazev + ' (' + url + ')');

    // Deaktivuj nefunkční řádek
    sh.getRange(rowNum, idxAktivni + 1).setValue(false);

    // Najdi záložní překvapení (Záloha=true, Aktivní=true, Den_trial=0)
    const freshValues = sh.getDataRange().getValues();
    let backupRowNum = -1;
    let backupRow = null;
    for (let j = 1; j < freshValues.length; j++) {
      const r = freshValues[j];
      if (idxZaloha >= 0 && r[idxZaloha] === true && r[idxAktivni] === true && r[idxDen] === 0) {
        backupRowNum = j + 1;
        backupRow = r;
        break;
      }
    }

    if (!backupRow) {
      noBackup.push({ nazev, url, den });
      Logger.log('ŽÁDNÁ ZÁLOHA pro den ' + den);
      return;
    }

    // Přiřaď zálohu na místo nefunkčního
    sh.getRange(backupRowNum, idxDen + 1).setValue(den);
    sh.getRange(backupRowNum, idxPoradi + 1).setValue(poradi);
    if (idxZaloha >= 0) sh.getRange(backupRowNum, idxZaloha + 1).setValue(false);

    replaced.push({
      stary_nazev: nazev, stara_url: url, den,
      novy_nazev: backupRow[idxNazev], nova_url: backupRow[idxUrl],
    });
    Logger.log('NAHRAZENO: ' + nazev + ' → ' + backupRow[idxNazev]);
    Utilities.sleep(500);
  });

  // Email report
  if (replaced.length > 0 || noBackup.length > 0) {
    let html = `<h2>🔄 Objevovna – automatická oprava odkazů</h2>`;

    if (replaced.length > 0) {
      html += `<h3 style="color:green">✅ Automaticky nahrazeno (${replaced.length})</h3>
      <table border="1" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px">
        <tr style="background:#d4edda"><th style="padding:6px 12px">Den</th><th>Odstraněno</th><th>Nahrazeno za</th></tr>
        ${replaced.map(r => `<tr>
          <td style="padding:6px 12px">Den ${r.den}</td>
          <td style="padding:6px 12px"><s>${r.stary_nazev}</s><br><small style="color:#888">${r.stara_url}</small></td>
          <td style="padding:6px 12px"><strong>${r.novy_nazev}</strong><br><small><a href="${r.nova_url}">${r.nova_url}</a></small></td>
        </tr>`).join('')}
      </table>`;
    }

    if (noBackup.length > 0) {
      html += `<h3 style="color:red">⚠️ Nefunkční bez zálohy – nutný ruční zásah (${noBackup.length})</h3>
      <ul>${noBackup.map(r => `<li>Den ${r.den}: <strong>${r.nazev}</strong> – <a href="${r.url}">${r.url}</a></li>`).join('')}</ul>
      <p><strong>Doporučení:</strong> Přidej nové záložní překvapení do sheetu (Den_trial=0, Záloha=TRUE).</p>`;
    }

    html += `<p style="color:#888;font-size:12px">Automatická kontrola – Žiju60plus Objevovna</p>`;

    const subject = replaced.length > 0 && noBackup.length === 0
      ? '✅ Objevovna: ' + replaced.length + ' odkaz automaticky opraven'
      : '⚠️ Objevovna: oprava odkazů – nutný zásah';

    GmailApp.sendEmail('naenergie@gmail.com', subject,
      'Viz HTML verzi emailu.', { htmlBody: html });
    Logger.log('Email odeslán.');
  } else {
    Logger.log('Vše OK – žádné nefunkční odkazy.');
  }
}

// Nastaví automatický týdenní trigger (spustit jednou ručně)
function setupWeeklyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'checkAllUrls') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkAllUrls')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();
  Logger.log('Trigger nastaven: checkAllUrls každé pondělí v 9:00');
}
 
