export const seedEntries = [
  {
    id: "moonbase",
    name: "moonbase.fm",
    url: "moonbase.fm",
    pitch: "Music discovery for people allergic to playlists made by committees.",
    category: "Creative chaos",
    bid: 428,
    clicks: "18.7k",
  },
  {
    id: "tinywins",
    name: "tinywins.club",
    url: "tinywins.club",
    pitch: "The group chat that makes making progress feel embarrassingly fun.",
    category: "Maker stuff",
    bid: 311,
    clicks: "12.1k",
  },
  {
    id: "404museum",
    name: "404museum",
    url: "404museum.xyz",
    pitch: "A surprisingly tender archive of every beautiful thing the web accidentally deleted.",
    category: "Internet lore",
    bid: 240,
    clicks: "9.4k",
  },
  {
    id: "hotplate",
    name: "hotplate",
    url: "hotplate.city",
    pitch: "The map that tells you exactly what one dish you should leave the house for.",
    category: "Future food",
    bid: 129,
    clicks: "6.8k",
  },
  {
    id: "goodweird",
    name: "goodweird",
    url: "goodweird.studio",
    pitch: "Brand identities for ideas that refuse to sit still and behave.",
    category: "Creative chaos",
    bid: 88,
    clicks: "5.2k",
  },
  {
    id: "onehour",
    name: "onehour.page",
    url: "onehour.page",
    pitch: "A friendly little timer that makes landing pages before lunch.",
    category: "Maker stuff",
    bid: 57,
    clicks: "3.1k",
  },
  {
    id: "allcaps",
    name: "allcaps",
    url: "allcaps.party",
    pitch: "An emergency broadcast system for the jokes you cannot text in lowercase.",
    category: "Internet lore",
    bid: 33,
    clicks: "2.8k",
  },
  {
    id: "miso",
    name: "miso.monday",
    url: "miso.monday",
    pitch: "A very opinionated guide to eating yourself out of a bad mood.",
    category: "Future food",
    bid: 19,
    clicks: "1.5k",
  },
];

export const seedActivity = [
  { id: "defended", time: "JUST NOW", copy: "moonbase.fm defended the penthouse from a very serious rival.", rank: "#1 HOLDS", up: true },
  { id: "tinywins", time: "2 MIN", copy: "tinywins.club jumped four places with a small but mighty flex.", rank: "↑ #2", up: true },
  { id: "museum", time: "6 MIN", copy: "404museum arrived and made the board feel suspiciously nostalgic.", rank: "NEW #3", up: false },
  { id: "hotplate", time: "11 MIN", copy: "hotplate raised the stakes, then probably went for noodles.", rank: "↑ #4", up: true },
  { id: "goodweird", time: "18 MIN", copy: "goodweird is now impossible to explain at dinner, in a good way.", rank: "#5", up: false },
];

export const claimCategories = ["Maker stuff", "Creative chaos", "Internet lore", "Future food"];

export const categories = ["All", ...claimCategories];
