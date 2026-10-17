// Interactive Personality Quiz Module

export const quizData = [
  {
    question: "How do you prefer to spend your Friday nights?",
    options: [
      { text: "Playing board games/video games with strict rules.", points: { "Sheldon": 3, "Young Sheldon": 2 } },
      { text: "Hanging out, having a few drinks, and relaxing.", points: { "Penny": 3, "George": 2 } },
      { text: "Tinkering in a lab or working on a personal project.", points: { "Leonard": 2, "Amy": 2 } },
      { text: "Watching TV and making sarcastic comments.", points: { "Missy": 3 } }
    ]
  },
  {
    question: "You find a complex problem. What's your approach?",
    options: [
      { text: "Create an elaborate whiteboard formula immediately.", points: { "Sheldon": 3, "Amy": 2 } },
      { text: "Ask friends for help or ignore it.", points: { "Penny": 3, "Missy": 2 } },
      { text: "Methodically test solutions (experimental approach).", points: { "Leonard": 3 } },
      { text: "Rely on common sense to bypass the complexity.", points: { "Mary": 3, "George": 2 } }
    ]
  },
  {
    question: "How important is your daily routine?",
    options: [
      { text: "Vital. I have bathroom schedules and specific seating.", points: { "Sheldon": 3, "Young Sheldon": 3 } },
      { text: "I like order, but I can adapt if necessary.", points: { "Leonard": 2, "Amy": 2 } },
      { text: "Routine? What routine?", points: { "Penny": 3, "Missy": 2 } },
      { text: "It revolves entirely around my family's needs.", points: { "Mary": 3 } }
    ]
  },
  {
    question: "How do you handle social situations?",
    options: [
      { text: "I often misunderstand sarcasm and social cues.", points: { "Sheldon": 3, "Young Sheldon": 3 } },
      { text: "I'm the life of the party and talk to everyone.", points: { "Penny": 3 } },
      { text: "I'm a bit awkward but try my best to fit in.", points: { "Leonard": 3, "Amy": 2 } },
      { text: "I observe and point out everyone else's flaws.", points: { "Missy": 3 } }
    ]
  },
  {
    question: "What is your relationship with academia/school?",
    options: [
      { text: "It is my domain. I am intellectually superior.", points: { "Sheldon": 3, "Young Sheldon": 3 } },
      { text: "I work hard and value my degrees immensely.", points: { "Leonard": 2, "Amy": 3 } },
      { text: "Not for me. Street smarts are better.", points: { "Penny": 3, "Missy": 2 } },
      { text: "I respect it, but practical work puts food on the table.", points: { "George": 3, "Mary": 2 } }
    ]
  }
];

export const characterDescriptions = {
  "Sheldon": "You are Sheldon Cooper! Brilliant, uncompromising, and deeply reliant on routine.",
  "Young Sheldon": "You are Young Sheldon! A prodigy navigating a world that doesn't quite understand you yet.",
  "Leonard": "You are Leonard Hofstadter! The glue that holds your friend group together, balancing intellect with empathy.",
  "Penny": "You are Penny! Socially adept, practical, and possessing excellent street smarts.",
  "Amy": "You are Amy Farrah Fowler! Highly intelligent, fiercely loyal, and eager for genuine connection.",
  "Missy": "You are Missy Cooper! Sarcastic, observant, and possessing the social intelligence your sibling lacks.",
  "Mary": "You are Mary Cooper! Deeply caring, structured, and fiercely protective of your loved ones.",
  "George": "You are George Cooper Sr.! Practical, grounded, and doing your best to manage the chaos around you."
};

// Maps each quiz result to the show + name fragment used to look up the
// matching character (and their API image) in the loaded cast list.
export const quizCharacterMap = {
  "Sheldon": { show: "TBBT", match: "sheldon" },
  "Young Sheldon": { show: "YS", match: "sheldon" },
  "Leonard": { show: "TBBT", match: "leonard" },
  "Penny": { show: "TBBT", match: "penny" },
  "Amy": { show: "TBBT", match: "amy" },
  "Missy": { show: "YS", match: "missy" },
  "Mary": { show: "YS", match: "mary" },
  "George": { show: "YS", match: "george cooper sr" }
};