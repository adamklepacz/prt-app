import { BotanicalVariant } from '../components/Botanical';

export interface KnowledgeBlock {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Wyróżniony cytat / myśl przewodnia. */
  quote?: string;
}

export interface KnowledgeSection {
  id: 'mindset' | 'levels' | 'sensitization';
  tab: string;
  title: string;
  subtitle: string;
  color: string;
  botanical: BotanicalVariant;
  blocks: KnowledgeBlock[];
}

export const KNOWLEDGE: KnowledgeSection[] = [
  {
    id: 'mindset',
    tab: 'Mindset',
    title: 'Instrukcja',
    subtitle: 'Obserwujesz. Nie naprawiasz.',
    color: '#5E715D',
    botanical: 'willow',
    blocks: [
      {
        heading: 'Czym jest Somatic Tracking',
        paragraphs: [
          'Somatic Tracking to centralna technika terapii przetwarzania bólu (Pain Reprocessing Therapy, PRT). Kierujesz uwagę na doznanie w ciele i opisujesz je tak, jak naukowiec odczytuje telemetrię: lokalizacja, temperatura, gęstość, ruch, krawędzie, pulsowanie.',
          'Nie próbujesz niczego zmienić, rozluźnić ani „przepracować”. Zbierasz surowe dane w poczuciu bezpieczeństwa, z lekką ciekawością, a czasem nawet z humorem.',
        ],
        quote: 'Nie naprawiasz ciała. Testujesz stabilność układu.',
      },
      {
        heading: 'Jak praktykować',
        bullets: [
          'Usiądź lub połóż się wygodnie. Wybierz czas – na początek 1–3 minuty wystarczą.',
          'Znajdź doznanie i opisuj je neutralnie: „ciepłe”, „twarde”, „rozlewa się w lewo”.',
          'Dodawaj przypomnienia o bezpieczeństwie: „badania są czyste, to sygnał z mózgu, nie uszkodzenie”.',
          'Gdy pojawi się lęk lub chęć ucieczki – zauważ to bez oceny i wróć do obserwacji.',
          'Po sesji oceń reakcję układu nerwowego, a nie natężenie bólu.',
        ],
      },
      {
        heading: 'Czego unikać',
        paragraphs: [
          'Zachowania ochronne wysyłają mózgowi wiadomość „jest zagrożenie” i podtrzymują alarm:',
        ],
        bullets: [
          'agresywny stretching, rolowanie „aż zaboli”, rozciąganie na siłę,',
          'paniczne sprawdzanie zakresu ruchu („czy już mogę skręcić szyję?”),',
          'skanowanie ciała co kilka minut i porównywanie z wczoraj,',
          'pośpiech i walka: „ma minąć, natychmiast”.',
        ],
      },
      {
        heading: 'Błąd predykcji (prediction error)',
        paragraphs: [
          'Mózg nie odbiera bólu biernie – przewiduje go. Jeśli nauczył się, że dany ruch lub sytuacja są groźne, generuje ból jako ochronę, zanim pojawi się jakiekolwiek realne zagrożenie.',
          'Kiedy doświadczasz doznania bez paniki, mózg dostaje dane sprzeczne ze swoją prognozą. To właśnie błąd predykcji – sygnał do aktualizacji modelu. Każda spokojna sesja to korekcyjne doświadczenie, które stopniowo wygasza alarm.',
          'Dlatego aplikacja nie pyta o ból w skali 1–10. Liczy się to, czy obserwowałeś spokojnie, z niecierpliwością, czy w trybie walki – bo to ta reakcja uczy mózg bezpieczeństwa.',
        ],
      },
    ],
  },
  {
    id: 'levels',
    tab: 'Nurty',
    title: 'Poziomy pracy',
    subtitle: 'Kontekst kliniczny PRT',
    color: '#34506B',
    botanical: 'bloom',
    blocks: [
      {
        heading: 'Uproszczona mapa',
        paragraphs: [
          'Poniższy podział na dwa poziomy to robocza mapa, a nie formalna klasyfikacja psychoterapii. Pomaga zrozumieć, co która praca zmienia i gdzie w tym wszystkim jest PRT.',
        ],
      },
      {
        heading: '1. poziom – praca objawowa (fale CBT)',
        paragraphs: [
          'Nurty skupione na redukcji objawu i cierpienia tu i teraz. Są ustrukturyzowane, krótkoterminowe i dobrze przebadane.',
        ],
        bullets: [
          'I fala – terapia behawioralna: ekspozycja, wygaszanie reakcji lękowych, zmiana zachowań.',
          'II fala – terapia poznawcza (CBT): praca z myślami katastroficznymi i przekonaniami o ciele.',
          'III fala – ACT, mindfulness, terapia współczucia (CFT): zmiana relacji z doznaniem zamiast walki z nim.',
        ],
      },
      {
        heading: '2. poziom – praca strukturalna / wglądowa',
        paragraphs: [
          'Nurty psychodynamiczne i ericksonowskie oraz praca z traumą rozwojową sięgają głębiej – do tego, skąd wziął się bazowy poziom czujności układu nerwowego.',
          'Wczesnodziecięcy stres relacyjny – dom pełen konfliktów, depresja lub emocjonalna niedostępność rodzica, konieczność bycia „grzecznym” i czujnym – uczy układ nerwowy hiperczujności. To była mądra adaptacja: stałe skanowanie otoczenia chroniło dziecko. W dorosłości ten sam system może wciąż działać w trybie obronnym i interpretować neutralne sygnały z ciała jako zagrożenie.',
        ],
      },
      {
        heading: 'Gdzie w tym jest PRT i ból neuroplastyczny',
        paragraphs: [
          'PRT działa jak pomost. Metodą jest bliżej 1. poziomu – to ustrukturyzowana ekspozycja na doznanie połączona z ponowną oceną zagrożenia. Celem sięga jednak głębiej: uczy automatyczne, podkorowe struktury mózgu (pień mózgu, układ limbiczny) bezpieczeństwa na poziomie fizjologicznym, a nie tylko intelektualnym.',
          'Zdjęcie objawu somatycznego zmniejsza ciągłe pobudzenie obronne. Często otwiera to przestrzeń do spokojniejszej pracy 2. poziomu. Jeśli podczas praktyki wypływa dużo emocji lub wspomnień, warto mieć przy sobie terapeutę.',
          'W randomizowanym badaniu Boulder Back Pain Study (Ashar i in., JAMA Psychiatry, 2022) około dwie trzecie osób z przewlekłym bólem pleców po 4 tygodniach PRT nie miało bólu lub prawie go nie odczuwało.',
        ],
      },
    ],
  },
  {
    id: 'sensitization',
    tab: 'Sensytyzacja',
    title: 'Sensytyzacja ośrodkowa',
    subtitle: 'Gdy alarm jest za czuły',
    color: '#8C7A6B',
    botanical: 'fern',
    blocks: [
      {
        heading: 'Co to jest',
        paragraphs: [
          'Sensytyzacja ośrodkowa (central sensitization) to stan, w którym ośrodkowy układ nerwowy wzmacnia przetwarzanie sygnałów z ciała. Alarm ma podkręconą czułość: zwykły ucisk, napięcie czy zmęczenie mięśni zaczynają być odczuwane jako ból.',
          'Od 2017 roku IASP opisuje taki ból jako nociplastyczny – wynikający ze zmienionego przetwarzania sygnałów, bez wyraźnych dowodów uszkodzenia tkanek, które by go tłumaczyło.',
        ],
      },
      {
        heading: 'Dlaczego ból wędruje',
        paragraphs: [
          'Szyja → łopatki → prostowniki → pośladek. Uszkodzenie mechaniczne jest lokalne i przewidywalne. Alarm generowany centralnie może natomiast „przeskakiwać”, bo to mózg decyduje, gdzie uruchomić ochronę.',
          'Rezonans i RTG bywają czyste, a nawet jeśli pokazują zmiany zwyrodnieniowe, często nie tłumaczą bólu. W dużym przeglądzie (Brinjikji i in., 2015) zwyrodnienie dysków stwierdzano u około 37% osób bez bólu w wieku 20 lat i u 96% w wieku 80 lat.',
        ],
      },
      {
        heading: 'Uszkodzenie mechaniczne',
        bullets: [
          'wyraźny uraz lub przeciążenie na początku,',
          'stała lokalizacja, ból zależny od obciążenia,',
          'poprawa zgodna z gojeniem tkanek (tygodnie),',
          'mały wpływ stresu i kontekstu.',
        ],
      },
      {
        heading: 'Alarm nociplastyczny',
        bullets: [
          'początek bez urazu albo utrzymywanie się długo po wygojeniu,',
          'zmienna, wędrująca lokalizacja, często symetryczna,',
          'nasilenie przy stresie, oczekiwaniu bólu, skupieniu na nim,',
          'ulga, gdy jesteś zaabsorbowany, zrelaksowany lub na urlopie,',
          'nieproporcjonalna reakcja na lekki ruch czy dotyk.',
        ],
      },
      {
        heading: 'Bezpieczeństwo przede wszystkim',
        paragraphs: [
          'Treści w aplikacji mają charakter edukacyjny i nie zastępują diagnozy. Zanim uznasz ból za neuroplastyczny, wyklucz z lekarzem przyczyny strukturalne. Nowe objawy neurologiczne (drętwienie krocza, osłabienie nóg, zaburzenia oddawania moczu), gorączka czy niewyjaśniona utrata masy ciała zawsze wymagają konsultacji.',
        ],
      },
    ],
  },
];
