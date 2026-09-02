// Chapter maps for the two council books seeded into the publications section.
//
// `markers` are the exact lines of the source .txt, written *after* normalisation — the
// parser folds legacy chillu spellings first, so "പ്രവര്‍ത്തനങ്ങള്‍" is matched as
// "പ്രവർത്തനങ്ങൾ". Slugs are hand-assigned: transliterating Malayalam titles would produce
// nothing, and percent-encoded Malayalam makes an unshareable URL.

const MARGHAREGHA_CHAPTERS = [
  { slug: "mahallukal", title: "മഹല്ലുകൾ", markers: ["*മഹല്ലുകൾ*"] },
  {
    slug: "kudumba-jeevitham",
    title: "കുടുംബ ജീവിതം; ഒരാമുഖം",
    markers: ["*കുടുംബ ജീവിതം;*", "*ഒരാമുഖം*"],
  },
  { slug: "vaivahika-jeevitham", title: "വൈവാഹിക ജീവിതം", markers: ["വൈവാഹിക ജീവിതം"] },
  { slug: "pre-marital-course", title: "Pre Marital Course", markers: ["*Pre Marital Course*"] },
  {
    slug: "post-marital-parenting-course",
    title: "Post Marital and Effective Parenting Course",
    markers: ["*Post Marital and*", "*Effective Parenting Course*"],
  },
  { slug: "kuttikal", title: "കുട്ടികൾ", markers: ["*കുട്ടികൾ*"] },
  {
    slug: "avadhikkala-padana-vedi",
    title: "അവധിക്കാല ഇസ്‌ലാമിക പഠന വേദി",
    markers: ["*അവധിക്കാല*", "*ഇസ്‌ലാമിക പഠന വേദി*"],
  },
  {
    slug: "maslahath-samithi",
    title: "മഹല്ല് മസ്‌ലഹത്ത് സമിതി",
    markers: ["*മഹല്ല് മസ്‌ലഹത്ത് സമിതി*"],
  },
  { slug: "vivaha-mochanam", title: "വിവാഹ മോചനം", markers: ["*വിവാഹ മോചനം*"] },
  { slug: "khulu", title: "ഖുൽഅ്", markers: ["*ഖുൽഅ്*"] },
  { slug: "faskh", title: "ഫസ്ഖ്", markers: ["*ഫസ്ഖ്*"] },
  {
    slug: "iddah",
    title: "ഇദ്ദഃ അഥവാ ദീക്ഷാ കാലം",
    markers: ["*ഇദ്ദഃ അഥവാ ദീക്ഷാ കാലം*"],
  },
  {
    slug: "anantharavakasa-niyamam",
    title: "അനന്തരാവകാശ നിയമം",
    markers: ["*അനന്തരാവകാശ നിയമം*"],
  },
  {
    slug: "pothu-nirddheshangal",
    title: "പൊതു നിർദ്ദേശങ്ങൾ",
    markers: ["*പൊതു നിർദ്ദേശങ്ങൾ*"],
  },
];

const REKHA_CHAPTERS = [
  { slug: "aamukham", title: "ആമുഖം", markers: ["*മഹല്ല് സംവിധാനത്തിന് ഒരു രൂപരേഖ*"] },
  {
    slug: "pradeshathe-padanam",
    title: "പ്രദേശത്തെ സംബന്ധിച്ച പഠനം",
    markers: ["പ്രദേശത്തെ സംബന്ധിച്ച പഠനം"],
  },
  { slug: "pothu-pravarthanangal", title: "പൊതു പ്രവർത്തനങ്ങൾ", markers: ["പൊതു പ്രവർത്തനങ്ങൾ"] },
  { slug: "mahall-angangal", title: "മഹല്ല് അംഗങ്ങൾ", markers: ["മഹല്ല് അംഗങ്ങൾ"] },
  {
    slug: "islamika-bodhavatkaranam",
    title: "ഇസ്‌ലാമിക ബോധവത്കരണം",
    markers: ["ഇസ്‌ലാമിക ബോധവത്കരണം"],
  },
  { slug: "holiday-madrasakal", title: "ഹോളിഡേ മദ്രസകൾ", markers: ["ഹോളിഡേ മദ്രസകൾ"] },
  { slug: "quran-padanavedi", title: "ഖുർആൻ പഠനവേദി", markers: ["ഖുർആൻ പഠനവേദി"] },
  { slug: "zakat-committee", title: "സകാത് കമ്മറ്റി", markers: ["സകാത് കമ്മറ്റി"] },
  {
    slug: "palisha-rahitha-sahaya-nidhi",
    title: "പലിശ രഹിത സഹായ നിധി",
    markers: ["പലിശ രഹിത സഹായ നിധി"],
  },
  { slug: "vidyabhyasa-samithi", title: "വിദ്യാഭ്യാസ സമിതി", markers: ["വിദ്യാഭ്യാസ സമിതി"] },
  {
    slug: "samparthika-purogathi",
    title: "സാമ്പത്തിക പുരോഗതിയും അച്ചടക്കവും",
    markers: ["സാമ്പത്തിക പുരോഗതിയും അച്ചടക്കവും"],
  },
  {
    slug: "library-reading-room",
    title: "ലൈബ്രറിയും റിഡീംഗ് റൂമും",
    markers: ["ലൈബ്രറിയും റിഡീംഗ് റൂമും"],
  },
  { slug: "counselling", title: "കൗൺസലിംഗ് സംവിധാനം", markers: ["കൗൺസലിംഗ് സംവിധാനം"] },
  {
    slug: "maslahath-kudumba-rangam",
    title: "മസ്വ്‌ലഹത്ത് സമിതിയും കുടുംബ രംഗവും",
    markers: ["മസ്വ്‌ലഹത്ത് സമിതിയും കുടുംബ രംഗവും"],
  },
  {
    slug: "clusterukal",
    title: "ക്ലസ്റ്ററുകളായി തിരിക്കുക",
    markers: ["ക്ലസ്റ്ററുകളായി തിരിക്കുക."],
  },
  { slug: "vanitha-vedi", title: "വനിതാ വേദി", markers: ["വനിതാ വേദി"] },
  { slug: "sevana-vedi", title: "സേവന വേദി", markers: ["സേവന വേദി"] },
  {
    slug: "anubandham-1-vidyabhyasa-samithi",
    title: "അനുബന്ധം 1: വിദ്യാഭ്യാസ സമിതി",
    markers: ["അനുബന്ധം 1", "വിദ്യാഭ്യാസ സമിതി"],
  },
  {
    slug: "anubandham-2-samparthika-purogathi",
    title: "അനുബന്ധം 2: സാമ്പത്തിക പുരോഗതിയും അച്ചടക്കവും",
    markers: ["അനുബന്ധം: 2", "സാമ്പത്തിക പുരോഗതിയും അച്ചടക്കവും"],
  },
  {
    slug: "anubandham-3-bhadramaya-kudumbam",
    title: "അനുബന്ധം 3: ഭദ്രമായ കുടുംബം",
    markers: ["അനുബന്ധം: 3", "ഭദ്രമായ കുടുംബം"],
  },
  {
    slug: "anubandham-4-sevana-vedi",
    title: "അനുബന്ധം 4: സേവന വേദി",
    markers: ["അനുബന്ധം: 4", "സേവന വേദി"],
  },
  {
    slug: "anubandham-5-pothu-nirddheshangal",
    title: "അനുബന്ധം 5: പൊതു നിർദ്ദേശങ്ങൾ",
    markers: ["അനുബന്ധം: 5", "പൊതു നിർദ്ദേശങ്ങൾ"],
  },
];

const BOOKS = [
  {
    slug: "mahallukalkku-oru-margarekha",
    sourceFile: "Mahallu Margharegha.txt",
    joinsFile: "joins-margharegha.json",
    title: "Mahallukalkku Oru Margarekha",
    titleMalayalam: "മഹല്ലുകൾക്ക് ഒരു മാർഗരേഖ",
    subtitle: "കുടുംബം",
    description:
      "മഹല്ലുകൾക്കുള്ള സമഗ്ര മാർഗരേഖ — കുടുംബ ജീവിതം, വൈവാഹിക ജീവിതം, സന്താന പരിപാലനം, മസ്‌ലഹത്ത് സമിതി, അനന്തരാവകാശ നിയമം തുടങ്ങിയവ.",
    chapters: MARGHAREGHA_CHAPTERS,
  },
  {
    slug: "mahall-samvidhanathinu-oru-rooparekha",
    sourceFile: "Mahallu-Rekha.txt",
    joinsFile: "joins-rekha.json",
    title: "Mahall Samvidhanathinu Oru Rooparekha",
    titleMalayalam: "മഹല്ല് സംവിധാനത്തിന് ഒരു രൂപരേഖ",
    subtitle: "",
    description:
      "കക്ഷിഭേദമന്യേ ഏതു മഹല്ലിനും സ്വീകരിക്കാവുന്ന പ്രവർത്തന പദ്ധതികൾ — വിദ്യാഭ്യാസ സമിതി, സകാത് കമ്മറ്റി, വനിതാ വേദി, സേവന വേദി എന്നിവ ഉൾപ്പെടെ.",
    chapters: REKHA_CHAPTERS,
  },
];

module.exports = { BOOKS, MARGHAREGHA_CHAPTERS, REKHA_CHAPTERS };
