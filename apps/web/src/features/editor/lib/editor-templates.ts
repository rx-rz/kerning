import { createDefaultTextureFill } from "#/features/editor/lib/card-fill";
import type {
  CardAspectRatio,
  CardSettings,
  EditorCard,
  EditorNode,
  FontType,
  ImageNode,
  ShapeNode,
  TextNode,
  TextureCardFill,
} from "#/features/editor/types";

export type EditorTemplate = {
  id: string;
  name: string;
  category:
    | "Album covers"
    | "Movie posters"
    | "Business cards"
    | "Typography specimens"
    | "Pitch decks";
  aspectRatio: CardAspectRatio;
  card: EditorCard;
};

type TemplateSpec = {
  title: string;
  subtitle: string;
  background: string;
  secondary: string;
  texture: string;
  ink: string;
  accent: string;
};

const PORTRAITS = [
  "2a22e4e6-89d3-4874-a008-6a71ff2eab16",
  "a9473f87-9e71-471f-a8e3-3123afe1c11b",
  "422b202a-bf7e-4053-97d0-422ded6a8165",
  "71eebb90-df11-4b53-8e44-da186c2b3196",
  "1de06cc3-ba0d-4d5e-9a7e-8765ec96f000",
  "c5bf3870-2cbc-4134-93ce-b5dd892f9d5f",
  "d2d1dc93-8399-4188-bbca-9ae6344417a4",
  "47c02d7f-7519-4f61-a194-2131a48dd576",
  "ec9f0f05-9b5c-4706-ac70-d154d9b06f38",
  "433cee80-07fa-4830-afc3-283ce7106711",
  "8bbe2b05-2462-48d8-9f4c-45f656523a24",
  "843177f8-3d9a-42fc-9720-09cb3b47194c",
  "269067c0-641a-4463-9c91-ca0a270f0be3",
  "eeda8280-80e0-4b16-a71c-5364bcf34d85",
  "22f3e8f7-e5da-40ea-9f62-507eb4db0291",
  "d3390ad0-8fb1-4416-87a7-d109d31e26ca",
  "8187d1ce-ed88-445c-9f58-1ad08e613e66",
  "b56bc46b-33ba-4257-b85c-473485282640",
  "a82e5f09-65e8-4eb0-8c40-d35876dc994e",
  "7ab70d75-b7f9-4abb-9e1a-91f61922d139",
  "023e2a1f-238d-444a-a2ba-f7a76ef8864b",
  "62c21481-87df-43c0-a100-92fbeb48ae55",
  "9478fa0f-b3d4-4aad-894b-2d793f90be42",
  "d8324d85-87d9-4cae-8c63-3c803db3a48c",
  "d649f130-ab7b-4fa4-87fd-0f9dce8754d3",
  "131f6aae-6ba6-482b-bb7f-1fcb718f5b02",
  "72d86d95-456f-4a6b-b63f-59331a35bb67",
  "9af121f9-de12-44b8-95c2-1c06bdca7ad7",
  "e8479336-e98c-41fa-9db9-5a6303971fcd",
  "a02d87c0-83ec-425b-8e39-52ace2060911",
  "67669f1f-d2a4-4230-aa8c-137aa0d15dc5",
  "dff6d38b-5d58-43eb-853a-5835f2617103",
  "65358b06-de85-4ac0-86ac-461e723dba2c",
  "ac63c618-41c7-4326-9410-01d2ed33f5c4",
  "a5c89afd-0967-44b1-b974-366c348cf7b6",
  "ac2a433b-41d2-41a4-91bf-eaa3df53f54f",
  "979fddfe-9a8b-4e4d-811d-333a7fcbdb83",
  "5561189a-578a-4a21-b8ca-bd9bbf525154",
  "e6023edc-5dc4-435e-9e35-13a7e1e4225e",
  "6df2af09-f221-4244-8f55-eeffe68d6a96",
].map((id) => `https://cdn.cosmos.so/${id}?format=webp&w=400`);

const OBJECTS = [
  "93eedbb2-fe16-43a1-8b5a-2f3c2df97d72",
  "bb97c1d6-cecb-4669-9c01-f942bd1d58a9",
  "8a33e0a6-cf83-4b0c-9795-14cc3c80417a",
  "b4a1d79c-f3d8-48cf-ac6b-9f64dc260914",
  "6467c211-3927-45de-bfeb-01b6426c64ee",
  "61e9c32b-2c6f-4cdc-9d58-6dcb7fe6cd7f",
  "156e0b83-8ee0-4978-bc49-1d1e4a67422b",
  "c4a74274-6b12-419e-abb8-fd016b1ed056",
  "99a1e9a0-064c-445c-aa2e-f0e08fc4d7ab",
  "bea8b8af-0a6a-48c3-8a1f-977be376b4b1",
  "2f94d1d6-f514-44fa-9560-b85e9daef576",
  "337a198f-0bc1-4c9d-bca4-cd5ddaf39d5e",
  "aead85b8-3d97-4734-8fd1-f629839da963",
  "1ae65e48-c058-49d4-9127-fad8f9c32210",
  "669b7431-af28-486f-b1e6-c531b6a7d572",
  "b88915c2-ebf0-4505-85d2-6a24e74c8aa7",
  "fc29c831-c54b-4451-b2f6-46e2bc4f40e1",
  "5136cedb-9f91-40a4-93b0-fa8ae5c23634",
  "025217ea-c563-427b-beba-3799a473f5c6",
  "a196c7d5-ed3a-4e9c-8aec-e5c6e3c90e99",
  "69fa5555-7a08-4d2f-9ba1-3a5fa028bec9",
  "38550029-e193-471d-af0c-f3cc0009e5a1",
  "23e80f91-c10f-41e3-8845-d210f520011f",
  "9edab0d5-71cf-44b7-b223-b5ba55dfc338",
  "d04bf126-953c-47a9-8401-19a017a28693",
  "d135a3ef-7dd3-420f-96a4-cfa8d88e6b58",
  "f1721aab-0f58-4ad6-bbd3-5e01f83b5af1",
  "a30d1537-462e-4a25-9537-36428016ceca",
  "27997674-76a2-4ba0-bc80-b1680f8e80ff",
  "ce70b586-1694-45e8-b7a2-d20c4a997589",
  "0be4aa6a-5541-4c7d-b4db-10bf0156b16a",
  "a777c218-4bfe-41ba-a2ae-5d8e2262389b",
  "696bbcbf-c34f-46b6-8fd0-206a38a63503",
  "1254a064-6edf-488d-b993-b19b92cb2c16",
  "8b72c915-2ff8-47d0-b2e8-d2fb3a28cae8",
  "b5256fd6-974e-45ce-a020-dd668ad2524e",
  "9af90a14-2b0f-4ea9-98e8-24ea971a2de5",
  "dc800dd2-1cfb-43b9-a7e8-2a973d0accb6",
  "e6402bd1-e918-4b1e-8478-63d576f65de1",
  "cb3b1994-f668-4a12-a9e8-d0744c07ccf5",
].map((id) => `https://cdn.cosmos.so/${id}?format=webp&w=400`);

const TEXTURES = [
  "26907ff0-66ae-415b-8265-0abcc796f49b",
  "76439e62-783a-4e56-975c-403ec4aa0e56",
  "9519a695-f156-492b-9cb2-6e47d77c9fe3",
  "03ba2fb8-a4bf-489b-a0cb-17926b234865",
  "f868fc3d-ec1b-4d7d-8bd9-74092fbb9798",
  "e66b2490-8047-46c3-99a1-c0cdcc736281",
  "79c1be79-dda5-497e-b877-99d1006e17f9",
  "7d2a3600-1755-4431-a699-08779484d612",
  "bbcf1735-0ae7-4464-87bd-8548505acd2b",
  "0e13e286-e9d5-4bcc-abcf-5f5ab9a20709",
  "0473c375-3aec-4b3f-afc1-dfbb226aa302",
  "e8cd52b8-527f-4375-b0ea-0f19502e6a26",
  "a04e2d05-0b8b-455d-9b67-b278d4ae8973",
  "89a2b131-de0f-42a2-821d-708a72409d72",
  "d241359c-67aa-46e9-a191-dd10b09d400f",
  "c647640f-f0a1-40fb-9dff-24845f2f7796",
  "7b8a46f2-3d47-4aa5-83fc-61f068c22e4e",
  "04be0b5d-c5d6-46ea-99c5-19163eb120b0",
  "16bb9c6a-eecf-4556-a756-749622a37a51",
  "a3389094-6153-4fed-aebe-76e61d06b974",
].map((id) => `https://cdn.cosmos.so/${id}?format=webp&w=400`);

const ALBUM_META = [
  ["brat", "CHARLI XCX", "#EAFD38", "#111111"],
  ["VELVET STATIC", "MARA / 02", "#F4EBDD", "#D42E24"],
  ["OBJECTS IN MIRROR", "NEON PRAIRIE", "#E8E3D7", "#161616"],
  ["AFTER THE GARDEN", "AERIAL FORM", "#F3D7DC", "#183C2E"],
  ["NO SAINTS", "BLK CHOIR", "#111111", "#F2F0E8"],
  ["BLUE CEREMONY", "PARALLEL YOUTH", "#2447BD", "#F4E8C5"],
  ["FOLD / UNFOLD", "SOFT MACHINE", "#F4F0E8", "#EC4B2D"],
  ["NIGHT BOTANICA", "MIRA VALE", "#112D25", "#E9FF70"],
  ["DUST LANGUAGE", "PUBLIC MEMORY", "#CBBBA5", "#231E19"],
  ["THE BODY ELECTRIC", "KINO 04", "#FF5A36", "#251761"],
  ["SILVER TEETH", "LUCIA NINE", "#D9D9D3", "#121212"],
  ["OPEN WINDOWS", "COMMON FIELD", "#B9D8EF", "#E53F25"],
  ["ROSE INDEX", "ANNA K", "#F1C7CD", "#761C28"],
  ["TWIN FLAME", "VANTA", "#111111", "#F22F47"],
  ["HALF LIGHT", "NORTH / 00", "#E7E1D6", "#304C89"],
  ["HEAVY PETALS", "ORBITAL UNIT", "#EBD8A4", "#412B76"],
  ["SLOW BURN", "PALM HOUSE", "#232FA3", "#FFB348"],
  ["STRANGE WEATHER", "LURA", "#DDE5DF", "#C3262E"],
  ["OUTSIDE / IN", "MONO CLUB", "#101010", "#FF9EB5"],
  ["BLOOMING NOISES", "TRACIN", "#EFE7D2", "#B72D2E"],
] as const;

const POSTER_META = [
  ["SILVER EXIT", "THE ROAD REMEMBERS", "#E7E8E8", "#101112"],
  ["DUSK COUNTRY", "EVEN THE MOUNTAINS FORGET", "#F1EEE7", "#11110F"],
  ["A SOFT VIOLENCE", "BEAUTY LEAVES A MARK", "#F2EEE5", "#D62426"],
  ["FAULT COLOUR", "SOME TRUTHS ARRIVE BRIGHT", "#F07845", "#0C1512"],
  ["THE QUIET MOUTH", "SHE KEPT THE SHARPEST SILENCE", "#F2F2F0", "#17171A"],
  ["FEVER SAINT", "HOLINESS HAS A TEMPERATURE", "#EFE5D7", "#AD2727"],
  ["COLD ANIMAL", "LOVE WITHOUT WITNESSES", "#F4F0E6", "#121212"],
  ["THE GILDED HOUR", "EVERY FAVOR LEAVES A BRUISE", "#EDE1CC", "#725B32"],
  ["NINE WINDOWS", "SOMEONE IS ALWAYS AWAKE", "#F4F1EA", "#121212"],
  ["RED DESERT", "THE DUST KNOWS HER NAME", "#B92328", "#F6E8D2"],
  ["VÉRONIQUE", "NOTHING STAYS BURIED IN LIGHT", "#E4EAE8", "#152A31"],
  ["THE ORNAMENT", "BEAUTY IS NEVER INNOCENT", "#F0ECE4", "#141414"],
  ["NOTHING TWICE", "MEMORY REFUSES THE SECOND TAKE", "#F3F2ED", "#111111"],
  ["ZERO HOUR", "MIDNIGHT ARRIVED EARLY", "#D6DB2C", "#171717"],
  ["MIRROR STATE", "SHE WOKE UP ON BOTH SIDES", "#DCD6CF", "#2E2393"],
  ["WHITE NOISE", "SILENCE HAS TEETH", "#F4F4EF", "#151515"],
  ["A SMALL FIRE", "WINTER KEPT THE ASHES", "#331B18", "#FF765A"],
  ["SOMEWHERE NORTH", "NO MAP SURVIVES THE COLD", "#B9D2E4", "#19233C"],
  ["LAST FREQUENCY", "THE DEAD AIR IS LISTENING", "#111111", "#D8FF43"],
  ["SEASON OF GLASS", "EVERY BLOOM HIDES A WOUND", "#EFE8D5", "#183C2E"],
] as const;

const BUSINESS_CARD_META = [
  ["Contour Studio", "Amara Okoye — Creative Director", "#E8E5DE", "#272623"],
  ["Aperture Works", "Mika Chen — Architect", "#D9DEDA", "#26302C"],
  ["Bureau Form", "Noah Williams — Designer", "#E1DDD4", "#2C2925"],
  ["Noma Objects", "Leila Haddad — Founder", "#DDD6CE", "#332C28"],
  ["Parallel Practice", "Ada Mensah — Strategist", "#2349FF", "#F6F3E9"],
  ["Matter & Method", "Theo Martin — Art Director", "#161616", "#F3EFE7"],
  ["Soft Geometry", "Yuki Sato — Spatial Designer", "#F4CFD8", "#371D29"],
  ["North Assembly", "Eli Brooks — Partner", "#D8D6CE", "#142F23"],
  ["Monument Office", "Sofia Rossi — Architect", "#F2EBDD", "#BA3A24"],
  ["Studio Index", "Ife Adebayo — Consultant", "#F6F4EE", "#101010"],
] as const;

const PITCH_DECK_META = [
  [
    "A new material language",
    "Contour — Company deck 2026",
    "#4A5CFF",
    "#FFFFFF",
  ],
  [
    "Spaces for clearer thinking",
    "Aperture — Architecture practice",
    "#E7E0D2",
    "#171717",
  ],
  ["The future is tactile", "Matter — Seed round", "#D7FF43", "#111111"],
  [
    "Built to bend, not break",
    "Parallel — Product strategy",
    "#101010",
    "#F5F2EA",
  ],
  ["Light changes everything", "Lumen — Brand platform", "#F4C9D1", "#431F2B"],
  ["Progress, made visible", "North — Annual report", "#F36A43", "#151515"],
  ["A quieter kind of technology", "Still — Series A", "#D9E8E4", "#17302B"],
  ["Form follows feeling", "Noma — Creative proposal", "#2D46C7", "#F4EFD9"],
  ["Building common ground", "Civic — Partnership deck", "#EEE7D8", "#A52F22"],
  ["Ideas need room", "Field Office — Capabilities", "#E1E1DC", "#151515"],
] as const;

const NEW_PITCH_DECK_META = [
  [
    "Axiom Grid",
    "The operating system that turns fragmented energy data into investable decisions.",
    "Maya Chen · Founder & CEO · July 2026",
    "#E8E4DA",
    "#171715",
  ],
  [
    "Commonplace",
    "AI-native procurement that gives growing teams enterprise purchasing power.",
    "Daniel Okafor · Co-founder · July 2026",
    "#D7E5E1",
    "#17302B",
  ],
  [
    "Northstar Health",
    "Continuous care infrastructure for the people traditional clinics miss.",
    "Leila Morgan · CEO · July 2026",
    "#E9DADF",
    "#3A2028",
  ],
  [
    "Demand is accelerating",
    "Teams processed $18.4M through the platform this quarter, up 3.2× year over year. Expansion revenue now represents 41% of new ARR, demonstrating that the product grows naturally with customer complexity.",
    "18.4M volume · 3.2× YoY · 41% expansion ARR",
    "#D9FF37",
    "#151515",
  ],
  [
    "One platform. Every signal.",
    "Our workflow replaces disconnected research, spreadsheets, and approval chains with a shared decision layer. Customers reach a confident answer faster while preserving the context and controls required by their teams.",
    "Unified inputs · Explainable outputs · Enterprise controls",
    "#FF4C21",
    "#151515",
  ],
  [
    "A market moving our way",
    "Regulatory pressure, rising operating costs, and better data access are moving this category from optional tooling to core infrastructure. We enter through one urgent workflow, prove measurable value within weeks, and expand across adjacent teams as customers consolidate vendors and standardize decisions on our platform.",
    "$24B serviceable market · 14% CAGR · Clear expansion path",
    "#6236FF",
    "#F7F3E8",
  ],
  [
    "Capital turns traction into scale",
    "This round funds the repeatable growth engine already visible in our strongest customer segments. We will deepen the product moat, expand enterprise sales capacity, and reach break-even with disciplined hiring. Milestone-based deployment keeps spending aligned with retention, pipeline conversion, and gross-margin improvement.",
    "48% product · 37% go-to-market · 15% operations",
    "#00D6C8",
    "#112927",
  ],
  [
    "Small teams deserve big leverage",
    "Orbit gives independent studios a playful but rigorous workspace for planning, pricing, and delivering client work. Early cohorts complete projects 27% faster, retain more margin, and reduce status meetings without adding administrative headcount. The result is a healthier operating model for a large, underserved customer base.",
    "27% faster delivery · 11 hours saved weekly · 92% retention",
    "#FFD749",
    "#2B2040",
  ],
  [
    "Growth that compounds",
    "A product-led entry point creates efficient acquisition, while collaboration features pull entire teams into paid plans. Cohort retention strengthens after month three as customers consolidate more of their workflow. Expansion is driven by active seats, connected projects, and premium controls rather than contractual price increases.",
    "6.4× LTV:CAC · 8-month payback · 128% net retention",
    "#FF8FB7",
    "#33203A",
  ],
  [
    "Built by operators",
    "Our team combines deep category knowledge with experience scaling reliable software and global communities. We have lived the customer problem, shipped together before, and recruited leaders for the next stage. The founding group owns product, engineering, distribution, and the critical industry relationships required to execute.",
    "2 prior exits · 18 years domain experience · 11-person team",
    "#8DE0FF",
    "#173044",
  ],
] as const;

// Ten additional directions per template category, based on the supplied
// Cosmos search prompts. These titles are intentionally content-like so a
// freshly inserted template already reads as a finished piece.
const INSPIRED_ALBUM_META = [
  ["SIGNAL / BLOOM", "IONA VEX", "#FF4D00", "#F4F0E8"],
  ["A PALE HORIZON", "STILL ROOMS", "#D9D6F2", "#343246"],
  ["NO INPUT", "PUBLIC DAMAGE", "#E8E5DC", "#111111"],
  ["NIGHT IN AMBER", "THEO BLUE QUARTET", "#B95D35", "#F7EBD2"],
  ["LIQUID CIRCUIT", "NOVA SYSTEM", "#11141B", "#B9F7FF"],
  ["BORROWED SUMMER", "MOTEL RADIO", "#E8C9A5", "#4A2925"],
  ["MIND FLOWER", "PRISM CHILD", "#FF3DBB", "#FFF65A"],
  ["SONATA No. 7", "ELIAS MOREAU", "#E9E2D4", "#25231F"],
  ["LAGOS AFTER RAIN", "AYO KORA", "#F05A28", "#FFF0C2"],
  ["SIDE B / 03", "SOUTH BLOCK", "#171717", "#F3F0E8"],
] as const;

const INSPIRED_POSTER_META = [
  ["THE LAST ORANGE", "A FILM BY MIRA SEN", "#F1EEE5", "#151515"],
  ["BLACK TIDE", "EVERY SHADOW HAS A WITNESS", "#0C0D10", "#E8DCC8"],
  ["THE DISTANCE HOME", "AN ORDINARY LIFE, OBSERVED", "#D7D2C7", "#25231F"],
  ["ORBITAL", "WE WERE NEVER ALONE", "#101722", "#C8E8FF"],
  ["THE EMPTY ROOM", "SOMETHING HAS ALREADY ARRIVED", "#E9E7E1", "#191919"],
  ["SUNDAY, SOFTLY", "A LOVE STORY IN SMALL MOMENTS", "#EAC7C6", "#6D3037"],
  ["CLOSE ENOUGH", "TRUST THE WRONG FACE", "#E8E4DC", "#B3181E"],
  ["COMMON GROUND", "TEN VOICES. ONE STREET.", "#DDD8CC", "#172D29"],
  ["MATINÉE 68", "ONE SUMMER CHANGED THE PICTURE", "#E2B43C", "#272016"],
  ["THE WEIGHT OF AIR", "NOTHING IMPOSSIBLE STAYS STILL", "#B7D4E8", "#352660"],
] as const;

const INSPIRED_BUSINESS_CARD_META = [
  ["Raster Büro", "Nia Keller — Graphic Designer", "#F0EEE8", "#151515"],
  ["Type / Play", "Olu Femi — Creative Coder", "#FF5638", "#20185A"],
  ["Maison Élan", "Camille Laurent — Director", "#D8CDBF", "#362D27"],
  ["LOUD OFFICE", "Jude Park — Art Director", "#111111", "#F5F1E8"],
  ["Margin Notes", "Rina Bell — Editorial Designer", "#E8E1D4", "#31423A"],
  ["Good Trouble", "Maya Cole — Agency Founder", "#6C45FF", "#FFF36A"],
  ["Mono Studio", "Evan Lin — Independent Designer", "#F4F4F0", "#101010"],
  ["Atelier Rue", "Inès Morel — Fashion Director", "#171717", "#F2E9DE"],
  ["Kernel Works", "Tobi Adeyemi — Founder", "#D9E8E4", "#163832"],
  ["Section Office", "Lina Ortiz — Architect", "#C8C1B5", "#282623"],
] as const;

const INSPIRED_PITCH_DECK_META = [
  ["A better way forward", "Vela — Seed deck 2026", "#F2EFE7", "#181817"],
  ["Meet the new Atlas", "One product. One clear story.", "#F5F5F2", "#111111"],
  ["Money, made legible", "Ledgerly — Product narrative", "#635BFF", "#FFFFFF"],
  [
    "The insight is the strategy",
    "North & Co. — Growth thesis",
    "#E5E1D8",
    "#171717",
  ],
  ["A $24B opening", "Morrow — Investor presentation", "#D8FF3E", "#151515"],
  ["Work flows here", "Relay — SaaS platform overview", "#DCEAE7", "#17312C"],
  ["Precision compounds", "Arc — Fintech infrastructure", "#111111", "#F4F0E8"],
  ["Climate, quantified", "Verdant — Impact and scale", "#C8D7BD", "#1D3526"],
  [
    "The art of arrival",
    "Maison Lune — Brand presentation",
    "#E8D8CC",
    "#452E30",
  ],
  ["BIG IDEAS / NO FILLER", "Raw Systems — Series A", "#FF4F24", "#111111"],
] as const;

// Cosmos imagery selected around the requested material and architecture themes:
// concrete, sculpture, glass, shadows, chrome, landscape, brutalism and paper.
const MATERIAL_IMAGES = [
  OBJECTS[0],
  OBJECTS[4],
  OBJECTS[8],
  OBJECTS[12],
  OBJECTS[16],
  OBJECTS[20],
  OBJECTS[24],
  OBJECTS[28],
  OBJECTS[32],
  OBJECTS[36],
].map((src, index) => src ?? TEXTURES[index % TEXTURES.length] ?? "");

function buildSpecs(
  meta: readonly (readonly [string, string, string, string])[],
  offset: number,
): TemplateSpec[] {
  return meta.map(([title, subtitle, accent, ink], index) => ({
    title,
    subtitle,
    background: PORTRAITS[index + offset] ?? PORTRAITS[index] ?? "",
    secondary: OBJECTS[index + offset] ?? OBJECTS[index] ?? "",
    texture: TEXTURES[index % TEXTURES.length] ?? "",
    ink,
    accent,
  }));
}

const ALBUMS = buildSpecs(ALBUM_META, 0);
const POSTER_ART = [
  "https://cdn.cosmos.so/efd3219c-a749-4a28-b837-17c4fa411708?format=webp",
  "https://cdn.cosmos.so/98c09665-30ea-4579-bfec-3d6aa2915850?format=webp",
  "https://cdn.cosmos.so/c1c043ae-367e-42aa-a878-be7a301ab577?format=webp",
  "https://cdn.cosmos.so/fa292b44-a3a8-4e4c-95d0-8785fde7c7c5?format=webp",
  "https://cdn.cosmos.so/91867887-c3a6-4912-a3a5-2b480860612a?format=webp",
] as const;

const POSTERS = buildSpecs(POSTER_META, 20).map((spec, index) => {
  const artwork = POSTER_ART[index];
  return artwork ? { ...spec, background: artwork, secondary: artwork } : spec;
});

function texture(index: number): TextureCardFill | null {
  if (index % 4 === 3) return null;
  const choices: TextureCardFill["texture"][] = [
    "paper",
    "halftone",
    "halftone-cmyk",
    "fluted-glass",
  ];
  const selected = choices[index % choices.length] ?? "paper";
  return {
    ...createDefaultTextureFill(selected),
    opacity: index % 2 ? 0.12 : 0.2,
  };
}

function settings(
  aspectRatio: CardAspectRatio,
  spec: TemplateSpec,
  index: number,
): CardSettings {
  return {
    aspectRatio,
    fill: {
      type: "image",
      imageId: null,
      src: spec.background,
      opacity: 1,
      settings: {
        backgroundSize: "cover",
        originX: 35 + (index % 4) * 10,
        originY: 40 + (index % 3) * 10,
      },
    },
    texture: texture(index),
    opacity: 1,
    blur: 0,
    borderWidth: 0,
    borderStyle: "solid",
    borderColor: "#000000",
  };
}

function posterSettings(src: string): CardSettings {
  return {
    aspectRatio: "9:16",
    fill: {
      type: "image",
      imageId: null,
      src,
      opacity: 0,
      settings: { backgroundSize: "cover", originX: 50, originY: 50 },
    },
    texture: null,
    opacity: 1,
    blur: 0,
    borderWidth: 0,
    borderStyle: "solid",
    borderColor: "#000000",
  };
}

export type TemplateFontAvailability = Record<FontType, boolean>;

export function getTemplateFontType(id: string): FontType {
  if (/(?:title|first|last|vertical)$/.test(id)) return "primary";
  if (/(?:date|year|credit|studio|cat|meta|no|side)$/.test(id)) {
    return "sec2";
  }
  return "sec1";
}

export function resolveTemplateFontType(
  fontType: FontType,
  available: TemplateFontAvailability,
): FontType {
  const fallbackOrder: Record<FontType, FontType[]> = {
    primary: ["primary", "sec1", "sec2"],
    sec1: ["sec1", "primary", "sec2"],
    sec2: ["sec2", "sec1", "primary"],
  };

  return fallbackOrder[fontType].find((role) => available[role]) ?? "primary";
}

export function resolveTemplateFonts(
  card: EditorCard,
  available: TemplateFontAvailability,
): EditorCard {
  return {
    ...card,
    nodes: card.nodes.map((node) =>
      node.type === "text"
        ? (() => {
            const fontType = resolveTemplateFontType(node.fontType, available);
            const role =
              fontType === "sec1"
                ? "secondary-one"
                : fontType === "sec2"
                  ? "secondary-two"
                  : "primary";
            return {
              ...node,
              fontType,
              fontSource: { type: "role" as const, role },
            };
          })()
        : node,
    ),
  };
}

function text(
  id: string,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  color: string,
  options: Partial<TextNode> = {},
): TextNode {
  const lineHeight = options.lineHeight ?? 0.9;
  const letterSpacing = options.letterSpacing ?? -1;
  const isDisplayText = /(?:title|first|last)$/.test(id);
  const approximateCharacterWidth = Math.max(
    fontSize * 0.5 + Math.max(letterSpacing, 0),
    1,
  );
  const charactersPerLine = Math.max(
    1,
    Math.floor(width / approximateCharacterWidth),
  );
  const estimatedLineCount = value
    .split("\n")
    .reduce(
      (lines, paragraph) =>
        lines + Math.max(1, Math.ceil(paragraph.length / charactersPerLine)),
      0,
    );
  const safeDisplayHeight = Math.ceil(
    estimatedLineCount * fontSize * lineHeight + fontSize * 0.18,
  );

  const fontType = getTemplateFontType(id);
  const role =
    fontType === "sec1"
      ? "secondary-one"
      : fontType === "sec2"
        ? "secondary-two"
        : "primary";

  return {
    id,
    type: "text",
    x,
    y,
    width,
    height: isDisplayText ? Math.max(height, safeDisplayHeight) : height,
    text: value,
    fontType,
    fontSource: { type: "role", role },
    fontSize,
    fontWeight: 700,
    lineHeight,
    letterSpacing: -1,
    color,
    textAlign: "left",
    textCasing: "none",
    ...options,
  };
}

function shape(
  id: string,
  shapeType: ShapeNode["shapeType"],
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
): ShapeNode {
  return {
    id,
    type: "shape",
    shapeType,
    shape: value,
    x,
    y,
    width,
    height,
    color,
		strokeWidth: 1,
  };
}

function image(
  id: string,
  src: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: Partial<ImageNode> = {},
): ImageNode {
  return {
    id,
    type: "image",
    src,
    imageId: null,
    alt: "Template image",
    x,
    y,
    width,
    height,
    objectFit: "cover",
    zoom: 1,
    positionX: 50,
    positionY: 50,
    effects: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      grayscale: 0,
      sepia: 0,
    },
    opacity: 1,
    blendMode: "normal",
    texture: null,
    ...options,
  };
}

function businessCardNodes(
  meta: (typeof BUSINESS_CARD_META)[number],
  index: number,
): EditorNode[] {
  const [studio, person, accent, ink] = meta;
  const artwork = MATERIAL_IMAGES[index] ?? "";
  const [name, role] = person.split(" — ");

  if (index < 4) {
    const typographicLayouts: EditorNode[][] = [
      [
        text("bc0-title", studio.toUpperCase(), 28, 26, 310, 30, 18, ink, {
          fontWeight: 500,
          letterSpacing: 2.4,
        }),
        text("bc0-name", name ?? person, 28, 196, 300, 42, 29, ink, {
          fontWeight: 500,
          letterSpacing: -1.2,
        }),
        text(
          "bc0-meta",
          `${role ?? "Creative practice"}\nhello@contour.studio`,
          360,
          202,
          170,
          44,
          10,
          ink,
          { lineHeight: 1.45, letterSpacing: 0, textAlign: "right" },
        ),
        text(
          "bc0-side",
          "ZÜRICH / LAGOS\nEST. 2018",
          28,
          274,
          150,
          28,
          8,
          ink,
          { lineHeight: 1.35, letterSpacing: 1.5 },
        ),
      ],
      [
        text("bc1-title", studio, 30, 28, 250, 48, 32, ink, {
          fontWeight: 500,
          letterSpacing: -1.5,
        }),
        text("bc1-index", "01—04", 458, 30, 72, 18, 9, ink, {
          textAlign: "right",
          letterSpacing: 1.5,
        }),
        text(
          "bc1-name",
          (name ?? person).toUpperCase(),
          30,
          238,
          240,
          20,
          12,
          ink,
          { letterSpacing: 1.8 },
        ),
        text(
          "bc1-meta",
          `${role ?? "Architecture"}\n+44 20 7946 0281`,
          352,
          236,
          178,
          42,
          10,
          ink,
          { textAlign: "right", lineHeight: 1.45, letterSpacing: 0 },
        ),
      ],
      [
        text(
          "bc2-kicker",
          "INDEPENDENT DESIGN OFFICE",
          26,
          28,
          250,
          16,
          8,
          ink,
          { letterSpacing: 2 },
        ),
        text("bc2-title", studio, 26, 104, 508, 66, 50, ink, {
          fontWeight: 500,
          letterSpacing: -3,
        }),
        text("bc2-name", name ?? person, 26, 252, 210, 24, 15, ink, {
          letterSpacing: -0.3,
        }),
        text(
          "bc2-meta",
          `${role ?? "Designer"}\nbureauform.co`,
          354,
          248,
          180,
          42,
          10,
          ink,
          { textAlign: "right", lineHeight: 1.5, letterSpacing: 0.3 },
        ),
      ],
      [
        text("bc3-title", studio.toUpperCase(), 28, 26, 504, 24, 16, ink, {
          textAlign: "justify",
          fontWeight: 500,
          letterSpacing: 5,
        }),
        text("bc3-name", name ?? person, 28, 188, 504, 54, 38, ink, {
          textAlign: "right",
          fontWeight: 500,
          letterSpacing: -2,
        }),
        text(
          "bc3-meta",
          `${role ?? "Founder"}  ·  nomaobjects.com`,
          28,
          280,
          504,
          16,
          9,
          ink,
          { textAlign: "right", letterSpacing: 1 },
        ),
      ],
    ];

    return typographicLayouts[index] ?? [];
  }

  const base = [
    shape(
      `bc${index}-ground`,
      "rectangle",
      "rectangle",
      0,
      0,
      560,
      320,
      accent,
    ),
    image(`bc${index}-image`, artwork, index % 2 ? 0 : 330, 0, 230, 320, {
      blendMode: index % 3 === 0 ? "multiply" : "normal",
      opacity: 0.92,
    }),
  ];

  switch (index % 5) {
    case 0:
      return [
        ...base,
        text(`bc${index}-title`, studio, 28, 28, 288, 58, 34, ink, {
          fontWeight: 500,
          letterSpacing: -2,
        }),
        text(`bc${index}-name`, name ?? person, 28, 214, 260, 22, 15, ink, {
          letterSpacing: 0,
        }),
        text(
          `bc${index}-meta`,
          `${role ?? "Creative practice"}\nhello@${studio.toLowerCase().replaceAll(" ", "")}.studio`,
          28,
          246,
          278,
          44,
          10,
          ink,
          { lineHeight: 1.35, letterSpacing: 0 },
        ),
      ];
    case 1:
      return [
        ...base,
        text(
          `bc${index}-title`,
          studio.toUpperCase(),
          258,
          26,
          274,
          48,
          27,
          ink,
          { textAlign: "right", letterSpacing: 2, fontWeight: 500 },
        ),
        text(`bc${index}-name`, name ?? person, 258, 224, 274, 22, 16, ink, {
          textAlign: "right",
        }),
        text(
          `bc${index}-meta`,
          `${role ?? "Design practice"}\n+234 800 555 0192`,
          258,
          254,
          274,
          42,
          10,
          ink,
          { textAlign: "right", lineHeight: 1.3, letterSpacing: 0 },
        ),
      ];
    case 2:
      return [
        ...base,
        shape(`bc${index}-rule`, "line", "vertical", 278, 22, 4, 276, ink),
        text(`bc${index}-title`, studio, 24, 24, 222, 112, 43, ink, {
          lineHeight: 0.86,
          letterSpacing: -3,
        }),
        text(`bc${index}-name`, person, 310, 228, 222, 44, 14, ink, {
          textAlign: "right",
          lineHeight: 1.15,
        }),
        text(
          `bc${index}-meta`,
          "STUDIO INDEX / 2026",
          310,
          282,
          222,
          14,
          8,
          ink,
          { textAlign: "right", letterSpacing: 2 },
        ),
      ];
    case 3:
      return [
        ...base,
        text(`bc${index}-title`, studio, 26, 112, 508, 72, 54, ink, {
          textAlign: "center",
          fontWeight: 500,
          letterSpacing: -3,
        }),
        text(`bc${index}-name`, person, 26, 274, 508, 18, 11, ink, {
          textAlign: "center",
          letterSpacing: 1,
        }),
      ];
    default:
      return [
        ...base,
        text(`bc${index}-title`, studio, 26, 24, 500, 48, 32, ink, {
          fontWeight: 500,
        }),
        text(`bc${index}-name`, name ?? person, 26, 216, 204, 54, 26, ink, {
          lineHeight: 0.9,
        }),
        text(
          `bc${index}-meta`,
          `${role ?? "Creative practice"}\nLagos · London · Everywhere`,
          26,
          274,
          310,
          30,
          9,
          ink,
          { lineHeight: 1.25, letterSpacing: 1 },
        ),
      ];
  }
}

function pitchDeckNodes(
  meta: (typeof PITCH_DECK_META)[number],
  index: number,
): EditorNode[] {
  const [title, subtitle, accent, ink] = meta;
  const artwork = MATERIAL_IMAGES[(index + 3) % MATERIAL_IMAGES.length] ?? "";
  const base = [
    shape(
      `pd${index}-ground`,
      "rectangle",
      "rectangle",
      0,
      0,
      640,
      360,
      accent,
    ),
  ];

  switch (index % 5) {
    case 0:
      return [
        ...base,
        image(`pd${index}-image`, artwork, 374, 0, 266, 360),
        text(`pd${index}-title`, title, 30, 64, 318, 166, 48, ink, {
          lineHeight: 0.88,
          letterSpacing: -3,
          fontWeight: 500,
        }),
        text(`pd${index}-meta`, subtitle, 32, 314, 308, 18, 10, ink, {
          letterSpacing: 1,
        }),
      ];
    case 1:
      return [
        ...base,
        image(`pd${index}-image`, artwork, 28, 28, 584, 206),
        text(`pd${index}-title`, title, 28, 250, 584, 58, 38, ink, {
          letterSpacing: -2,
        }),
        text(`pd${index}-meta`, subtitle, 30, 326, 580, 14, 9, ink, {
          letterSpacing: 2,
        }),
      ];
    case 2:
      return [
        ...base,
        image(`pd${index}-image`, artwork, 0, 0, 640, 360, {
          opacity: 0.5,
          blendMode: "multiply",
        }),
        text(`pd${index}-title`, title, 42, 108, 556, 120, 62, ink, {
          textAlign: "center",
          lineHeight: 0.88,
          letterSpacing: -4,
          fontWeight: 500,
        }),
        text(`pd${index}-meta`, subtitle, 42, 322, 556, 16, 10, ink, {
          textAlign: "center",
          letterSpacing: 2,
        }),
      ];
    case 3:
      return [
        ...base,
        image(`pd${index}-image`, artwork, 0, 0, 282, 360, {
          effects: {
            brightness: 105,
            contrast: 125,
            saturation: 0,
            blur: 0,
            grayscale: 100,
            sepia: 0,
          },
        }),
        text(`pd${index}-title`, title, 318, 44, 288, 180, 50, ink, {
          lineHeight: 0.84,
          letterSpacing: -3,
        }),
        shape(`pd${index}-rule`, "line", "horizontal", 320, 272, 284, 4, ink),
        text(`pd${index}-meta`, subtitle, 320, 304, 284, 18, 10, ink, {
          letterSpacing: 1,
        }),
      ];
    default:
      return [
        ...base,
        image(`pd${index}-image`, artwork, 344, 36, 260, 288, {
          blendMode: "multiply",
        }),
        text(`pd${index}-title`, title, 26, 34, 284, 214, 54, ink, {
          lineHeight: 0.82,
          letterSpacing: -3,
        }),
        text(`pd${index}-meta`, subtitle, 28, 312, 280, 18, 9, ink, {
          letterSpacing: 1,
        }),
      ];
  }
}

function newPitchDeckNodes(
  meta: (typeof NEW_PITCH_DECK_META)[number],
  index: number,
): EditorNode[] {
  const [title, body, details, accent, ink] = meta;
  const artwork = MATERIAL_IMAGES[(index + 5) % MATERIAL_IMAGES.length] ?? "";
  const prefix = `npd${index}`;
  const bullets = details
    .split(" · ")
    .map((item) => `— ${item}`)
    .join("\n");
  const ground = shape(
    `${prefix}-ground`,
    "rectangle",
    "rectangle",
    0,
    0,
    640,
    360,
    accent,
  );

  if (index < 3) {
    return [
      ground,
      image(`${prefix}-image`, artwork, 392, 0, 248, 360, {
        opacity: 0.86,
        blendMode: "multiply",
      }),
      text(`${prefix}-title`, title, 30, 30, 332, 52, 34, ink, {
        fontWeight: 500,
        letterSpacing: -2,
      }),
      text(`${prefix}-sub`, body, 30, 126, 328, 98, 27, ink, {
        fontWeight: 500,
        lineHeight: 1.02,
        letterSpacing: -1.2,
      }),
      text(`${prefix}-meta`, details, 30, 312, 332, 16, 9, ink, {
        letterSpacing: 0.6,
      }),
    ];
  }

  if (index < 5) {
    const ghostInk = index === 3 ? "#11111124" : "#FFFFFF38";
    return [
      ground,
      image(`${prefix}-image`, artwork, index % 2 ? 384 : 0, 0, 256, 360, {
        opacity: 0.58,
        blendMode: index % 2 ? "screen" : "multiply",
      }),
      text(
        `${prefix}-ghost`,
        title.toUpperCase(),
        14,
        20,
        612,
        142,
        78,
        ghostInk,
        {
          lineHeight: 0.72,
          letterSpacing: -6,
        },
      ),
      text(
        `${prefix}-title`,
        title.toUpperCase(),
        index % 2 ? 24 : 286,
        74,
        326,
        132,
        54,
        ink,
        {
          lineHeight: 0.78,
          letterSpacing: -4.5,
          fontWeight: 700,
        },
      ),
      text(
        `${prefix}-meta`,
        details.toUpperCase(),
        index % 2 ? 28 : 292,
        314,
        310,
        18,
        9,
        ink,
        {
          letterSpacing: 1.2,
        },
      ),
    ];
  }

  if (index < 7) {
    return [
      ground,
      image(`${prefix}-image`, artwork, index % 2 ? 374 : 0, 0, 266, 360, {
        opacity: 0.48,
        blendMode: index % 2 ? "screen" : "multiply",
      }),
      text(
        `${prefix}-ghost`,
        title.toUpperCase(),
        18,
        8,
        604,
        100,
        70,
        index === 5 ? "#FFFFFF35" : "#11111124",
        {
          lineHeight: 0.76,
          letterSpacing: -5,
        },
      ),
      text(
        `${prefix}-title`,
        title.toUpperCase(),
        index % 2 ? 24 : 294,
        44,
        322,
        126,
        50,
        ink,
        { lineHeight: 0.8, letterSpacing: -4, fontWeight: 700 },
      ),
      text(
        `${prefix}-body`,
        body,
        index % 2 ? 28 : 302,
        188,
        300,
        84,
        12,
        ink,
        { lineHeight: 1.35, letterSpacing: 0, fontWeight: 500 },
      ),
      text(
        `${prefix}-points`,
        bullets,
        index % 2 ? 28 : 302,
        286,
        300,
        54,
        10,
        ink,
        { lineHeight: 1.45, letterSpacing: 0.2 },
      ),
    ];
  }

  return [
    ground,
    image(`${prefix}-image`, artwork, 414, 28, 194, 194, {
      opacity: 0.76,
      blendMode: "multiply",
    }),
    text(`${prefix}-index`, `0${index - 6}`, 28, 24, 64, 40, 29, ink, {
      fontWeight: 500,
      letterSpacing: -1,
    }),
    text(`${prefix}-title`, title, 106, 30, 290, 94, 43, ink, {
      lineHeight: 0.88,
      letterSpacing: -2.5,
      fontWeight: 500,
    }),
    text(`${prefix}-body`, body, 106, 158, 286, 100, 12, ink, {
      lineHeight: 1.4,
      letterSpacing: 0,
      fontWeight: 500,
    }),
    text(`${prefix}-points`, bullets, 414, 246, 194, 82, 10, ink, {
      lineHeight: 1.5,
      letterSpacing: 0,
    }),
  ];
}

function typographyOnlyCardSettings(color: string): CardSettings {
  return {
    aspectRatio: "business-card",
    fill: { type: "solid", color },
    texture: { ...createDefaultTextureFill("paper"), opacity: 0.08 },
    opacity: 1,
    blur: 0,
    borderWidth: 0,
    borderStyle: "solid",
    borderColor: "#000000",
  };
}

function expressiveDeckSettings(
  meta: (typeof NEW_PITCH_DECK_META)[number],
  index: number,
): CardSettings {
  return {
    aspectRatio: "16:9",
    fill:
      index >= 3 && index < 7
        ? {
            type: "linear-gradient",
            angle: index % 2 ? 25 : 145,
            stops: [
              { id: `npd-${index}-a`, color: meta[3], position: 0 },
              {
                id: `npd-${index}-b`,
                color: index % 2 ? "#7C3CFF" : "#FF7A45",
                position: 100,
              },
            ],
          }
        : { type: "solid", color: meta[3] },
    texture: index < 3 ? texture(index) : null,
    opacity: 1,
    blur: 0,
    borderWidth: 0,
    borderStyle: "solid",
    borderColor: "#000000",
  };
}

function albumNodes(spec: TemplateSpec, index: number): EditorNode[] {
  const { title, subtitle, secondary, texture: textureUrl, ink, accent } = spec;
  const catalog = `KRN—${String(index + 1).padStart(2, "0")}`;

  switch (index) {
    case 0:
      return [
        image("a0-paper", textureUrl, 0, 0, 500, 500, {
          opacity: 0.3,
          blendMode: "multiply",
        }),
        shape("a0-block", "rectangle", "rectangle", 26, 26, 448, 448, accent),
        image("a0-object", secondary, 126, 70, 248, 270, {
          blendMode: "multiply",
          effects: {
            brightness: 105,
            contrast: 135,
            saturation: 65,
            blur: 0,
            grayscale: 35,
            sepia: 0,
          },
        }),
        text("a0-title", title, 38, 344, 424, 92, 76, ink, {
          textAlign: "center",
          letterSpacing: -5,
          fontWeight: 500,
        }),
        text(
          "a0-meta",
          `${subtitle}  •  ${catalog}`,
          42,
          454,
          416,
          18,
          10,
          ink,
          { textAlign: "center", letterSpacing: 2 },
        ),
      ];
    case 1:
      return [
        shape("a1-ground", "rectangle", "rectangle", 0, 0, 210, 500, accent),
        image("a1-cut", secondary, 178, 44, 282, 338, {
          effects: {
            brightness: 100,
            contrast: 120,
            saturation: 0,
            blur: 0,
            grayscale: 100,
            sepia: 10,
          },
        }),
        text("a1-title", title, 24, 42, 164, 212, 48, ink, {
          lineHeight: 0.82,
          letterSpacing: -3,
        }),
        shape("a1-rule", "line", "vertical", 210, 0, 4, 500, ink),
        text("a1-sub", subtitle, 230, 408, 230, 24, 13, ink, {
          letterSpacing: 3,
        }),
        text("a1-cat", catalog, 388, 462, 72, 16, 9, ink, {
          textAlign: "right",
        }),
      ];
    case 2:
      return [
        shape("a2-panel", "rectangle", "rectangle", 34, 32, 432, 436, accent),
        image("a2-one", secondary, 58, 58, 172, 172, {
          effects: {
            brightness: 112,
            contrast: 135,
            saturation: 30,
            blur: 0,
            grayscale: 65,
            sepia: 0,
          },
        }),
        image("a2-two", textureUrl, 250, 58, 192, 172, {
          opacity: 0.72,
          blendMode: "multiply",
        }),
        image("a2-three", secondary, 58, 250, 384, 104, {
          positionY: 72,
          blendMode: "darken",
        }),
        text("a2-title", title, 58, 374, 384, 62, 42, ink, {
          letterSpacing: -2,
        }),
        text("a2-sub", `${subtitle} / ${catalog}`, 60, 444, 380, 16, 9, ink, {
          letterSpacing: 2,
        }),
      ];
    case 3:
      return [
        image("a3-wash", textureUrl, 0, 0, 500, 500, {
          opacity: 0.38,
          blendMode: "screen",
        }),
        shape("a3-circle", "ellipse", "circle", 84, 64, 332, 332, accent),
        image("a3-flower", secondary, 120, 92, 260, 278, {
          blendMode: "multiply",
          effects: {
            brightness: 106,
            contrast: 120,
            saturation: 45,
            blur: 0,
            grayscale: 25,
            sepia: 10,
          },
        }),
        text("a3-title", title, 36, 180, 428, 112, 58, ink, {
          textAlign: "center",
          letterSpacing: -3,
          lineHeight: 0.84,
        }),
        text("a3-sub", subtitle, 98, 430, 304, 18, 11, ink, {
          textAlign: "center",
          letterSpacing: 4,
        }),
      ];
    case 4:
      return [
        shape("a4-black", "rectangle", "rectangle", 0, 0, 500, 500, accent),
        image("a4-figure", secondary, 40, 34, 420, 430, {
          blendMode: "screen",
          effects: {
            brightness: 90,
            contrast: 150,
            saturation: 0,
            blur: 0,
            grayscale: 100,
            sepia: 0,
          },
        }),
        text("a4-title", title, 22, 30, 456, 90, 72, ink, {
          letterSpacing: -5,
        }),
        shape("a4-cross1", "line", "diagonal-down", 330, 308, 132, 132, ink),
        shape("a4-cross2", "line", "diagonal-up", 330, 308, 132, 132, ink),
        text("a4-sub", subtitle, 28, 458, 220, 18, 10, ink, {
          letterSpacing: 3,
        }),
      ];
    case 5:
      return [
        image("a5-texture", textureUrl, 0, 0, 500, 500, {
          opacity: 0.22,
          blendMode: "overlay",
        }),
        shape("a5-blue", "rectangle", "rectangle", 24, 24, 452, 452, accent),
        image("a5-inset", secondary, 188, 58, 254, 282, {
          blendMode: "lighten",
        }),
        text("a5-title", title, 36, 280, 426, 112, 66, ink, {
          letterSpacing: -4,
          lineHeight: 0.82,
        }),
        text("a5-sub", subtitle, 38, 418, 250, 20, 12, ink, {
          letterSpacing: 2,
        }),
        text("a5-no", "05", 390, 412, 62, 46, 38, ink, { textAlign: "right" }),
      ];
    case 6:
      return [
        shape("a6-paper", "rectangle", "rectangle", 54, 38, 392, 424, accent),
        image("a6-torn", secondary, 84, 78, 332, 226, {
          effects: {
            brightness: 112,
            contrast: 128,
            saturation: 15,
            blur: 0,
            grayscale: 85,
            sepia: 8,
          },
        }),
        image("a6-grain", textureUrl, 54, 38, 392, 424, {
          opacity: 0.2,
          blendMode: "multiply",
        }),
        text("a6-title", title, 80, 326, 340, 62, 46, ink, {
          textAlign: "center",
          letterSpacing: -2,
        }),
        shape("a6-rule", "line", "horizontal", 130, 402, 240, 10, ink),
        text("a6-meta", `${subtitle}\n${catalog}`, 120, 424, 260, 36, 10, ink, {
          textAlign: "center",
          lineHeight: 1.2,
          letterSpacing: 2,
        }),
      ];
    case 7:
      return [
        shape("a7-ground", "rectangle", "rectangle", 0, 0, 500, 500, accent),
        image("a7-botanical", secondary, 160, 0, 340, 500, {
          blendMode: "screen",
          opacity: 0.9,
        }),
        text("a7-title", title, 24, 44, 214, 262, 62, ink, {
          lineHeight: 0.78,
          letterSpacing: -4,
        }),
        text("a7-sub", subtitle, 28, 390, 180, 42, 11, ink, {
          letterSpacing: 3,
          lineHeight: 1.2,
        }),
        shape("a7-star", "icon", "sparkles", 36, 448, 32, 32, ink),
      ];
    case 8:
      return [
        image("a8-stone", textureUrl, 0, 0, 500, 500, {
          opacity: 0.5,
          blendMode: "multiply",
        }),
        image("a8-object", secondary, 134, 64, 232, 300, {
          effects: {
            brightness: 105,
            contrast: 145,
            saturation: 0,
            blur: 0,
            grayscale: 100,
            sepia: 25,
          },
        }),
        text("a8-title", title, 20, 22, 460, 90, 64, ink, {
          textAlign: "center",
          letterSpacing: -4,
        }),
        text("a8-side", "DUST\nLANGUAGE\nVOL. 09", 28, 340, 96, 88, 14, ink, {
          lineHeight: 1.1,
          letterSpacing: 1,
        }),
        text("a8-sub", subtitle, 292, 410, 176, 20, 11, ink, {
          textAlign: "right",
          letterSpacing: 2,
        }),
      ];
    case 9:
      return [
        shape("a9-accent", "rectangle", "rectangle", 0, 0, 500, 500, accent),
        image("a9-double1", secondary, 36, 36, 286, 380, {
          opacity: 0.85,
          blendMode: "multiply",
        }),
        image("a9-double2", secondary, 178, 68, 286, 380, {
          opacity: 0.55,
          blendMode: "screen",
          positionX: 68,
        }),
        text("a9-title", title, 26, 356, 448, 94, 58, ink, {
          textAlign: "center",
          letterSpacing: -3,
        }),
        text("a9-sub", subtitle, 30, 462, 440, 18, 10, ink, {
          textAlign: "center",
          letterSpacing: 4,
        }),
      ];
    case 10:
      return [
        shape("a10-ground", "rectangle", "rectangle", 0, 0, 500, 500, accent),
        image("a10-strip1", secondary, 26, 78, 138, 278, { positionX: 22 }),
        image("a10-strip2", secondary, 181, 78, 138, 278, {
          positionX: 50,
          effects: {
            brightness: 100,
            contrast: 125,
            saturation: 0,
            blur: 0,
            grayscale: 100,
            sepia: 0,
          },
        }),
        image("a10-strip3", secondary, 336, 78, 138, 278, { positionX: 78 }),
        text("a10-title", title, 24, 22, 452, 48, 40, ink, {
          letterSpacing: -2,
        }),
        text("a10-sub", subtitle, 28, 390, 300, 22, 13, ink, {
          letterSpacing: 4,
        }),
        text("a10-cat", catalog, 376, 448, 96, 18, 10, ink, {
          textAlign: "right",
        }),
      ];
    case 11:
      return [
        shape("a11-sky", "rectangle", "rectangle", 0, 0, 500, 500, accent),
        shape("a11-window", "rectangle", "rectangle", 124, 96, 252, 252, ink),
        image("a11-object", secondary, 138, 110, 224, 224),
        shape("a11-circle", "ellipse", "circle", 208, 186, 84, 84, accent),
        text("a11-title", title, 24, 370, 452, 58, 52, ink, {
          textAlign: "center",
          letterSpacing: -3,
        }),
        text("a11-sub", subtitle, 24, 446, 452, 16, 10, ink, {
          textAlign: "center",
          letterSpacing: 5,
        }),
      ];
    case 12:
      return [
        image("a12-paper", textureUrl, 0, 0, 500, 500, {
          opacity: 0.45,
          blendMode: "multiply",
        }),
        image("a12-rose", secondary, 250, 0, 250, 500, {
          blendMode: "multiply",
        }),
        shape("a12-line", "line", "vertical", 246, 0, 8, 500, ink),
        text("a12-title", title, 28, 36, 206, 168, 64, ink, {
          lineHeight: 0.82,
          letterSpacing: -4,
        }),
        text("a12-sub", subtitle, 30, 408, 190, 44, 11, ink, {
          letterSpacing: 3,
          lineHeight: 1.25,
        }),
      ];
    case 13:
      return [
        shape("a13-black", "rectangle", "rectangle", 0, 0, 500, 500, accent),
        image("a13-one", secondary, 40, 40, 190, 420, {
          effects: {
            brightness: 95,
            contrast: 140,
            saturation: 0,
            blur: 0,
            grayscale: 100,
            sepia: 0,
          },
        }),
        image("a13-two", secondary, 270, 40, 190, 420, {
          positionX: 80,
          blendMode: "screen",
          opacity: 0.72,
        }),
        text("a13-title", title, 82, 182, 336, 132, 68, ink, {
          textAlign: "center",
          letterSpacing: -4,
          lineHeight: 0.8,
        }),
        shape("a13-cross", "icon", "asterisk", 222, 420, 56, 56, ink),
      ];
    case 14:
      return [
        shape("a14-frame", "rectangle", "rectangle", 28, 28, 444, 444, accent),
        image("a14-image", secondary, 48, 48, 404, 316, { positionY: 25 }),
        image("a14-dust", textureUrl, 48, 48, 404, 316, {
          opacity: 0.26,
          blendMode: "screen",
        }),
        text("a14-title", title, 50, 378, 400, 54, 46, ink, {
          textAlign: "center",
          letterSpacing: -2,
        }),
        text("a14-sub", `${subtitle} — ${catalog}`, 50, 446, 400, 16, 9, ink, {
          textAlign: "center",
          letterSpacing: 2,
        }),
      ];
    case 15:
      return [
        shape("a15-ground", "rectangle", "rectangle", 0, 0, 500, 500, accent),
        image("a15-petal", secondary, 66, 68, 368, 364, {
          blendMode: "multiply",
          opacity: 0.92,
        }),
        shape("a15-orbit", "icon", "orbit", 152, 142, 196, 196, ink),
        text("a15-title", title, 22, 26, 456, 70, 58, ink, {
          textAlign: "center",
          letterSpacing: -4,
        }),
        text("a15-sub", subtitle, 76, 448, 348, 18, 10, ink, {
          textAlign: "center",
          letterSpacing: 4,
        }),
      ];
    case 16:
      return [
        shape("a16-blue", "rectangle", "rectangle", 0, 0, 500, 500, accent),
        shape("a16-stage", "rectangle", "rectangle", 56, 52, 388, 308, ink),
        image("a16-hand", secondary, 84, 70, 332, 294, { blendMode: "screen" }),
        shape("a16-sun", "ellipse", "circle", 182, 134, 136, 136, "#FF6B2C"),
        text("a16-title", title, 42, 374, 416, 64, 54, ink, {
          textAlign: "center",
          letterSpacing: -3,
        }),
        text("a16-sub", subtitle, 42, 452, 416, 16, 10, ink, {
          textAlign: "center",
          letterSpacing: 3,
        }),
      ];
    case 17:
      return [
        image("a17-cloud", secondary, 0, 0, 500, 350, { positionY: 25 }),
        shape("a17-paper", "rectangle", "rectangle", 0, 342, 500, 158, accent),
        text("a17-title", title, 22, 362, 456, 64, 52, ink, {
          letterSpacing: -3,
        }),
        text("a17-sub", subtitle, 24, 446, 250, 18, 11, ink, {
          letterSpacing: 2,
        }),
        text("a17-cat", catalog, 386, 446, 90, 18, 10, ink, {
          textAlign: "right",
        }),
      ];
    case 18:
      return [
        shape("a18-black", "rectangle", "rectangle", 0, 0, 500, 500, accent),
        image("a18-flower", secondary, 50, 36, 400, 428, {
          blendMode: "screen",
          effects: {
            brightness: 110,
            contrast: 135,
            saturation: 30,
            blur: 0,
            grayscale: 45,
            sepia: 0,
          },
        }),
        image("a18-halftone", textureUrl, 0, 0, 500, 500, {
          opacity: 0.3,
          blendMode: "overlay",
        }),
        text("a18-title", title, 20, 26, 460, 104, 70, ink, {
          lineHeight: 0.78,
          letterSpacing: -5,
        }),
        text("a18-sub", subtitle, 28, 454, 444, 18, 11, ink, {
          textAlign: "right",
          letterSpacing: 4,
        }),
      ];
    default:
      return [
        image("a19-paper", textureUrl, 0, 0, 500, 500, {
          opacity: 0.5,
          blendMode: "multiply",
        }),
        shape("a19-tape1", "rectangle", "rectangle", 42, 92, 416, 48, accent),
        image("a19-bloom", secondary, 112, 102, 276, 276, {
          blendMode: "multiply",
        }),
        shape("a19-tape2", "rectangle", "rectangle", 42, 352, 416, 48, accent),
        text("a19-title", title, 64, 174, 372, 120, 62, ink, {
          textAlign: "center",
          lineHeight: 0.82,
          letterSpacing: -4,
        }),
        text("a19-sub", `${subtitle} / ${catalog}`, 60, 438, 380, 18, 10, ink, {
          textAlign: "center",
          letterSpacing: 3,
        }),
      ];
  }
}

function posterNodes(spec: TemplateSpec, index: number): EditorNode[] {
  const { title, subtitle, secondary, texture: textureUrl, ink, accent } = spec;
  const credits = `KER NING PICTURES PRESENTS  •  ${subtitle}  •  2027`;

  switch (index) {
    case 0:
      return [
        shape("p0-ground", "rectangle", "rectangle", 0, 0, 360, 640, "#E7E8E8"),
        image("p0-car", secondary, 18, 18, 324, 292, { positionY: 44 }),
        shape("p0-rule", "line", "horizontal", 22, 330, 316, 2, "#697075"),
        text(
          "p0-eyebrow",
          "A KERNING PICTURES FILM  /  09.18.27",
          24,
          350,
          312,
          16,
          8,
          "#697075",
          {
            letterSpacing: 1.6,
          },
        ),
        text(
          "p0-title-shadow",
          "SILVER\nEXIT",
          26,
          375,
          310,
          150,
          70,
          "#AEB4B7",
          {
            lineHeight: 0.78,
            letterSpacing: -4,
            fontWeight: 500,
          },
        ),
        text("p0-title", title.replace(" ", "\n"), 22, 371, 310, 150, 70, ink, {
          lineHeight: 0.78,
          letterSpacing: -4,
          fontWeight: 500,
        }),
        text("p0-tag", subtitle, 24, 542, 312, 18, 10, "#3D4143", {
          letterSpacing: 2.2,
        }),
        text(
          "p0-credits",
          "NORTHLINE FILMS  •  MARA VEIL  •  NOAH GREY\nDIRECTED BY ELI VOSS  /  MUSIC BY INA WREN",
          24,
          582,
          312,
          34,
          6,
          "#697075",
          {
            lineHeight: 1.35,
            letterSpacing: 0.6,
          },
        ),
      ];
    case 1:
      return [
        shape("p1-ground", "rectangle", "rectangle", 0, 0, 360, 640, "#F2EFE7"),
        image("p1-landscape", secondary, 10, 10, 340, 492, { positionY: 48 }),
        text("p1-title", title, 14, 516, 332, 44, 36, ink, {
          textAlign: "center",
          letterSpacing: -2.6,
          fontWeight: 700,
        }),
        shape("p1-dot", "ellipse", "circle", 18, 584, 10, 10, "#CB4F45"),
        text("p1-sub", subtitle, 38, 580, 270, 17, 8, ink, {
          letterSpacing: 1.35,
        }),
        text("p1-date", "OCTOBER 3", 280, 580, 64, 17, 8, ink, {
          textAlign: "right",
        }),
        text(
          "p1-credits",
          "STILL WATER PRESENTS  •  A FILM BY REN ITO\nWITH EMI SATO  /  CINEMATOGRAPHY LEO MORI",
          18,
          610,
          324,
          24,
          6,
          "#4B4B47",
          {
            textAlign: "center",
            lineHeight: 1.25,
          },
        ),
      ];
    case 2:
      return [
        shape("p2-ground", "rectangle", "rectangle", 0, 0, 360, 640, "#F2EEE5"),
        image("p2-collage", secondary, 0, 0, 360, 430, { positionY: 48 }),
        text(
          "p2-kicker",
          "THE NEW FILM FROM LENA ORR",
          22,
          448,
          316,
          14,
          7,
          "#171717",
          { letterSpacing: 2.2 },
        ),
        text("p2-title", "A SOFT\nVIOLENCE", 20, 470, 320, 108, 57, ink, {
          letterSpacing: -3.6,
          lineHeight: 0.78,
        }),
        text("p2-sub", subtitle, 22, 584, 210, 16, 8, "#171717", {
          letterSpacing: 1.6,
        }),
        text("p2-date", "11.07.27", 276, 584, 62, 16, 8, "#171717", {
          textAlign: "right",
        }),
        text(
          "p2-credits",
          "MOTH HOUSE  •  AYA BELL  •  CELIA NORTH  •  JON VALE\nWRITTEN & DIRECTED BY LENA ORR",
          22,
          612,
          316,
          22,
          6,
          "#171717",
          { lineHeight: 1.2 },
        ),
      ];
    case 3:
      return [
        image("p3-field", secondary, 0, 0, 360, 640, { positionX: 51 }),
        text("p3-studio", "KERNING / PICTURES", 20, 18, 150, 14, 7, "#101713", {
          letterSpacing: 2,
        }),
        text("p3-title", "FAULT\nCOLOUR", 18, 52, 252, 116, 58, ink, {
          lineHeight: 0.8,
          letterSpacing: -3.5,
        }),
        shape("p3-orange", "rectangle", "rectangle", 18, 500, 324, 112, accent),
        text("p3-tag", subtitle, 30, 516, 286, 20, 10, ink, {
          letterSpacing: 1.5,
        }),
        text("p3-hook", "A shape can keep a secret.", 30, 548, 286, 16, 9, ink),
        text(
          "p3-credits",
          "PAPER SUN FILMS  •  MIRA SOL  •  TOM ARDEN\nA FILM BY NICO RHEE  /  08.22.27",
          30,
          578,
          286,
          24,
          6,
          ink,
          { lineHeight: 1.25 },
        ),
      ];
    case 4:
      return [
        image("p4-portrait", secondary, 0, 0, 360, 640, { positionY: 50 }),
        text("p4-title", "THE QUIET\nMOUTH", 20, 18, 320, 110, 55, ink, {
          lineHeight: 0.8,
          letterSpacing: -3.8,
        }),
        text("p4-tag", subtitle, 22, 134, 300, 16, 8, "#343338", {
          letterSpacing: 1.7,
        }),
        shape("p4-rule", "line", "horizontal", 22, 164, 96, 2, ink),
        text("p4-date", "IN CINEMAS  /  12.05.27", 22, 178, 190, 14, 7, ink, {
          letterSpacing: 1.7,
        }),
        text(
          "p4-credit",
          "PALE ROOM PRESENTS  •  EVE LAURENT\nA FILM BY SASKIA REED  /  MUSIC BY LOW CHOIR",
          22,
          596,
          316,
          28,
          6,
          "#F4F2EC",
          {
            lineHeight: 1.3,
            letterSpacing: 0.5,
          },
        ),
      ];
    case 5:
      return [
        image("p5-face", secondary, 0, 0, 360, 478, { positionY: 20 }),
        shape("p5-footer", "rectangle", "rectangle", 0, 478, 360, 162, accent),
        text("p5-title", title, 18, 490, 158, 82, 48, ink, {
          lineHeight: 0.8,
          letterSpacing: -3,
        }),
        text(
          "p5-cast",
          "MARA VEIL  TOM ARDEN\nIVA NORTH  LEO MORI",
          190,
          502,
          154,
          54,
          8,
          ink,
          { lineHeight: 1.25 },
        ),
        text("p5-sub", subtitle, 190, 574, 154, 18, 9, ink),
      ];
    case 6:
      return [
        shape("p6-ground", "rectangle", "rectangle", 0, 0, 360, 640, accent),
        image("p6-pieces", secondary, 72, 62, 216, 392, {
          blendMode: "multiply",
          effects: {
            brightness: 104,
            contrast: 135,
            saturation: 0,
            blur: 0,
            grayscale: 100,
            sepia: 0,
          },
        }),
        shape("p6-dot1", "ellipse", "circle", 44, 540, 12, 12, ink),
        shape("p6-dot2", "ellipse", "circle", 64, 540, 12, 12, ink),
        shape("p6-dot3", "ellipse", "circle", 84, 540, 12, 12, ink),
        text("p6-title", title, 36, 476, 288, 58, 46, ink, {
          textAlign: "center",
          letterSpacing: -2,
        }),
        text("p6-credit", credits, 38, 568, 284, 40, 7, ink, {
          textAlign: "center",
          lineHeight: 1.3,
        }),
      ];
    case 7:
      return [
        shape("p7-beige", "rectangle", "rectangle", 0, 0, 360, 640, accent),
        text("p7-kicker", "T  H  E", 138, 30, 84, 16, 8, ink, {
          textAlign: "center",
          letterSpacing: 5,
        }),
        text("p7-title", title, 64, 54, 232, 52, 36, ink, {
          textAlign: "center",
          letterSpacing: 1,
          fontWeight: 500,
        }),
        shape("p7-border", "rectangle", "rectangle", 100, 268, 238, 272, ink),
        image("p7-frame", secondary, 112, 280, 214, 248, { positionY: 25 }),
        image("p7-front", secondary, 36, 386, 176, 212, {
          positionX: 20,
          blendMode: "multiply",
        }),
        text(
          "p7-cast",
          "ADA  MIRA  EVE\nVALE  SOL  WREN",
          60,
          122,
          240,
          36,
          8,
          ink,
          { textAlign: "center", letterSpacing: 3 },
        ),
      ];
    case 8:
      return [
        shape("p8-paper", "rectangle", "rectangle", 0, 0, 360, 640, accent),
        image("p8-grid1", secondary, 20, 20, 150, 190, { positionX: 25 }),
        image("p8-grid2", secondary, 190, 20, 150, 190, { positionX: 75 }),
        image("p8-grid3", secondary, 20, 230, 320, 160, { positionY: 78 }),
        text("p8-title", title, 20, 410, 320, 112, 62, ink, {
          lineHeight: 0.78,
          letterSpacing: -4,
        }),
        text("p8-sub", subtitle, 22, 544, 180, 20, 10, ink, {
          letterSpacing: 2,
        }),
        text("p8-year", "2027", 270, 544, 68, 20, 10, ink, {
          textAlign: "right",
        }),
      ];
    case 9:
      return [
        shape("p9-red", "rectangle", "rectangle", 0, 0, 360, 640, accent),
        image("p9-desert", secondary, 0, 118, 360, 366, {
          blendMode: "multiply",
        }),
        image("p9-scratch", textureUrl, 0, 0, 360, 640, {
          opacity: 0.26,
          blendMode: "screen",
        }),
        text("p9-title", title, 24, 28, 312, 82, 66, ink, {
          textAlign: "center",
          letterSpacing: -4,
        }),
        text("p9-sub", subtitle, 26, 520, 308, 22, 11, ink, {
          textAlign: "center",
          letterSpacing: 3,
        }),
        text("p9-credit", credits, 28, 570, 304, 38, 7, ink, {
          textAlign: "center",
          lineHeight: 1.2,
        }),
      ];
    case 10:
      return [
        shape("p10-white", "rectangle", "rectangle", 0, 0, 360, 640, accent),
        image("p10-field", secondary, 28, 30, 304, 176, { positionY: 65 }),
        image("p10-portrait", secondary, 126, 232, 108, 110, { positionX: 30 }),
        text("p10-first", "VÉRONIQUE", 40, 208, 280, 52, 36, ink, {
          letterSpacing: -2,
        }),
        text("p10-last", "LEROY", 110, 354, 140, 48, 38, ink, {
          textAlign: "center",
          letterSpacing: -2,
        }),
        text("p10-credit", credits, 44, 558, 272, 42, 7, ink, {
          textAlign: "center",
          lineHeight: 1.2,
        }),
      ];
    case 11:
      return [
        shape("p11-white", "rectangle", "rectangle", 0, 0, 360, 640, accent),
        text("p11-title", title, 26, 28, 308, 64, 42, ink, {
          letterSpacing: -2,
        }),
        text(
          "p11-copy",
          "FORM FOLLOWS MEMORY\nA STUDY IN STRUCTURE",
          28,
          102,
          156,
          50,
          9,
          ink,
          { lineHeight: 1.3, letterSpacing: 1 },
        ),
        image("p11-building", secondary, 30, 214, 300, 156, {
          effects: {
            brightness: 108,
            contrast: 120,
            saturation: 0,
            blur: 0,
            grayscale: 100,
            sepia: 5,
          },
        }),
        shape("p11-rule", "line", "horizontal", 30, 392, 300, 8, ink),
        text("p11-sub", subtitle, 30, 414, 220, 38, 14, ink, {
          lineHeight: 1.1,
        }),
        text(
          "p11-address",
          "BRANDENBURGISCHE STR. 65\nBERLIN",
          30,
          558,
          160,
          34,
          8,
          ink,
          { lineHeight: 1.2 },
        ),
      ];
    case 12:
      return [
        shape("p12-white", "rectangle", "rectangle", 0, 0, 360, 640, accent),
        text("p12-title", title, 16, 30, 328, 122, 70, ink, {
          lineHeight: 0.72,
          letterSpacing: -5,
        }),
        text("p12-vertical", "2027 KERNING SELECT", 286, 156, 58, 106, 9, ink, {
          textAlign: "right",
          lineHeight: 1.2,
        }),
        shape("p12-grid1", "line", "vertical", 78, 174, 8, 290, ink),
        shape("p12-grid2", "line", "vertical", 178, 174, 8, 290, ink),
        image("p12-image", secondary, 198, 344, 132, 86, {
          blendMode: "multiply",
        }),
        text("p12-copy", credits, 20, 524, 320, 74, 8, ink, {
          lineHeight: 1.15,
          letterSpacing: 1,
        }),
      ];
    case 13:
      return [
        shape("p13-acid", "rectangle", "rectangle", 0, 0, 360, 640, accent),
        image("p13-face", secondary, 52, 118, 256, 354, {
          blendMode: "multiply",
          effects: {
            brightness: 108,
            contrast: 140,
            saturation: 0,
            blur: 0,
            grayscale: 100,
            sepia: 0,
          },
        }),
        shape("p13-orbit", "icon", "orbit", 104, 210, 152, 152, ink),
        text("p13-title", title, 18, 26, 324, 82, 66, ink, {
          textAlign: "center",
          letterSpacing: -4,
        }),
        text("p13-sub", subtitle, 34, 520, 292, 24, 11, ink, {
          textAlign: "center",
          letterSpacing: 3,
        }),
      ];
    case 14:
      return [
        shape("p14-paper", "rectangle", "rectangle", 0, 0, 360, 640, accent),
        image("p14-left", secondary, 24, 24, 214, 414, {
          positionX: 30,
          opacity: 0.85,
        }),
        image("p14-right", secondary, 122, 80, 214, 414, {
          positionX: 72,
          blendMode: "difference",
          opacity: 0.65,
        }),
        text("p14-title", title, 26, 448, 308, 88, 54, ink, {
          lineHeight: 0.82,
          letterSpacing: -3,
        }),
        text("p14-sub", subtitle, 28, 550, 304, 20, 10, ink, {
          letterSpacing: 2,
        }),
      ];
    case 15:
      return [
        shape("p15-white", "rectangle", "rectangle", 0, 0, 360, 640, accent),
        image("p15-small", secondary, 112, 168, 136, 210, {
          effects: {
            brightness: 110,
            contrast: 150,
            saturation: 0,
            blur: 0,
            grayscale: 100,
            sepia: 0,
          },
        }),
        image("p15-noise", textureUrl, 0, 0, 360, 640, {
          opacity: 0.2,
          blendMode: "multiply",
        }),
        text("p15-title", title, 24, 28, 312, 70, 58, ink, {
          textAlign: "center",
          letterSpacing: -4,
        }),
        text("p15-sub", subtitle, 58, 416, 244, 24, 12, ink, {
          textAlign: "center",
          letterSpacing: 4,
        }),
        text("p15-credit", credits, 36, 558, 288, 46, 7, ink, {
          textAlign: "center",
          lineHeight: 1.2,
        }),
      ];
    case 16:
      return [
        shape("p16-dark", "rectangle", "rectangle", 0, 0, 360, 640, accent),
        image("p16-fire", secondary, 0, 0, 360, 500, {
          blendMode: "screen",
          opacity: 0.82,
        }),
        shape("p16-block", "rectangle", "rectangle", 22, 364, 316, 126, ink),
        text("p16-title", title, 34, 380, 292, 72, 52, accent, {
          letterSpacing: -3,
        }),
        text("p16-sub", subtitle, 36, 512, 288, 22, 11, ink, {
          letterSpacing: 3,
        }),
        text("p16-credit", credits, 36, 564, 288, 40, 7, ink, {
          lineHeight: 1.2,
        }),
      ];
    case 17:
      return [
        shape("p17-sky", "rectangle", "rectangle", 0, 0, 360, 640, accent),
        image("p17-land", secondary, 0, 0, 360, 380, { positionY: 68 }),
        shape("p17-window", "rectangle", "rectangle", 92, 108, 176, 176, ink),
        image("p17-window-image", secondary, 104, 120, 152, 152, {
          positionX: 20,
        }),
        text("p17-title", title, 28, 406, 304, 92, 58, ink, {
          textAlign: "center",
          lineHeight: 0.82,
          letterSpacing: -3,
        }),
        text("p17-sub", subtitle, 40, 526, 280, 22, 11, ink, {
          textAlign: "center",
          letterSpacing: 3,
        }),
      ];
    case 18:
      return [
        shape("p18-black", "rectangle", "rectangle", 0, 0, 360, 640, accent),
        image("p18-signal", secondary, 30, 104, 300, 366, {
          blendMode: "screen",
          effects: {
            brightness: 112,
            contrast: 160,
            saturation: 30,
            blur: 0,
            grayscale: 60,
            sepia: 0,
          },
        }),
        image("p18-static", textureUrl, 0, 0, 360, 640, {
          opacity: 0.35,
          blendMode: "overlay",
        }),
        text("p18-title", title, 18, 28, 324, 112, 58, ink, {
          lineHeight: 0.78,
          letterSpacing: -4,
        }),
        shape("p18-wave", "icon", "audio-waveform", 124, 478, 112, 112, ink),
        text("p18-sub", subtitle, 34, 600, 292, 18, 9, ink, {
          textAlign: "center",
          letterSpacing: 3,
        }),
      ];
    default:
      return [
        shape("p19-paper", "rectangle", "rectangle", 0, 0, 360, 640, accent),
        image("p19-botanical", secondary, 0, 0, 360, 640, {
          blendMode: "multiply",
          opacity: 0.9,
        }),
        image("p19-grain", textureUrl, 0, 0, 360, 640, {
          opacity: 0.22,
          blendMode: "multiply",
        }),
        shape(
          "p19-label",
          "rectangle",
          "rectangle",
          28,
          176,
          304,
          288,
          "#EFE8D5",
        ),
        text("p19-title", title, 42, 200, 276, 226, 54, ink, {
          textAlign: "center",
          lineHeight: 0.78,
          letterSpacing: -4,
        }),
        shape("p19-butterfly", "icon", "sparkles", 154, 448, 52, 52, ink),
        text("p19-sub", subtitle, 52, 566, 256, 22, 10, ink, {
          textAlign: "center",
          letterSpacing: 2,
        }),
      ];
  }
}

type InspiredMeta = readonly [string, string, string, string];

function inspiredSettings(
  aspectRatio: CardAspectRatio,
  meta: InspiredMeta,
  index: number,
): CardSettings {
  const [, , accent, ink] = meta;
  return {
    aspectRatio,
    fill:
      index % 3 === 1
        ? {
            type: "linear-gradient",
            angle: index % 2 ? 145 : 25,
            stops: [
              { id: `inspired-${index}-a`, color: accent, position: 0 },
              { id: `inspired-${index}-b`, color: ink, position: 100 },
            ],
          }
        : { type: "solid", color: accent },
    texture:
      index % 3 === 0
        ? {
            ...createDefaultTextureFill(index % 2 ? "halftone" : "paper"),
            opacity: 0.16,
          }
        : null,
    opacity: 1,
    blur: 0,
    borderWidth: 0,
    borderStyle: "solid",
    borderColor: "#000000",
  };
}

function inspiredNodes(
  meta: InspiredMeta,
  index: number,
  category: EditorTemplate["category"],
): EditorNode[] {
  const [title, subtitle, accent, ink] = meta;
  const prefix = `inspired-${category.toLowerCase().replaceAll(" ", "-")}-${index}`;
  const portrait = PORTRAITS[(index + 10) % PORTRAITS.length] ?? "";
  const object = OBJECTS[(index * 3 + 7) % OBJECTS.length] ?? "";
  const textureUrl = TEXTURES[(index + 6) % TEXTURES.length] ?? "";

  if (category === "Album covers") {
    const layouts: EditorNode[][] = [
      [
        image(`${prefix}-texture`, textureUrl, 0, 0, 500, 500, {
          opacity: 0.3,
          blendMode: "overlay",
        }),
        shape(`${prefix}-disc`, "ellipse", "circle", 84, 60, 332, 332, ink),
        image(`${prefix}-image`, object, 128, 92, 244, 276, {
          blendMode: "screen",
          opacity: 0.8,
        }),
        text(`${prefix}-title`, title, 24, 350, 452, 92, 64, accent, {
          textAlign: "center",
          lineHeight: 0.8,
          letterSpacing: -4,
        }),
        text(`${prefix}-meta`, subtitle, 32, 464, 436, 14, 9, accent, {
          textAlign: "center",
          letterSpacing: 3,
        }),
      ],
      [
        text(`${prefix}-title`, title, 34, 38, 432, 132, 70, ink, {
          lineHeight: 0.78,
          letterSpacing: -5,
        }),
        shape(`${prefix}-rule`, "line", "horizontal", 36, 194, 428, 5, ink),
        text(`${prefix}-sub`, subtitle, 36, 214, 260, 20, 11, ink, {
          letterSpacing: 3,
        }),
        text(`${prefix}-no`, `0${index + 1}`, 352, 350, 112, 96, 76, ink, {
          textAlign: "right",
          fontWeight: 500,
        }),
      ],
      [
        image(`${prefix}-photo`, portrait, 42, 42, 416, 344, {
          effects: {
            brightness: 96,
            contrast: 135,
            saturation: 0,
            blur: 0,
            grayscale: 100,
            sepia: 0,
          },
        }),
        image(`${prefix}-grain`, textureUrl, 42, 42, 416, 344, {
          opacity: 0.3,
          blendMode: "multiply",
        }),
        text(`${prefix}-title`, title, 26, 330, 448, 112, 62, ink, {
          textAlign: "center",
          lineHeight: 0.82,
          letterSpacing: -4,
        }),
        text(`${prefix}-meta`, subtitle, 30, 460, 440, 16, 10, ink, {
          textAlign: "center",
          letterSpacing: 3,
        }),
      ],
      [
        shape(
          `${prefix}-frame`,
          "rectangle",
          "rectangle",
          30,
          30,
          440,
          440,
          ink,
        ),
        image(`${prefix}-object`, object, 62, 62, 376, 286, {
          blendMode: "multiply",
          opacity: 0.88,
        }),
        text(`${prefix}-title`, title, 54, 362, 392, 56, 42, accent, {
          textAlign: "center",
          letterSpacing: -2,
        }),
        text(`${prefix}-sub`, subtitle, 56, 438, 388, 14, 9, accent, {
          textAlign: "center",
          letterSpacing: 4,
        }),
      ],
      [
        image(`${prefix}-chrome`, object, 0, 0, 500, 500, {
          effects: {
            brightness: 76,
            contrast: 150,
            saturation: 20,
            blur: 0,
            grayscale: 60,
            sepia: 0,
          },
        }),
        text(`${prefix}-title`, title, 20, 26, 460, 144, 78, ink, {
          textAlign: "center",
          lineHeight: 0.74,
          letterSpacing: -6,
        }),
        text(`${prefix}-meta`, subtitle, 26, 454, 448, 18, 10, ink, {
          textAlign: "center",
          letterSpacing: 4,
        }),
      ],
    ];
    return layouts[index % layouts.length] ?? [];
  }

  if (category === "Movie posters") {
    return [
      image(
        `${prefix}-image`,
        index % 2 ? object : portrait,
        22,
        22,
        316,
        index % 3 ? 438 : 520,
        {
          effects: {
            brightness: 92,
            contrast: 125,
            saturation: index % 3 === 1 ? 0 : 70,
            blur: 0,
            grayscale: index % 3 === 1 ? 100 : 20,
            sepia: index % 4 === 0 ? 18 : 0,
          },
        },
      ),
      index % 3 === 2
        ? image(`${prefix}-veil`, textureUrl, 0, 0, 360, 640, {
            opacity: 0.24,
            blendMode: "multiply",
          })
        : shape(
            `${prefix}-mark`,
            index % 2 ? "line" : "ellipse",
            index % 2 ? "vertical" : "circle",
            306,
            28,
            24,
            24,
            ink,
          ),
      text(
        `${prefix}-title`,
        title,
        22,
        index % 3 ? 478 : 378,
        316,
        112,
        index % 2 ? 48 : 58,
        ink,
        {
          textAlign: index % 2 ? "left" : "center",
          lineHeight: 0.82,
          letterSpacing: -3,
        },
      ),
      text(`${prefix}-sub`, subtitle, 28, 596, 304, 28, 9, ink, {
        textAlign: "center",
        letterSpacing: 2,
        lineHeight: 1.2,
      }),
    ];
  }

  if (category === "Business cards") {
    const [name, role] = subtitle.split(" — ");
    return [
      index % 3 === 1
        ? shape(
            `${prefix}-block`,
            "rectangle",
            "rectangle",
            0,
            0,
            188,
            320,
            ink,
          )
        : shape(
            `${prefix}-rule`,
            "line",
            index % 2 ? "vertical" : "horizontal",
            index % 2 ? 280 : 26,
            index % 2 ? 22 : 112,
            index % 2 ? 4 : 508,
            index % 2 ? 276 : 4,
            ink,
          ),
      index === 9
        ? image(`${prefix}-concrete`, textureUrl, 326, 0, 234, 320, {
            opacity: 0.5,
            blendMode: "multiply",
          })
        : shape(`${prefix}-index`, "ellipse", "circle", 500, 26, 30, 30, ink),
      text(
        `${prefix}-title`,
        title,
        index % 3 === 1 ? 214 : 28,
        26,
        index % 3 === 1 ? 316 : 420,
        72,
        index % 2 ? 38 : 27,
        ink,
        { fontWeight: 500, letterSpacing: index === 3 ? -2 : 0 },
      ),
      text(
        `${prefix}-name`,
        name ?? subtitle,
        index % 3 === 1 ? 214 : 28,
        220,
        300,
        28,
        17,
        ink,
        { fontWeight: 500 },
      ),
      text(
        `${prefix}-meta`,
        `${role ?? "Creative practice"}\nhello@${title.toLowerCase().replace(/[^a-z]+/g, "")}.studio`,
        index % 3 === 1 ? 214 : 28,
        254,
        300,
        42,
        9,
        ink,
        { lineHeight: 1.4, letterSpacing: 0.5 },
      ),
    ];
  }

  return [
    image(
      `${prefix}-image`,
      index % 2 ? object : portrait,
      index % 2 ? 394 : 0,
      0,
      246,
      360,
      { opacity: 0.72, blendMode: index % 3 === 0 ? "multiply" : "normal" },
    ),
    text(`${prefix}-index`, `0${index + 1} / 10`, 26, 24, 128, 18, 9, ink, {
      letterSpacing: 2,
    }),
    text(
      `${prefix}-title`,
      title,
      index % 2 ? 28 : 278,
      74,
      334,
      150,
      index === 9 ? 62 : 48,
      ink,
      {
        lineHeight: 0.82,
        letterSpacing: index === 9 ? -5 : -3,
        fontWeight: 500,
      },
    ),
    shape(
      `${prefix}-rule`,
      "line",
      "horizontal",
      index % 2 ? 30 : 280,
      270,
      304,
      4,
      ink,
    ),
    text(
      `${prefix}-meta`,
      subtitle,
      index % 2 ? 30 : 280,
      296,
      304,
      30,
      10,
      ink,
      { letterSpacing: 1, lineHeight: 1.25 },
    ),
  ];
}

function makeInspiredTemplate(
  meta: InspiredMeta,
  index: number,
  category: EditorTemplate["category"],
  ordinal: number,
): EditorTemplate {
  const dimensions =
    category === "Album covers"
      ? {
          width: 500,
          height: 500,
          aspectRatio: "1:1" as const,
          prefix: "album",
        }
      : category === "Movie posters"
        ? {
            width: 360,
            height: 640,
            aspectRatio: "9:16" as const,
            prefix: "poster",
          }
        : category === "Business cards"
          ? {
              width: 560,
              height: 320,
              aspectRatio: "business-card" as const,
              prefix: "business-card",
            }
          : {
              width: 640,
              height: 360,
              aspectRatio: "16:9" as const,
              prefix: "pitch-deck",
            };
  const id = `${dimensions.prefix}-${ordinal}`;

  return {
    id,
    name: meta[0],
    category,
    aspectRatio: dimensions.aspectRatio,
    card: {
      id,
      name: meta[0],
      width: dimensions.width,
      height: dimensions.height,
      settings: inspiredSettings(dimensions.aspectRatio, meta, index),
      nodes: inspiredNodes(meta, index, category),
    },
  };
}

function makeTemplate(
  spec: TemplateSpec,
  index: number,
  category: EditorTemplate["category"],
): EditorTemplate {
  const isAlbum = category === "Album covers";
  const width = isAlbum ? 500 : 360;
  const height = isAlbum ? 500 : 640;
  const aspectRatio = isAlbum ? "1:1" : "9:16";
  const prefix = isAlbum ? "album" : "poster";

  return {
    id: `${prefix}-${index + 1}`,
    name: spec.title,
    category,
    aspectRatio,
    card: {
      id: `${prefix}-${index + 1}`,
      name: spec.title,
      width,
      height,
      settings:
        !isAlbum && index < POSTER_ART.length
          ? posterSettings(spec.background)
          : settings(aspectRatio, spec, index),
      nodes: isAlbum ? albumNodes(spec, index) : posterNodes(spec, index),
    },
  };
}

// Retain the previous generators while saved projects can still reference
// their IDs. They are deliberately not exported in the refreshed catalog.
void [
  INSPIRED_ALBUM_META,
  INSPIRED_POSTER_META,
  INSPIRED_BUSINESS_CARD_META,
  ALBUMS,
  POSTERS,
  businessCardNodes,
  typographyOnlyCardSettings,
  makeTemplate,
];

type VisualGuide = {
  name: string;
  title: string;
  subtitle: string;
  background: string;
  ink: string;
  accent: string;
  image: number | null;
};

// Editorial photography gathered from the Pinterest reference sweep requested
// for this revamp. Keeping the pool separate makes image art direction easy to
// update without touching template geometry.
const PINTEREST_IMAGES = [
  "https://i.pinimg.com/236x/7c/4f/de/7c4fdeea720deeb307e8c8db32da3676.jpg",
  "https://i.pinimg.com/webp80/236x/fd/0d/7e/fd0d7eb9331c6f213ac043293f59776a.webp",
  "https://i.pinimg.com/236x/f6/16/d2/f616d29e69bda0b3345a50b0d12f7d69.jpg",
  "https://i.pinimg.com/236x/f0/32/cf/f032cfa28dbfba208b5e674e26a13987.jpg",
  "https://i.pinimg.com/webp80/236x/e0/2b/76/e02b76a828d87a73f30bb6ba0c33f7c3.webp",
  "https://i.pinimg.com/webp80/236x/e1/0e/e1/e10ee1b575c48886e109f6f21b6a388b.webp",
  "https://i.pinimg.com/webp80/236x/f7/cd/65/f7cd65fc01243fb5319024ed0673851f.webp",
  "https://i.pinimg.com/webp80/236x/6f/cd/a5/6fcda51cda341ebc8d8f149ba466c5cc.webp",
  "https://i.pinimg.com/webp80/236x/33/5b/c4/335bc495157887fb5ff7268d29252257.webp",
  "https://i.pinimg.com/236x/ad/96/35/ad96352b7a2e19e92e5f6cca15b78800.jpg",
  "https://i.pinimg.com/webp80/236x/f0/33/40/f033406310ffdface662a7c96713d6e9.webp",
  "https://i.pinimg.com/webp80/236x/f9/c9/42/f9c942e62ac761e3886b0e0c7805e865.webp",
  "https://i.pinimg.com/webp/474x/25/e1/48/25e148f9193572d2b024ccafca669660.webp",
  "https://i.pinimg.com/webp/474x/9d/aa/cf/9daacf89f632087c7a8d4f4b9e8ab69d.webp",
  "https://i.pinimg.com/474x/f9/6d/8f/f96d8ff810fd96cffffac92426816295.jpg",
  "https://i.pinimg.com/webp/474x/c4/79/f7/c479f75d5f3b4fcc9cfc12f294596c7f.webp",
  "https://i.pinimg.com/webp/474x/35/bb/02/35bb0285570667b4b3d925f1cf75599e.webp",
  "https://i.pinimg.com/236x/81/cf/ec/81cfeca9fbec08166e009f3ab18fc0ba.jpg",
  "https://i.pinimg.com/webp/474x/53/9a/e9/539ae921074825dab5138d71aaf8aa45.webp",
  "https://i.pinimg.com/webp/474x/87/ff/10/87ff107f4ae72488ed8dc2fbb073cb33.webp",
  "https://i.pinimg.com/236x/81/35/5a/81355a29d6ea942d9574607034af8ee2.jpg",
  "https://i.pinimg.com/webp80/236x/fa/00/c4/fa00c4c853d80dfaebc94055899c8d40.webp",
  "https://i.pinimg.com/webp80/236x/10/a8/17/10a817e4a0d1f827b3bd90640b874abc.webp",
  "https://i.pinimg.com/webp80/236x/e8/7f/1a/e87f1afc393a8f1a25583340cb342ea5.webp",
  "https://i.pinimg.com/webp80/236x/04/9f/10/049f1085cf4c172ea8d971fedf033b48.webp",
  "https://i.pinimg.com/236x/64/eb/a2/64eba200e820aee9b48f54d10a5dbdd6.jpg",
  "https://i.pinimg.com/webp80/236x/db/bc/7a/dbbc7a02e4b6fa7bba2d20eb7bfdef13.webp",
  "https://i.pinimg.com/webp80/236x/f2/af/2e/f2af2efa49d3d100f231f7647b0f7b5b.webp",
] as const;

const ALBUM_GUIDES: VisualGuide[] = [
  { name: "Swiss Modernism", title: "CONCRETE / AIR", subtitle: "NORA FIELD · 2026", background: "#F2F1EC", ink: "#111111", accent: "#D9271C", image: 0 },
  { name: "Dream Pop", title: "soft weather", subtitle: "01 bloom · 02 closer · 03 violet", background: "#D9D2E8", ink: "#4C3D58", accent: "#F2B9A8", image: 11 },
  { name: "Brutalist", title: "PUBLIC\nNOISE", subtitle: "NO. 004 / SOUTH BLOCK", background: "#E8E5DE", ink: "#111111", accent: "#E73125", image: 12 },
  { name: "Luxury Fashion", title: "ÉLAN", subtitle: "MAISON 07 · PARIS", background: "#EEE7DA", ink: "#28221F", accent: "#A78443", image: 13 },
  { name: "Japanese Editorial", title: "静かな構造", subtitle: "QUIET STRUCTURES · TOKYO", background: "#EEECE4", ink: "#20201E", accent: "#B83A2F", image: 4 },
  { name: "Y2K Electronica", title: "CHROME//HEART", subtitle: "NOVA SYSTEM · 2001", background: "#10121B", ink: "#EAFBFF", accent: "#72E6FF", image: 7 },
  { name: "Indie Folk", title: "borrowed summer", subtitle: "MOTEL RADIO · live from the pines", background: "#D8C7A7", ink: "#3B2F25", accent: "#8A4B35", image: 10 },
  { name: "Jazz Classic", title: "BLUE\nHOUR", subtitle: "THEO BLUE QUARTET · SESSIONS 01–08", background: "#172238", ink: "#F0E4C2", accent: "#C7A748", image: 20 },
  { name: "Afrofuturism", title: "LAGOS / ORBIT", subtitle: "AYO KORA · TRANSMISSION ONE", background: "#163A55", ink: "#FFF0BE", accent: "#F36A2D", image: 15 },
  { name: "Bauhaus", title: "FORM / 20", subtitle: "STUDY IN PRIMARY RHYTHM", background: "#F1EBDD", ink: "#131313", accent: "#E12B24", image: null },
  { name: "Cinematic Orchestra", title: "THE DISTANT VALLEY", subtitle: "ORIGINAL SCORE · ELIAS MOREAU", background: "#D8DFE1", ink: "#1C2529", accent: "#7C8C91", image: 9 },
  { name: "Punk Zine", title: "NO\nSAINTS", subtitle: "SIDE A · LOUDER THAN PROOF", background: "#E7E2D8", ink: "#101010", accent: "#D2231D", image: 12 },
  { name: "Minimal Techno", title: "phase_04", subtitle: "128 BPM · BERLIN · 04:12", background: "#101113", ink: "#D8DADC", accent: "#B8FF2C", image: 6 },
  { name: "Psychedelic Rock", title: "MIND FLOWER", subtitle: "PRISM CHILD · A STEREO DREAM", background: "#F04D9C", ink: "#24134A", accent: "#FFE43B", image: 5 },
  { name: "Soul & R&B", title: "SLOW BURN", subtitle: "AMARA NINE · VOL. I", background: "#B98A61", ink: "#2B1914", accent: "#E6C179", image: 16 },
  { name: "Experimental Typography", title: "TYPE\nMOVES", subtitle: "A STUDY IN COLLISION", background: "#E7E4DD", ink: "#171717", accent: "#7157FF", image: null },
  { name: "Ambient", title: "almost still", subtitle: "FIELD RECORDINGS · 06:14:09", background: "#E6ECEE", ink: "#657278", accent: "#B8CBD3", image: 11 },
  { name: "Neo-Noir", title: "AFTER\nMIDNIGHT", subtitle: "VANTA · NO WITNESSES", background: "#090A0C", ink: "#E8E4DE", accent: "#B91925", image: 18 },
  { name: "Retro Print", title: "GOLDEN SIGNAL", subtitle: "CAT. 1974 · STEREO", background: "#E6D3A8", ink: "#452C20", accent: "#C75B35", image: 2 },
  { name: "Contemporary Creative Agency", title: "NEW / COMMON", subtitle: "AN AUDIO IDENTITY BY FIELD OFFICE", background: "#F3EFE6", ink: "#171717", accent: "#4B47FF", image: 14 },
];

const MOVIE_GUIDES: VisualGuide[] = [
  { name: "A24 Drama", title: "A quiet measure", subtitle: "A film by Mara Sen", background: "#D8CDBD", ink: "#25211D", accent: "#8D7762", image: 13 },
  { name: "Blockbuster Sci-Fi", title: "ORBITAL", subtitle: "THE FUTURE HAS ONE SURVIVOR", background: "#071A31", ink: "#E6FAFF", accent: "#20D8F5", image: 7 },
  { name: "Psychological Thriller", title: "THE OTHER VOICE", subtitle: "SHE HEARD IT FIRST", background: "#D9D9D5", ink: "#151515", accent: "#676767", image: 18 },
  { name: "Vintage Horror", title: "THE RED ROOM", subtitle: "IT WAS NEVER EMPTY", background: "#D9C7A8", ink: "#2B211B", accent: "#9F1C19", image: 22 },
  { name: "Indie Coming-of-Age", title: "summer, maybe", subtitle: "WE THOUGHT IT WOULD LAST", background: "#C8D1B7", ink: "#33402E", accent: "#E78045", image: 10 },
  { name: "Neo-Noir", title: "BLACK TIDE", subtitle: "EVERY SHADOW HAS A WITNESS", background: "#08090B", ink: "#F0E8DD", accent: "#C41E2A", image: 24 },
  { name: "Documentary", title: "COMMON GROUND", subtitle: "TEN VOICES. ONE STREET. A DOCUMENTARY.", background: "#E5E2DA", ink: "#242522", accent: "#66756E", image: 8 },
  { name: "Fantasy Epic", title: "The Gilded Hour", subtitle: "BEYOND THE LAST KINGDOM", background: "#173C35", ink: "#F0D9A2", accent: "#B58A3B", image: 9 },
  { name: "Minimal Arthouse", title: "The empty room", subtitle: "A STUDY OF ABSENCE", background: "#EEECE7", ink: "#1D1D1B", accent: "#C6BCAF", image: 21 },
  { name: "70s Cinema", title: "MATINÉE '74", subtitle: "ONE SUMMER CHANGED THE PICTURE", background: "#D9A62E", ink: "#3B2519", accent: "#C84B2F", image: 5 },
  { name: "Japanese Minimalism", title: "光の家", subtitle: "HOUSE OF LIGHT · 2026", background: "#EEECE5", ink: "#22221F", accent: "#B33A31", image: 4 },
  { name: "Crime Film", title: "COLD CITY", subtitle: "NO STREET FORGIVES", background: "#162131", ink: "#E5E1D8", accent: "#526174", image: 1 },
  { name: "Romance", title: "A Small Forever", subtitle: "LOVE ARRIVES WITHOUT A MAP", background: "#EAD7D3", ink: "#55353A", accent: "#B66C76", image: 25 },
  { name: "Action", title: "IMPACT", subtitle: "NO TIME TO LOOK BACK", background: "#19364A", ink: "#F7EEE3", accent: "#F16A2B", image: 3 },
  { name: "Experimental Festival Poster", title: "FRAME / BREAK", subtitle: "OFFICIAL SELECTION · BERLIN 2026", background: "#E9E5DC", ink: "#161616", accent: "#FF4B27", image: 17 },
  { name: "Biopic", title: "VERONIQUE", subtitle: "THE LIFE BEHIND THE LIGHT", background: "#A36E50", ink: "#F1E4D1", accent: "#C99E6D", image: 14 },
  { name: "Cyberpunk", title: "NULL//CITY", subtitle: "MEMORY IS THE NEW CONTRABAND", background: "#090B16", ink: "#D7FAFF", accent: "#FF3CA6", image: 17 },
  { name: "Animated Film", title: "Milo & the Moon", subtitle: "THE SKY IS CLOSER THAN YOU THINK", background: "#76C9E8", ink: "#23355C", accent: "#FFD44C", image: 11 },
  { name: "Fashion Film", title: "Élan No. 4", subtitle: "A FILM FOR MAISON ÉLAN", background: "#EAE2D6", ink: "#29231F", accent: "#9B7B52", image: 16 },
  { name: "Swiss Editorial", title: "THE BUILT WORLD", subtitle: "A FILM BY NORA FIELD · 94 MIN", background: "#F0F0EC", ink: "#111111", accent: "#D42C23", image: 0 },
];

void MOVIE_GUIDES;

const BUSINESS_GUIDES = [
  ["Swiss Identity", "NOAH WILLIAMS", "Independent designer", "#F4F3EE", "#111111", "#D32920"],
  ["Luxury Studio", "Camille Laurent", "Maison Élan · Paris", "#EFE6D7", "#2E2722", "#A98242"],
  ["Creative Agency", "AMARA", "Field Office · Creative direction", "#FF5A3D", "#241A42", "#FFF45C"],
  ["Brutalist", "OKOYE", "Image maker / Lagos", "#E8FF2F", "#111111", "#111111"],
  ["Japanese Editorial", "佐藤 由紀", "Yuki Sato · Spatial designer", "#EFEDE6", "#20201E", "#B33930"],
  ["Architect", "MIKA CHEN", "Architecture · Urban systems", "#D8D9D4", "#303330", "#6D7773"],
  ["Fashion Brand", "Atelier Rue", "Inès Morel · Direction", "#D8CEC2", "#332B27", "#8C7567"],
  ["Modern Tech Founder", "tobi adeyemi", "Founder · kernel.works", "#FFFFFF", "#17223A", "#356BFF"],
  ["Music Producer", "NOVA SYSTEM", "Production · sound · London", "#101218", "#F1F7FA", "#69DFF1"],
  ["Bauhaus", "LINA ORTIZ", "Form / space / identity", "#EFE9DA", "#111111", "#E33227"],
  ["Consulting Firm", "NORTH & CO.", "Strategy for changing markets", "#15233B", "#F4F2EA", "#A8B9D2"],
  ["Editorial Magazine", "RINA BELL", "Editorial designer · Issue 04", "#EFECE4", "#191919", "#F04C2F"],
  ["Experimental Type", "TYPE/PLAY", "Olu Femi · Creative coder", "#E8E5DE", "#171717", "#7257FF"],
  ["Monospace Identity", "> EVAN_LIN", "design.engineering@mono.studio", "#F4F4F0", "#111111", "#5A6A61"],
  ["Design Engineer", "ada mensah", "design engineer · systems", "#E7ECEA", "#19312B", "#3E786A"],
  ["Creative Director", "PARK", "Jude Park · Creative direction", "#111111", "#F4F0E8", "#FF4C25"],
  ["Minimal Luxury", "Sofia Rossi", "Studio · Milano", "#F5F0E6", "#514942", "#B9A58D"],
  ["Record Label", "SOUTH BLOCK", "Releases · artists · production", "#1A1A1A", "#F0EEE8", "#D04A3A"],
  ["Neo-Brutalist", "GOOD TROUBLE", "Maya Cole · Agency founder", "#704CFF", "#FFF36A", "#19132E"],
  ["Corporate Reimagined", "PARALLEL PRACTICE", "Ada Mensah · Managing partner", "#E8EBEE", "#17243A", "#54739A"],
] as const;

const SPECIMEN_GUIDES = [
  ["Display Serif", "Aa", "Belle de Mai", "#EFEEE8", "#111111", "#9C2F28"],
  ["Modern Grotesk", "Rr", "Neue Form", "#F2F2EE", "#141414", "#3159D8"],
  ["High Contrast", "Kk", "Bodoni Study", "#E9E7E1", "#111111", "#B33B2E"],
  ["Soft Geometry", "Gg", "Circular Notes", "#D9E8E4", "#19332D", "#E96852"],
  ["Condensed Impact", "Nn", "Narrow No. 8", "#F4D93C", "#191919", "#EF4B2F"],
  ["Humanist Sans", "Rr", "Open Field", "#E8D7C9", "#352B26", "#68806F"],
  ["Editorial Roman", "Qq", "Publico", "#EEE7DA", "#27211E", "#A47440"],
  ["Mono System", "01", "Input Mono", "#101314", "#D6E5DE", "#76FFB1"],
  ["Neo Slab", "Mm", "Monument", "#DDE0E8", "#1A2232", "#E14B35"],
  ["Playful Variable", "Ww", "Flex Family", "#FF9FC8", "#342048", "#FFF24D"],
  ["Quiet Sans", "Hh", "Still", "#E7ECEE", "#5D6B70", "#B4CCD4"],
  ["Blackletter Remix", "Fr", "Fraktur 2026", "#151515", "#F2E9D9", "#E13A2E"],
  ["Swiss Rational", "Aa", "Akzidenz", "#F3F2EC", "#111111", "#E33127"],
  ["Techno Extended", "XR", "Grid Extended", "#171A24", "#E9F7FF", "#6DE5FF"],
  ["Organic Serif", "Ss", "Canopy", "#C9D0B6", "#26301F", "#A3593D"],
  ["Italian Modern", "Aa", "Forma", "#F0E8DD", "#27221E", "#D55038"],
  ["Rounded Display", "Oo", "Orbit", "#82D7EE", "#243354", "#FFD94D"],
  ["Sharp Editorial", "Vv", "Vantage", "#E8E4DE", "#161616", "#6B50F5"],
  ["Stencil System", "R4", "Raster", "#E5FF39", "#171717", "#F04A2B"],
  ["Chromatic Type", "Aa", "Spectrum", "#38246A", "#FFF1C9", "#FF6EA9"],
] as const;

function solidTemplateSettings(
  aspectRatio: CardAspectRatio,
  color: string,
  paper = false,
): CardSettings {
  const paperTexture = paper ? createDefaultTextureFill("paper") : null;
  return {
    aspectRatio,
    fill: { type: "solid", color },
    texture: paperTexture ? { ...paperTexture, opacity: 0.1 } : null,
    opacity: 1,
    blur: 0,
    borderWidth: 0,
    borderStyle: "solid",
    borderColor: "#000000",
  };
}

function guidedImage(
  id: string,
  imageIndex: number,
  x: number,
  y: number,
  width: number,
  height: number,
  options: Partial<ImageNode> = {},
) {
  return image(
    id,
    PINTEREST_IMAGES[imageIndex % PINTEREST_IMAGES.length] ?? "",
    x,
    y,
    width,
    height,
    options,
  );
}

const ALBUM_IMAGE_BOXES = [
  [190, 28, 282, 338],
  [28, 126, 444, 316],
  [24, 24, 452, 452],
  [214, 24, 262, 452],
  [28, 78, 444, 330],
] as const;

function albumGuideNodes(guide: VisualGuide, index: number): EditorNode[] {
  const nodes: EditorNode[] = [];
  if (guide.image !== null) {
    const [x, y, width, height] = ALBUM_IMAGE_BOXES[index % ALBUM_IMAGE_BOXES.length] ?? ALBUM_IMAGE_BOXES[0];
    nodes.push(
      guidedImage(`album-${index}-image`, guide.image, x, y, width, height, {
        effects: {
          brightness: index === 17 ? 58 : 100,
          contrast: index === 2 || index === 11 ? 132 : 106,
          saturation: [0, 2, 4, 7, 10, 11, 16, 17].includes(index) ? 0 : 88,
          blur: index === 1 || index === 16 ? 2 : 0,
          grayscale: [0, 2, 4, 7, 10, 11, 16, 17].includes(index) ? 100 : 0,
          sepia: index === 6 || index === 18 ? 24 : 0,
        },
      }),
    );
  }

  if (index === 9) {
    nodes.push(
      shape("album-9-circle", "ellipse", "circle", 288, 54, 154, 154, "#2349C7"),
      shape("album-9-rect", "rectangle", "rectangle", 72, 210, 318, 86, guide.accent),
      shape("album-9-small", "ellipse", "circle", 48, 334, 92, 92, "#F0C72D"),
    );
  }

  if (index === 15) {
    nodes.push(
      text("album-15-first", "T", 18, 34, 250, 270, 254, guide.ink, { letterSpacing: -18, lineHeight: 0.75 }),
      text("album-15-last", "Y", 228, 164, 250, 270, 254, guide.accent, { letterSpacing: -18, lineHeight: 0.75 }),
    );
  }

  const titleSizes = [70, 54, 82, 66, 43, 58, 45, 68, 52, 54, 44, 80, 30, 56, 54, 48, 24, 64, 50, 62];
  const titleY = [34, 38, 20, 34, 30, 344, 34, 28, 350, 338, 390, 24, 32, 354, 34, 374, 34, 330, 38, 340];
  const titleWidth = index === 4 ? 78 : index === 19 ? 448 : 444;
  nodes.push(
    text(`album-${index}-title`, guide.title, 28, titleY[index] ?? 32, titleWidth, 130, titleSizes[index] ?? 56, guide.ink, {
      fontWeight: [1, 3, 4, 6, 10, 14, 16, 18].includes(index) ? 500 : 800,
      lineHeight: index === 2 || index === 11 || index === 17 ? 0.78 : 0.88,
      letterSpacing: index === 5 || index === 12 || index === 17 ? 4 : index === 2 ? -5 : -2,
      textCasing: index === 1 || index === 6 || index === 16 ? "lowercase" : "none",
    }),
    text(`album-${index}-meta`, guide.subtitle, index % 3 === 0 ? 30 : 286, 456, index % 3 === 0 ? 300 : 186, 18, 9, guide.ink, {
      fontWeight: 500,
      letterSpacing: 1,
      textAlign: index % 3 === 0 ? "left" : "right",
    }),
  );
  return nodes;
}

const POSTER_IMAGE_BOXES = [
  [28, 92, 304, 394],
  [16, 36, 328, 500],
  [28, 126, 304, 330],
  [54, 72, 278, 430],
] as const;

function movieGuideNodes(guide: VisualGuide, index: number): EditorNode[] {
  const [x, y, width, height] = POSTER_IMAGE_BOXES[index % POSTER_IMAGE_BOXES.length] ?? POSTER_IMAGE_BOXES[0];
  const imageNode = guidedImage(`movie-${index}-image`, guide.image ?? 0, x, y, width, height, {
    effects: {
      brightness: index === 5 || index === 11 || index === 16 ? 62 : 100,
      contrast: [2, 3, 5, 11].includes(index) ? 126 : 105,
      saturation: [2, 6, 8, 10, 19].includes(index) ? 0 : 88,
      blur: 0,
      grayscale: [2, 6, 8, 10, 19].includes(index) ? 100 : 0,
      sepia: index === 3 || index === 9 ? 28 : 0,
    },
  });
  const titleSize = [34, 58, 14, 40, 34, 54, 26, 44, 22, 46, 34, 48, 38, 60, 56, 42, 42, 40, 18, 48][index] ?? 42;
  const titleY = [502, 522, 302, 470, 520, 58, 504, 508, 520, 474, 82, 484, 506, 510, 416, 488, 500, 500, 542, 500][index] ?? 500;
  const titleX = index === 5 || index === 10 ? 18 : 28;
  return [
    imageNode,
    text(`movie-${index}-cast`, "AMARA OKOYE   MIKA CHEN   ELI BROOKS", 28, 24, 304, 14, 7, guide.ink, { letterSpacing: 1, textAlign: index === 19 ? "left" : "center" }),
    text(`movie-${index}-title`, guide.title, titleX, titleY, index === 5 || index === 10 ? 68 : 304, 92, titleSize, guide.ink, {
      fontWeight: [0, 7, 8, 12, 15, 18].includes(index) ? 500 : 800,
      lineHeight: 0.86,
      letterSpacing: index === 1 || index === 5 || index === 16 ? 3 : -1,
      textAlign: index === 19 ? "left" : index === 0 || index === 12 || index === 15 ? "center" : "left",
      textCasing: [0, 4, 8, 12, 17, 18].includes(index) ? "none" : "uppercase",
    }),
    text(`movie-${index}-meta`, guide.subtitle, 28, 594, 304, 18, 8, guide.ink, { letterSpacing: 1, textAlign: index === 19 ? "left" : "center" }),
    text(`movie-${index}-credit`, "A FIELD OFFICE PICTURE · 2026 · 104 MIN", 28, 620, 304, 10, 6, guide.ink, { letterSpacing: 1, textAlign: index === 19 ? "left" : "center" }),
  ];
}

function businessGuideNodes(
  guide: (typeof BUSINESS_GUIDES)[number],
  index: number,
): EditorNode[] {
  const [, name, role, , ink, accent] = guide;
  const imageCards = new Map([
    [2, 15],
    [6, 13],
    [8, 17],
    [11, 14],
    [15, 12],
    [17, 20],
    [19, 4],
  ]);
  const imageIndex = imageCards.get(index);
  const hasImage = imageIndex !== undefined;
  const big = [26, 44, 78, 88, 30, 22, 30, 34, 46, 40, 28, 62, 84, 24, 42, 94, 18, 48, 58, 30][index] ?? 40;
  const nodes: EditorNode[] = [
    text(`business-${index}-title`, name, index % 4 === 2 ? 12 : 28, index % 5 === 3 ? 34 : 82, hasImage ? 326 : index % 4 === 2 ? 536 : 504, 112, big, ink, {
      fontWeight: [1, 4, 5, 6, 16].includes(index) ? 500 : 800,
      lineHeight: 0.84,
      letterSpacing: index === 3 || index === 15 ? -4 : index === 5 || index === 16 ? 3 : -1,
      textAlign: index === 6 || index === 16 ? "center" : "left",
      textCasing: index === 7 || index === 14 ? "lowercase" : "none",
    }),
    text(`business-${index}-meta`, role, 28, 262, 300, 20, 10, ink, { letterSpacing: 1 }),
    text(`business-${index}-contact`, "hello@studio.co\n+234 801 234 5678", 382, 252, 150, 40, 9, ink, { lineHeight: 1.4, textAlign: "right", letterSpacing: 0 }),
    text(`business-${index}-side`, `0${index + 1} / 20`, 470, 26, 62, 14, 8, accent, { textAlign: "right", letterSpacing: 1 }),
  ];
  if (imageIndex !== undefined) {
    nodes.unshift(
      guidedImage(`business-${index}-image`, imageIndex, 362, 28, 170, 190, {
        effects: {
          brightness: index === 15 || index === 17 ? 72 : 100,
          contrast: 116,
          saturation: index === 17 || index === 19 ? 0 : 82,
          blur: 0,
          grayscale: index === 17 || index === 19 ? 100 : 0,
          sepia: index === 6 ? 18 : 0,
        },
      }),
    );
  }
  if (index === 9) {
    nodes.unshift(
      shape("business-9-circle", "ellipse", "circle", 374, 36, 106, 106, "#2452C8"),
      shape("business-9-rect", "rectangle", "rectangle", 316, 154, 164, 54, accent),
    );
  }
  return nodes;
}

function specimenNodes(
  guide: (typeof SPECIMEN_GUIDES)[number],
  index: number,
): EditorNode[] {
  const [, glyph, family, , ink, accent] = guide;
  const catalog = `TYPE SPECIMEN · ${String(index + 1).padStart(2, "0")}/20`;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789 &?!@";
  const series = Math.floor(index / 5);

  if (index % 5 === 0) {
    return [
      text(`specimen-${index}-cat`, catalog, 24, 22, 352, 14, 7, ink, { letterSpacing: 2 }),
      text(`specimen-${index}-title`, family, 24, 44, 352, 34, 24, accent, { fontWeight: 500, letterSpacing: -1 }),
      text(`specimen-${index}-first`, "AABBCCDDEEFFGG\nHHIIJJKKLLMM\nNNOOPPQQRRSSTT\nUUVVWWXXYYZZ\nabcdefghijklmn\nopqrstuvwxyz\n1234567890", 20 + series * 2, 90, 360 - series * 4, 288, 38 + series * 2, ink, { fontWeight: 500, lineHeight: 0.9, letterSpacing: -2 - series }),
      shape(`specimen-${index}-rule`, "line", "horizontal", 24, 396, 352, 10, ink),
      text(`specimen-${index}-meta`, "DISPLAY CUT\nHigh contrast forms for expressive editorial settings.", 24, 420, 108, 54, 7, ink, { lineHeight: 1.35, letterSpacing: 0 }),
      text(`specimen-${index}-credit`, "TEXT CUT\nBuilt for rhythm, detail, and long-form reading.", 146, 420, 108, 54, 7, ink, { lineHeight: 1.35, letterSpacing: 0 }),
      text(`specimen-${index}-side`, "OPEN TYPE\nLATIN EXTENDED\n2026 RELEASE", 268, 420, 108, 54, 7, ink, { lineHeight: 1.35, letterSpacing: 0 }),
    ];
  }

  if (index % 5 === 1) {
    return [
      text(`specimen-${index}-cat`, "Letter Sample(s):", 26, 24, 120, 12, 7, ink),
      text(`specimen-${index}-first`, `${glyph}  ${glyph}`, 26, 42, 220, 68, 58 + series * 3, ink, { fontWeight: 500, lineHeight: 0.9, letterSpacing: -4 }),
      text(`specimen-${index}-year`, "created\n1970–77", 258, 40, 116, 62, 25, ink, { fontWeight: 400, lineHeight: 0.9, letterSpacing: -1 }),
      text(`specimen-${index}-meta`, "Category:\nInternational typeface\n\nClassification:\nGeometric display", 214, 112, 162, 72, 8, ink, { lineHeight: 1.25, letterSpacing: 0 }),
      text(`specimen-${index}-title`, family.toUpperCase(), 22 - series * 2, 182 + series * 4, 356 + series * 2, 172, 80 - series * 4, accent, { fontWeight: 800, lineHeight: 0.72, letterSpacing: -6 + series }),
      text("specimen-alpha", alphabet, 26, 370, 164, 66, 11, ink, { lineHeight: 1.25, letterSpacing: 0 }),
      text(`specimen-${index}-credit`, "History Sample:\nA family built from precise geometry, optical correction, and memorable proportions.", 210, 370, 166, 66, 7, ink, { lineHeight: 1.3, letterSpacing: 0 }),
      text(`specimen-${index}-side`, "DESIGNED BY\nTHE OPEN TYPE OFFICE", 26, 458, 350, 24, 9, accent, { letterSpacing: 1 }),
    ];
  }

  if (index % 5 === 2) {
    return [
      text(`specimen-${index}-cat`, `SAMPLE OF ${family.toUpperCase()} FAMILIES`, 24, 24, 352, 14, 8, ink, { letterSpacing: 1 }),
      text(`specimen-${index}-first`, glyph.slice(0, 1), 108 - series * 8, 72 + series * 4, 270, 330, 310 - series * 12, ink, { fontWeight: 700, lineHeight: 0.75, letterSpacing: -20, textAlign: "right" }),
      text(`specimen-${index}-outline`, glyph.slice(-1), 94 + series * 6, 90 - series * 3, 270, 310, 278 - series * 8, accent, { fontWeight: 400, lineHeight: 0.75, letterSpacing: -18 }),
      text("specimen-alpha", "REGULAR 16 PT\nABCDEFGHIJKLMNO\nPQRSTUVWXYZ\nabcdefghijklmnop\nqrstuvwxyz", 24, 142, 126, 92, 9, ink, { lineHeight: 1.25, letterSpacing: 0 }),
      text(`specimen-${index}-meta`, "BOLD 16 PT\nABCDEFGHIJKLMNO\nPQRSTUVWXYZ\nabcdefghijklmnop\nqrstuvwxyz", 24, 272, 126, 92, 9, ink, { fontWeight: 700, lineHeight: 1.25, letterSpacing: 0 }),
      text(`specimen-${index}-credit`, "REGULAR\nCONDENSED\nBOLD", 286, 86, 88, 56, 7, ink, { lineHeight: 1.5, letterSpacing: 1 }),
      text(`specimen-${index}-side`, "05", 350, 462, 24, 14, 8, ink, { textAlign: "right" }),
    ];
  }

  if (index % 5 === 3) {
    return [
      text(`specimen-${index}-cat`, `P     MAGAZINE     Nº${index + 1}     '${family}'`, 22, 24, 356, 34, 24, ink, { fontWeight: 700, letterSpacing: -1, textAlign: "justify" }),
      text(`specimen-${index}-title`, "“The power to make language visible; to give every thought a form, a rhythm, and a voice.”", 22 + series * 2, 112 - series * 6, 356 - series * 4, 258, 38 - series * 2, ink, { fontWeight: 700, lineHeight: 1, letterSpacing: -1, textAlign: "justify" }),
      text(`specimen-${index}-year`, `© 2026  A publication by ${family}`, 22, 386, 356, 36, 22, accent, { fontWeight: 700, letterSpacing: -1, textAlign: "justify" }),
      text(`specimen-${index}-meta`, "A typographic specimen about freedom, clarity, and the expressive life of letters. Set across display and reading sizes.", 22, 448, 170, 34, 6, ink, { lineHeight: 1.25, letterSpacing: 0 }),
      text(`specimen-${index}-credit`, "EDITOR IN CHIEF · TYPE DIRECTOR · DESIGN OFFICE\nPrinted in Lagos · Edition 01", 208, 448, 170, 34, 6, ink, { lineHeight: 1.25, letterSpacing: 0, textAlign: "right" }),
    ];
  }

  return [
    text(`specimen-${index}-cat`, catalog, 24, 22, 352, 14, 8, ink, { letterSpacing: 2 }),
    text(`specimen-${index}-title`, family.toUpperCase(), 18 - series * 2, 54 + series * 4, 364, 116, 84 - series * 3, accent, { fontWeight: 800, lineHeight: 0.78, letterSpacing: -6 + series }),
    text(`specimen-${index}-first`, glyph, 24 + series * 5, 176, 180, 178, 166 - series * 6, ink, { fontWeight: 500, lineHeight: 0.8, letterSpacing: -10 }),
    text("specimen-alpha", alphabet, 218, 190, 158, 76, 12, ink, { lineHeight: 1.3, letterSpacing: 0 }),
    text(`specimen-${index}-meta`, "THIN\nLIGHT\nREGULAR\nMEDIUM\nBOLD\nBLACK", 218, 292, 72, 104, 12, ink, { lineHeight: 1.35, letterSpacing: 1 }),
    text(`specimen-${index}-year`, "0123456789", 24, 384, 352, 44, 34, ink, { fontWeight: 700, letterSpacing: 2 }),
    shape(`specimen-${index}-rule`, "line", "horizontal", 24, 438, 352, 10, accent),
    text(`specimen-${index}-credit`, "DESIGNED FOR HEADLINES, IDENTITIES, CULTURE, AND THE BEAUTIFUL MESS OF LANGUAGE.", 24, 456, 352, 24, 7, ink, { lineHeight: 1.3, letterSpacing: 1 }),
  ];
}

function makeGuidedTemplate(
  guide: VisualGuide,
  index: number,
  category: "Album covers" | "Movie posters",
): EditorTemplate {
  const album = category === "Album covers";
  const id = `${album ? "album" : "poster"}-${index + 1}`;
  const aspectRatio = album ? "1:1" : "9:16";
  return {
    id,
    name: guide.name,
    category,
    aspectRatio,
    card: {
      id,
      name: guide.name,
      width: album ? 500 : 360,
      height: album ? 500 : 640,
      settings: solidTemplateSettings(aspectRatio, guide.background, [0, 2, 4, 6, 9, 11, 18, 19].includes(index)),
      nodes: album ? albumGuideNodes(guide, index) : movieGuideNodes(guide, index),
    },
  };
}

function makeBusinessTemplate(
  guide: (typeof BUSINESS_GUIDES)[number],
  index: number,
): EditorTemplate {
  const id = `business-card-${index + 1}`;
  return {
    id,
    name: guide[0],
    category: "Business cards",
    aspectRatio: "business-card",
    card: {
      id,
      name: guide[0],
      width: 560,
      height: 320,
      settings: solidTemplateSettings("business-card", guide[3], [0, 1, 3, 4, 6, 12, 16, 17, 19].includes(index)),
      nodes: businessGuideNodes(guide, index),
    },
  };
}

function makeSpecimenTemplate(
  guide: (typeof SPECIMEN_GUIDES)[number],
  index: number,
): EditorTemplate {
  const id = `typography-specimen-${index + 1}`;
  return {
    id,
    name: guide[0],
    category: "Typography specimens",
    aspectRatio: "4:5",
    card: {
      id,
      name: guide[0],
      width: 400,
      height: 500,
      settings: solidTemplateSettings("4:5", guide[3], index % 4 === 0),
      nodes: specimenNodes(guide, index),
    },
  };
}

export const EDITOR_TEMPLATES: EditorTemplate[] = [
  ...ALBUM_GUIDES.map((guide, index) => makeGuidedTemplate(guide, index, "Album covers")),
  ...POSTERS.map((spec, index) => makeTemplate(spec, index, "Movie posters")),
  ...INSPIRED_POSTER_META.map((meta, index) =>
    makeInspiredTemplate(meta, index, "Movie posters", index + 21),
  ),
  ...BUSINESS_GUIDES.map(makeBusinessTemplate),
  ...PITCH_DECK_META.map(
    (meta, index): EditorTemplate => ({
      id: `pitch-deck-${index + 1}`,
      name: meta[0],
      category: "Pitch decks",
      aspectRatio: "16:9",
      card: {
        id: `pitch-deck-${index + 1}`,
        name: meta[0],
        width: 640,
        height: 360,
        settings: settings(
          "16:9",
          {
            title: meta[0],
            subtitle: meta[1],
            background:
              MATERIAL_IMAGES[(index + 3) % MATERIAL_IMAGES.length] ?? "",
            secondary: MATERIAL_IMAGES[index] ?? "",
            texture: TEXTURES[index % TEXTURES.length] ?? "",
            accent: meta[2],
            ink: meta[3],
          },
          index,
        ),
        nodes: pitchDeckNodes(meta, index),
      },
    }),
  ),
  ...NEW_PITCH_DECK_META.map(
    (meta, index): EditorTemplate => ({
      id: `pitch-deck-${index + 11}`,
      name: meta[0],
      category: "Pitch decks",
      aspectRatio: "16:9",
      card: {
        id: `pitch-deck-${index + 11}`,
        name: meta[0],
        width: 640,
        height: 360,
        settings: expressiveDeckSettings(meta, index),
        nodes: newPitchDeckNodes(meta, index),
      },
    }),
  ),
  ...INSPIRED_PITCH_DECK_META.map((meta, index) =>
    makeInspiredTemplate(meta, index, "Pitch decks", index + 21),
  ),
  ...SPECIMEN_GUIDES.map(makeSpecimenTemplate),
];
