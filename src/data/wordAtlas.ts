import type { Locale } from "@/lib/locale";

/**
 * Snapshot of the Wordkeep "Atlas" — a semantic network of saved vocabulary.
 * Pulled from wordkeep-zeta.vercel.app/api/graph and frozen here so the portfolio
 * stays dependency- and request-free. The live 3D version is linked from the
 * component.
 */
export const WORDKEEP_URL = "https://wordkeep-zeta.vercel.app";
export const WORDKEEP_GRAPH_URL = "https://wordkeep-zeta.vercel.app/graph";

export type AtlasRelation = "syn" | "ant" | "tr" | "rel";
export type AtlasLang = "en" | "es" | "fr" | "de";
export type AtlasNode = { label: string; lang: AtlasLang };
export type AtlasEdge = readonly [source: number, target: number, relation: AtlasRelation];

export const WORD_ATLAS: { nodes: readonly AtlasNode[]; edges: readonly AtlasEdge[] } = {
  nodes: [
    { label: "happy", lang: "en" },
    { label: "glad", lang: "en" },
    { label: "joyful", lang: "en" },
    { label: "cheerful", lang: "en" },
    { label: "sad", lang: "en" },
    { label: "unhappy", lang: "en" },
    { label: "hot", lang: "en" },
    { label: "warm", lang: "en" },
    { label: "cold", lang: "en" },
    { label: "chilly", lang: "en" },
    { label: "big", lang: "en" },
    { label: "large", lang: "en" },
    { label: "small", lang: "en" },
    { label: "tiny", lang: "en" },
    { label: "light", lang: "en" },
    { label: "bright", lang: "en" },
    { label: "dark", lang: "en" },
    { label: "dim", lang: "en" },
    { label: "love", lang: "en" },
    { label: "adore", lang: "en" },
    { label: "hate", lang: "en" },
    { label: "fast", lang: "en" },
    { label: "quick", lang: "en" },
    { label: "slow", lang: "en" },
    { label: "begin", lang: "en" },
    { label: "start", lang: "en" },
    { label: "end", lang: "en" },
    { label: "finish", lang: "en" },
    { label: "know", lang: "en" },
    { label: "learn", lang: "en" },
    { label: "feliz", lang: "es" },
    { label: "alegre", lang: "es" },
    { label: "triste", lang: "es" },
    { label: "caliente", lang: "es" },
    { label: "frío", lang: "es" },
    { label: "grande", lang: "es" },
    { label: "pequeño", lang: "es" },
    { label: "amor", lang: "es" },
    { label: "odio", lang: "es" },
    { label: "heureux", lang: "fr" },
    { label: "joyeux", lang: "fr" },
    { label: "malheureux", lang: "fr" },
    { label: "chaud", lang: "fr" },
    { label: "froid", lang: "fr" },
    { label: "grand", lang: "fr" },
    { label: "petit", lang: "fr" },
    { label: "amour", lang: "fr" },
    { label: "haine", lang: "fr" },
    { label: "glücklich", lang: "de" },
    { label: "traurig", lang: "de" },
    { label: "heiß", lang: "de" },
    { label: "kalt", lang: "de" },
    { label: "groß", lang: "de" },
    { label: "klein", lang: "de" },
    { label: "Liebe", lang: "de" },
    { label: "Hass", lang: "de" },
  ],
  edges: [
    [0, 1, "syn"], [0, 2, "syn"], [0, 3, "syn"], [0, 4, "ant"], [0, 5, "ant"], [0, 18, "rel"],
    [1, 2, "syn"], [1, 4, "ant"], [2, 3, "syn"], [2, 4, "ant"], [3, 5, "ant"], [4, 5, "syn"],
    [4, 20, "rel"], [6, 7, "syn"], [6, 8, "ant"], [6, 9, "ant"], [7, 8, "ant"], [7, 9, "ant"],
    [8, 9, "syn"], [10, 11, "syn"], [10, 12, "ant"], [10, 13, "ant"], [11, 12, "ant"],
    [11, 13, "ant"], [12, 13, "syn"], [14, 15, "syn"], [14, 16, "ant"], [14, 17, "ant"],
    [15, 16, "ant"], [15, 17, "ant"], [16, 17, "syn"], [18, 19, "syn"], [18, 20, "ant"],
    [19, 20, "ant"], [21, 22, "syn"], [21, 23, "ant"], [22, 23, "ant"], [24, 25, "syn"],
    [24, 26, "ant"], [24, 27, "ant"], [25, 26, "ant"], [25, 27, "ant"], [26, 27, "syn"],
    [28, 29, "rel"], [30, 31, "syn"], [30, 32, "ant"], [30, 37, "rel"], [31, 32, "ant"],
    [33, 34, "ant"], [35, 36, "ant"], [37, 38, "ant"], [39, 40, "syn"], [39, 41, "ant"],
    [39, 46, "rel"], [40, 41, "ant"], [42, 43, "ant"], [44, 45, "ant"], [46, 47, "ant"],
    [48, 49, "ant"], [48, 54, "rel"], [50, 51, "ant"], [52, 53, "ant"], [54, 55, "ant"],
    [0, 30, "tr"], [0, 39, "tr"], [0, 48, "tr"], [4, 32, "tr"], [4, 41, "tr"], [4, 49, "tr"],
    [6, 33, "tr"], [6, 42, "tr"], [6, 50, "tr"], [8, 34, "tr"], [8, 43, "tr"], [8, 51, "tr"],
    [10, 35, "tr"], [10, 44, "tr"], [10, 52, "tr"], [12, 36, "tr"], [12, 45, "tr"],
    [12, 53, "tr"], [18, 37, "tr"], [18, 46, "tr"], [18, 54, "tr"], [20, 38, "tr"],
    [20, 47, "tr"], [20, 55, "tr"], [30, 39, "tr"], [30, 48, "tr"], [39, 48, "tr"],
  ],
};

export const ATLAS_STATS = {
  words: WORD_ATLAS.nodes.length,
  links: WORD_ATLAS.edges.length,
  languages: 4,
  byRelation: WORD_ATLAS.edges.reduce(
    (acc, [, , r]) => ({ ...acc, [r]: (acc[r] ?? 0) + 1 }),
    {} as Record<AtlasRelation, number>,
  ),
};

type AtlasCopy = {
  heading: string;
  lede: string;
  open: string;
  visit: string;
  hint: string;
  rel: Record<AtlasRelation, string>;
};

export const ATLAS_COPY: Record<Locale, AtlasCopy> = {
  en: {
    heading: "The Atlas",
    lede: "A live slice of my other project, Wordkeep: saved vocabulary wired together by sense. Drag a word to move it, tap or click one to read its links; open the full 3D map on Wordkeep.",
    open: "Open the 3D atlas",
    visit: "Visit Wordkeep",
    hint: "56 words · 90 links · 4 languages",
    rel: { syn: "synonym", ant: "antonym", tr: "translation", rel: "related" },
  },
  es: {
    heading: "El Atlas",
    lede: "Un trozo en vivo de mi otro proyecto, Wordkeep: vocabulario guardado conectado por significado. Arrastra una palabra para moverla, tócala o haz clic para ver sus enlaces; abre el mapa 3D completo en Wordkeep.",
    open: "Abrir el atlas 3D",
    visit: "Ir a Wordkeep",
    hint: "56 palabras · 90 enlaces · 4 idiomas",
    rel: { syn: "sinónimo", ant: "antónimo", tr: "traducción", rel: "relacionada" },
  },
  ca: {
    heading: "L'Atles",
    lede: "Un tall en directe del meu altre projecte, Wordkeep: vocabulari desat connectat pel sentit. Arrossega una paraula per moure-la, toca-la o clica-hi per veure'n els enllaços; obre el mapa 3D complet a Wordkeep.",
    open: "Obre l'atles 3D",
    visit: "Vés a Wordkeep",
    hint: "56 paraules · 90 enllaços · 4 llengües",
    rel: { syn: "sinònim", ant: "antònim", tr: "traducció", rel: "relacionada" },
  },
  it: {
    heading: "L'Atlante",
    lede: "Una fetta live del mio altro progetto, Wordkeep: vocaboli salvati collegati per significato. Trascina una parola per spostarla, toccala o cliccala per leggerne i legami; apri la mappa 3D completa su Wordkeep.",
    open: "Apri l'atlante 3D",
    visit: "Vai a Wordkeep",
    hint: "56 parole · 90 collegamenti · 4 lingue",
    rel: { syn: "sinonimo", ant: "contrario", tr: "traduzione", rel: "correlata" },
  },
  pt: {
    heading: "O Atlas",
    lede: "Uma fatia ao vivo do meu outro projeto, Wordkeep: vocabulário guardado ligado pelo sentido. Arrasta uma palavra para a mover, toca-lhe ou clica para ver as ligações; abre o mapa 3D completo no Wordkeep.",
    open: "Abrir o atlas 3D",
    visit: "Ir para Wordkeep",
    hint: "56 palavras · 90 ligações · 4 línguas",
    rel: { syn: "sinónimo", ant: "antónimo", tr: "tradução", rel: "relacionada" },
  },
  de: {
    heading: "Der Atlas",
    lede: "Ein Live-Ausschnitt aus meinem anderen Projekt Wordkeep: gespeicherte Vokabeln, über Bedeutung verknüpft. Ziehe ein Wort, um es zu verschieben, tippe oder klicke, um seine Kanten zu sehen; die volle 3D-Karte gibt es auf Wordkeep.",
    open: "3D-Atlas öffnen",
    visit: "Zu Wordkeep",
    hint: "56 Wörter · 90 Kanten · 4 Sprachen",
    rel: { syn: "Synonym", ant: "Gegenteil", tr: "Übersetzung", rel: "verwandt" },
  },
  fr: {
    heading: "L’Atlas",
    lede: "Une tranche en direct de mon autre projet, Wordkeep : du vocabulaire enregistré, relié par le sens. Faites glisser un mot pour le déplacer, touchez-le ou cliquez dessus pour lire ses liens ; ouvrez la carte 3D complète sur Wordkeep.",
    open: "Ouvrir l’atlas 3D",
    visit: "Voir Wordkeep",
    hint: "56 mots · 90 liens · 4 langues",
    rel: { syn: "synonyme", ant: "antonyme", tr: "traduction", rel: "apparenté" },
  },
};
