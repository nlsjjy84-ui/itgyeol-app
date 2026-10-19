// English picture book — same pages, choices and ids as the Korean book (data/book.js).
// Written for kids and newcomers: short sentences, easy words, every Korean term explained once,
// jokes and emoji instead of text laughter, and never a teacher voice ("Good job!", "Select the answer").

const P = (text) => ({ who: 'pung', text });
const G = (text) => ({ who: 'gyeol', text });

const BOOK = {
  prologue: [
    {
      art: 'gate', place: 'Courtyard gate',
      lines: [P('Huh?! Someone’s here!'), P('Hi hi! We just met, right? Weird… it feels like we’ve known each other forever 😆')],
    },
    {
      art: 'gate', place: 'Courtyard gate',
      lines: [G('Don’t mind him. He treats everyone like a ten-year best friend 😏'), P('True! I’m Pungi. “Pung” means wind, so I zoom around everywhere 🌬️')],
    },
    {
      art: 'gate', place: 'Courtyard gate',
      lines: [G('I’m Gyeori. “Gyeol” means a pattern or a flow. I’m the one who ties loose things together 🧵'), P('And you! We won’t ask your name. We’ll just call you “you” 😎')],
    },
    {
      art: 'gate', place: 'Courtyard gate',
      lines: [P('Oh, and if we shout “Eolssu!” or “Jota!” now and then, don’t worry!'), G('Those are chuimsae — happy cheers Koreans throw in when the fun kicks in. Feel free to use them too 🥁')],
    },
    {
      art: 'gate', place: 'Courtyard gate',
      lines: [P('Look at the crack in the gate. Light is leaking out ✨'), G('There’s a madang — a big open yard — in there. What’s the first thing you feel?')],
      input: {
        key: 'prologue',
        options: [
          { id: 'eo', label: 'Huh?' },
          { id: 'jamkkan', label: 'Wait!' },
          { id: 'silent', label: '(stay quiet)' },
        ],
        silent: 'silent',
        react: {
          eo: [P('Right?! That “Huh?” just pops out! We’re on the same wavelength 🙌'), G('That “Huh?” was the very first signal of this yard.')],
          jamkkan: [G('“Wait!” Nice. I like people who don’t rush 😌'), P('I rush all the time… 🏃 Oops, sorry, I’ll wait!')],
          silent: [G('Oh, a quiet watcher. That counts as an answer too 🤫'), P('Quiet people notice the most 👀 I could never!')],
        },
      },
    },
    {
      art: 'gate', place: 'Courtyard gate',
      lines: [P('The gate is shut tight… want to give it a little tap?'), G('A tap works. Or you can just wait 🍃')],
      input: {
        key: 'door',
        options: [{ id: 'tap', label: '🚪 Tap the gate' }],
        silent: 'wait',
        waitMs: 5000,
        react: {
          tap: [P('Whoa, it opened!! That was your hand, right? 😳'), G('I think the gate was waiting for you.')],
          wait: [G('Huh… we waited and it opened by itself 😮 This gate opens for patient people too.'), P('I would’ve pushed it ages ago 🤣')],
        },
      },
    },
    {
      art: 'madang', place: 'The madang',
      lines: [P('Wooow, the madang! Eolssu!'), G('Think of it as a traditional playground. No need to know anything. We don’t know everything either 😆')],
    },
    {
      art: 'madang', place: 'The madang',
      lines: [G('Every time you play a board here, you get a “piece.” Ever seen a cloth made of little patches sewn together? That’s jogakbo 🧶'), P('Your piece takes the shape of how YOU played. Same board, different person, different piece!')],
    },
    {
      art: 'madang', place: 'The madang',
      lines: [P('There are six boards: Jinbeop, the Writing Room, the Play Yard, Hangul Blocks, the Mask Dance and Dancheong!'), G('Go wherever you like. No order. We’ll be right beside you, cheering 🥳')],
    },
  ],

  jinbeop: [
    {
      art: 'madang', place: 'Board 1 · Jinbeop Yard',
      lines: [
        P('Huh? People are standing in the yard, but the lines are a total mess 😵'),
        G(({ choice }) =>
          choice.prologue === 'eo' ? 'You spotted things fast with that “Huh?” earlier. I trust those eyes 👀'
          : choice.prologue === 'jamkkan' ? 'You said “Wait!” earlier. I trust that careful mind 😌'
          : choice.prologue === 'silent' ? 'You were quietly watching before. Still in watch mode? 😏'
          : 'Think you can line them up again?'),
      ],
    },
    {
      art: 'madang', place: 'Board 1 · Jinbeop Yard',
      lines: [G('This is called “jin” — a formation. People pick their spots so the whole group makes a shape.'), P('When drummers march in rows at a pungmul band show, that’s a jin too 🥁 So is the big circle dance, ganggangsullae!')],
    },
    {
      art: 'madang', place: 'Board 1 · Jinbeop Yard',
      lines: [P('So, are you good at this? Spot-matching puzzles and stuff?')],
      input: {
        key: 'jinbeop',
        options: [
          { id: 'good', label: 'I’m good at this!' },
          { id: 'last', label: 'I’m always last too' },
          { id: 'silent', label: '(just watch)' },
        ],
        silent: 'silent',
        waitMs: 6000,
        react: {
          good: [P('Ooh, confident! Eolssu 💪'), G('Then this will be fun to watch 😎')],
          last: [G('Ha, I love the honesty 😂 We’re always last too.'), P('The last ones laugh the most. That’s why WE laugh the most 🤣')],
          silent: [G('A careful type, huh 🧐'), P('Someone with a good eye 👀 Can’t wait!')],
        },
      },
    },
    {
      art: 'madang', place: 'Board 1 · Jinbeop Yard',
      lines: [G('Follow along with your eyes and watch how the shape changes 👀'), P('If you miss, the yard is still here. Nobody’s going to laugh at you!')],
    },
    {
      art: 'madang', place: 'Board 1 · Jinbeop Yard',
      lines: [P('Okay, into the formation we go! Eusha~!'), G('We’re right behind you 🏃')],
    },
  ],

  print: [
    {
      art: 'byeongpung', place: 'Board 2 · Writing Room',
      lines: [G('The ink by the folding screen isn’t even dry. Someone left mid-letter 🖌️'), P('A ghost, maybe? 👻 …Kidding! Probably!')],
    },
    {
      art: 'byeongpung', place: 'Board 2 · Writing Room',
      lines: [P('This room has the story of Hunminjeongeum — that’s the first name of Hangul, the Korean alphabet.'), G('It was made so ordinary people could read and write easily. Hard letters, made simple ✨')],
    },
    {
      art: 'byeongpung', place: 'Board 2 · Writing Room',
      lines: [G('Carve letters, add ink, press them on paper — that’s printing. A lot like using a stamp 🔖'), P('Look, letter pieces are scattered! Put them together and — boom — a stamp!')],
    },
    {
      art: 'byeongpung', place: 'Board 2 · Writing Room',
      lines: [P('Confession: our handwriting is terrible 🙈'), G('Good thing you match pieces here instead of writing. No skills needed 😌')],
    },
    {
      art: 'byeongpung', place: 'Board 2 · Writing Room',
      lines: [P('Can you smell the ink? Even in your imagination? 👃'), G('Into the Writing Room~ Eolssu!')],
    },
  ],

  play: [
    {
      art: 'banner', place: 'Board 3 · Play Yard',
      lines: [P('Look at that flag!! I bet it sings when the wind blows 🎏'), G('This is the Play Yard. Twelve games Korean kids played long ago are waiting here.')],
    },
    {
      art: 'banner', place: 'Board 3 · Play Yard',
      lines: [G('Tug of war, spinning tops, ddakji paper slapping, kite flying… sound familiar?'), P('Even if the names are new, your body will know them! 🤸')],
    },
    {
      art: 'banner', place: 'Board 3 · Play Yard',
      lines: [P('Never played one before? No worries. We’ll be watching right next to you 😄'), G('They say every game starts with “Huh? What’s this?”')],
    },
    {
      art: 'banner', place: 'Board 3 · Play Yard',
      lines: [G('No need to play all twelve. Just one gives you your first piece 🧩'), P('Play a lot and you’ll find your favorite! Mine is ddakji. I’m VERY serious about it 🃏')],
    },
    {
      art: 'banner', place: 'Board 3 · Play Yard',
      lines: [P('Flag goes up~ Blow, wind, blow 🌬️'), G('Eolssu! Let the games begin!')],
    },
  ],

  hangul: [
    {
      art: 'sunset', place: 'Board 4 · Hangul Blocks',
      lines: [P('Huh? Something’s falling from the sky?! ㄱ? ㅏ?? ☄️'), G('Consonants and vowels are dropping. They’re Hangul blocks!')],
    },
    {
      art: 'sunset', place: 'Board 4 · Hangul Blocks',
      lines: [G('In Hangul you build a letter by snapping consonants and vowels together. Like LEGO 🧱'), P('That’s why it’s a perfect match for Tetris!!')],
    },
    {
      art: 'sunset', place: 'Board 4 · Hangul Blocks',
      lines: [P('Stack blocks to fill a whole row and the row disappears. So satisfying 😆'), G('If you scream “Aaah!”, that’s fine. We scream every single time 🙈')],
    },
    {
      art: 'sunset', place: 'Board 4 · Hangul Blocks',
      lines: [P('Ready? Blocks incoming~'), G('Eolssu! Let’s stack 🧱')],
    },
  ],
};

const GAME_LINES = {
  julneomgi: {
    start: P('The rope is spinning~ Just get the timing right! Boing 🦘'),
    win: [G('You didn’t trip once! Boing boing, eolssu!'), P('Were you floating in the air just now? 🚀')],
    lose: [P('Whoa, caught by the rope! Aigo 😵'), G('Getting caught is part of the fun. One more?')],
    again: G('The swish of the rope sounds familiar by now, right? 🎵'),
  },
  juldarigi: {
    start: G('Tug of war is all about strength. Shout “Yeongcha!” — heave-ho! — in your head 💪'),
    win: [P('Heave-ho, we won!! I thought my arms would fall off 😂'), G('You pulled right when it counted.')],
    lose: [P('Aaah, we’re getting dragged~~ 😭'), G('We didn’t lose the rope, we just lent it to them. Let’s go again!')],
    again: P('Tug-of-war regular! You must have muscles by now 💪'),
  },
  sangmo: {
    start: P('Spin the long ribbon on the hat — round and round! Take a break if you get dizzy 😵‍💫'),
    win: [G('The sangmo drew a circle in the sky ✨'), P('That looked so cool! Clap clap clap 👏')],
    lose: [P('Uh-oh… the ribbon got tangled 🌀'), G('A tangle is still a spin. Untangle and twirl again.')],
    again: G('They say sangmo spinning makes your neck flexible. True? No idea 😆'),
  },
  guseulchigi: {
    start: G('Flick one marble to hit another one 🔮'),
    win: [P('Clack! A hit!! Did you hear that? 🎯'), G('Quiet fingers, perfect aim.')],
    lose: [G('The marble just slipped past. So close 🥲'), P('Marbles don’t even know where they’re rolling. Not your fault 😅')],
    again: P('That clack of marbles is kind of addictive, right? 🔮'),
  },
  paengi: {
    start: P('Whip the top and it keeps spinning! Hit it before it stops 🌀'),
    win: [G('The top keeps going and going! 🌀'), P('Whoever lasts longest wins. Eolssu!')],
    lose: [P('The top fell over 🫠'), G('Maybe it just wanted a nap. Let’s spin it again.')],
    again: G('Your face gets so serious when you spin tops 😏 Did you know?'),
  },
  jachigi: {
    start: G('Hit a small stick far away with a big stick 🏏'),
    win: [P('Whoosh~ it flew! Way, way over there!! 🚀'), G('Your power was just right.')],
    lose: [G('The stick just plopped down 😅'), P('Hitting far takes practice. Swing again!')],
    again: P('Jachigi makes you super competitive, doesn’t it? 🔥'),
  },
  biseok: {
    start: P('Throw your stone and knock the standing stone over! Eyes wide open 🎯'),
    win: [G('Thud! It fell. That felt great 😆'), P('Right where you aimed. Eolssu!')],
    lose: [P('Just missed 😮‍💨'), G('A stone can feel your mood when you throw. Stay calm, one more!')],
    again: G('They say half of biseokchigi is your pose. You already look the part 😎'),
  },
  tuho: {
    start: G('Toss arrows into a jar. Even old-time scholars loved this game 🏺'),
    win: [P('Plop! It went in!! I think the jar said “thanks” 🏺'), G('A steady hand scored that one.')],
    lose: [G('The arrow brushed past the jar 🥲'), P('Maybe the jar got shy and dodged 😂')],
    again: P('You held your breath while playing tuho, didn’t you? Me too 🫢'),
  },
  ddakji: {
    start: P('Slam your ddakji — a folded paper tile — and flip the other one! Bam! 💥'),
    win: [G('Flipped! The ddakji is looking at the sky now 🙃'), P('That wrist snap! Unreal!! Eolssu!')],
    lose: [P('It won’t flip… stubborn one 😤'), G('In ddakji, the strongest heart wins. Bam it again.')],
    again: G('The ddakji slaps sound like a drum beat now 🥁 Just like pungmul.'),
  },
  gomugojul: {
    start: G('Jump over the rubber band and hook it with your feet! Feel the rhythm 🎶'),
    win: [P('All the way to the end! The band held strong 🎀'), G('The rhythm is in your body now.')],
    lose: [G('The band caught your foot 😅'), P('If you laugh when you trip, you’re halfway to winning 🤭 Again!')],
    again: P('That rubber band song sounds familiar, doesn’t it? 🎤'),
  },
  yeonnaligi: {
    start: P('Read the wind and fly your kite high! 🪁'),
    win: [G('The kite reached the clouds ☁️'), P('You and the wind are friends now. Same team as me 🌬️')],
    lose: [P('The kite nosedived~ 🫨'), G('The wind looked away for a sec. Let’s call it back.')],
    again: G('Kite flying is for people who read the wind well. Getting the feel? 🌬️'),
  },
  gullyeongsoe: {
    start: G('Roll the hoop and run along with it. Don’t stop, keep going! 🛞'),
    win: [P('It rolled all the way without falling!! 🛞'), G('You ran together to the very end. Eolssu!')],
    lose: [G('The hoop rolled off to the side 😮'), P('Guess it wanted to go solo 😂 Let’s bring it back!')],
    again: P('You roll that hoop like you’ve done it your whole life 😎'),
  },
};

const SCENE_WIN = {
  jinbeop: [P('Huh? Did you just do that?'), G('The formation clicked into place. That spot became a piece 🧩')],
  print: [G('Bam, it’s stamped! The letters you matched stayed right there 🔖'), P('Wait, it snaps right next to the last piece!')],
  hangul: [G('The blocks stacked up and a row disappeared! 🧱'), P('This piece is shaped like letter blocks. It joined your jogakbo!')],
  talchum: [P('Eolssigu! The hansam sleeves went flying 🎭'), G('The dance you just did stayed on the piece as sleeve tails.')],
  dancheong: [G('You painted it all, in order, from base coat to white lines 🎨'), P('The five-color band joined the bottom of your jogakbo!')],
};

const SCENE_LOSE = {
  jinbeop: [P('Huh? Not quite there yet 🤔'), G('It’s okay, the yard isn’t going anywhere. Let’s try again slowly.')],
  print: [P('The letters haven’t found their spots yet 🙈'), G('Ink takes time to dry. Let’s match them again.')],
  tbd: [P('Aigo, so close this time 😅'), G('Some days you lose a game. That’s normal. One more!')],
  hangul: [P('Aaah, the blocks hit the ceiling 🙈'), G('We just go again, right? Let’s stack!')],
  talchum: [P('Oops, we kept missing the beat 😅'), G('Listen for the big drum “deong!” first. Let’s dance again.')],
  dancheong: [P('Some spaces aren’t painted yet 🖌️'), G('No rushing with dancheong. Let’s paint it again, step by step.')],
};

const EPI_BY_COUNT = {
  0: [P('No pieces yet! Play just one board and your first piece appears 🧩'), G('Huh? Once you move, it all begins. We’ll be waiting 🍃')],
  1: [P('Your first piece! The next board will sew right next to it 🧩'), G('One piece isn’t a jogakbo yet. Want to add another?')],
  2: [G('Two pieces joined. See the knot between them? 🪢'), P('Huh? The picture looks different from before!')],
  3: [P('Three boards became one jogakbo!! Eolssu 🥳'), G('This is a traditional artwork YOU made. Its shape depends on how you played.')],
  4: [P('Four boards’ worth of traces! Your jogakbo is getting wide 🧶'), G('Every board leaves a different touch, so every piece has its own pattern.')],
  5: [P('Board number five!! One more and your jogakbo is full 🔥'), G('The path you’ve walked has already become one big pattern.')],
  6: [P('All six boards are in!! Your jogakbo is full 🎉'), G('Jinbeop, letters, games, Hangul blocks, mask dance and dancheong — your path became the pattern.')],
};

const T = {
  firstPiece: () => G('Your first piece! Let’s give it a round of applause 👏'),
  sceneNth: (n) => P(`This board, already round ${n}! Official regular 😎`),
  topGame: (name) => G(`You play ${name} a lot lately! Your favorite, maybe? 👀`),
  epiZero: [G('Play one board and your artwork plus its “Story of this piece” will show up here 📖'), P('Jinbeop, Writing Room, Play Yard, Hangul Blocks, Mask Dance, Dancheong — where to first? 🚪')],
  epiTop: (name) => P(`Come to think of it, you played ${name} the most! That touch is in your piece now ✋`),
  epiNoTop: () => P('The games you play the most change the shape too. Cool, right? 🔮'),
  epiAbout: () => G('Check “Story of this piece” below to see why it turned out this way 📖'),
  epiNextAll: () => P('You’ve been to all six boards! Play one again and the shape changes again 🔁'),
  epiNext: () => P('There are boards you haven’t visited yet. The yard is always open 🚪'),
};

// Lines on the mission cards and the Home banner
const SCENES = {
  prologue: {
    art: 'gate',
    place: 'Courtyard gate',
    lines: [P('You’re here, you’re here! Where to first today? 😆'), G('There are six boards. Go wherever you like. No order 🚪')],
  },
  jinbeop: {
    art: 'madang',
    place: 'Board 1 · Jinbeop Yard',
    lines: [P('Huh? The lines are messed up again! Who keeps doing this? 😤'), G('I bet they’d line up if you stepped in. We’ll shout “Eolssu!” 🥁')],
  },
  print: {
    art: 'byeongpung',
    place: 'Board 2 · Writing Room',
    lines: [G('Smell that ink~ The letter pieces are scattered again 🖌️'), P('Match them and the stamp goes bam! No handwriting needed 😆')],
  },
  play: {
    art: 'banner',
    place: 'Board 3 · Play Yard',
    lines: [P('The flag is flapping~ What should we play today? 🎏'), G('Anything you like! We’ll cheer from the side 🥳')],
  },
  hangul: {
    art: 'sunset',
    place: 'Board 4 · Hangul Blocks',
    lines: [P('Here they come again! ㄱ? ㅏ?? How many rows today? ☄️'), G('Screaming “Aaah!” is allowed. We do it all the time 🙈')],
  },
};

export default { BOOK, GAME_LINES, SCENE_WIN, SCENE_LOSE, EPI_BY_COUNT, T, SCENES };
