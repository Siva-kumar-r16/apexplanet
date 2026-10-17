// Local character bios.
// Names, actors and images come live from the TVMaze cast API; these short
// bios are only an enrichment layer matched by character name.

const bios = {
  TBBT: [
    ['sheldon', 'A theoretical physicist with an IQ of 187, known for his strict routines and lack of social grace.'],
    ['leonard', 'An experimental physicist who shares an apartment with Sheldon and pines for his neighbor Penny.'],
    ['penny', 'An aspiring actress from Omaha, Nebraska, who lives across the hall from Sheldon and Leonard.'],
    ['howard', 'An engineer with a master’s degree, a flair for gadgets, and a very loud mother.'],
    ['rajesh', 'An astrophysicist from New Delhi who struggles to speak to women until he has had a drink.'],
    ['bernadette', 'A microbiologist with a sweet voice and a surprisingly fierce temper.'],
    ['amy', 'A neurobiologist who matches Sheldon’s intellect and becomes his girlfriend.'],
    ['stuart', 'The owner of the local comic book store, with a talent for bad luck.'],
    ['emily', 'A dermatologist who dates Raj with a dark sense of humor.'],
    ['leslie', 'A sharp-tongued physicist and one of Leonard’s early rivals.']
  ],
  YS: [
    ['george cooper jr', 'Sheldon’s older brother — more interested in girls and cars than in school.'],
    ['georgie', 'Sheldon’s older brother — more interested in girls and cars than in school.'],
    ['george', 'Sheldon’s father, a high school football coach trying to understand his extraordinary son.'],
    ['missy', 'Sheldon’s twin sister. She lacks his academic intelligence but has sharp social awareness.'],
    ['mary', 'Sheldon’s fiercely protective and devoutly religious mother.'],
    ['connie', 'Sheldon’s no-nonsense grandmother "Meemaw", who loves a drink and a good scheme.'],
    ['meemaw', 'Sheldon’s no-nonsense grandmother, who loves a drink and a good scheme.'],
    ['jeff', 'The pastor at the Coopers’ church in East Texas.'],
    ['sheldon', 'A child genius growing up in East Texas, struggling to fit in with his ordinary family and classmates.']
  ]
};

/** Find a bio for a cast character; returns '' when none matches. */
export function getBio(showKey, characterName) {
  const name = (characterName || '').toLowerCase();
  const hit = (bios[showKey] || []).find(([key]) => name.includes(key));
  return hit ? hit[1] : '';
}