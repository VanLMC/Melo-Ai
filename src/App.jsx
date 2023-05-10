import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { MidiMe } from "@magenta/music";
const player = new mm.Player();
const model = new mm.MusicVAE(
  "https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small"
);
const MELODY_BARS = 2;
async function generateMusicVaeMelody() {
  let musicVaeMelody;

  async function generate() {
    await mm.Player.tone.context.resume(); // enable audio
    await model.sample(1).then((samples) => {
      musicVaeMelody = samples[0]; // store musicVaeMelody for download
      player.start(musicVaeMelody);
    });
  }

  function download() {
    if (!musicVaeMelody) {
      alert("You must generate a musicVaeMelody before you can download it!");
    } else {
      saveAs(new File([mm.sequenceProtoToMidi(musicVaeMelody)], "trio.mid"));
    }
  }

  await generate();
  download();
}

async function generateMidiMeMelody() {
  const training = {};
  await mm.Player.tone.context.resume(); // enable audio

  function loadFiles() {
    const fileInput = document.getElementById("fileInput");

    const promises = [];
    for (let i = 0; i < fileInput.files.length; i++) {
      promises.push(mm.blobToNoteSequence(fileInput.files[i]));
    }
    return Promise.all(promises).then((res) => res);
  }

  function getChunks(quantizedMels) {
    let chunks = [];
    quantizedMels.forEach((m) => {
      const melChunks = mm.sequences.split(
        mm.sequences.clone(m),
        16 * MELODY_BARS
      );
      chunks = chunks.concat(melChunks);
    });
    return chunks;
  }

  const noteSequences = await loadFiles();
  const quantizedSequence = mm.sequences.quantizeNoteSequence(
    noteSequences[0],
    4
  );

  const chunks = getChunks([quantizedSequence]);
  console.log(chunks);
  const z = await model.encode(chunks);

  const midime = new MidiMe({ epochs: 100 });
  midime.initialize();

  await midime.train(z, async (epoch, logs) => {
    console.log("epoch + 1", epoch + 1);
    console.log("plot loss", logs.total);
  });

  const s = await midime.sample(1);
  const zArray = s.arraySync()[0];
  const currentSample = (await model.decode(s))[0];
  player.start(currentSample);
  console.log(currentSample);
}

function App() {
  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>MELO AI</h1>
      <div className="mt-3">
        <select name="key" id="key">
          <option>Em</option>
          <option>Fm</option>
        </select>
      </div>

      <div className="mt-3">
        <select name="amount-of-bars" id="amount-of-bars">
          <option>8</option>
          <option>16</option>
        </select>
      </div>

      <div className="mt-3">
        <select name="artist" id="artist">
          <option>None</option>
          <option>Stevie Wonder</option>
          <option>Michael Jackson</option>
          <option>Martin Garrix</option>
        </select>
      </div>
      <input type="file" id="fileInput" multiple />
      <button
        className="btn btn-success mt-3"
        dowload="melody"
        onClick={generateMidiMeMelody}
        // onClick={generateMusicVaeMelody}
        // onClick={initializeMidiMe}
        //onClick={generateMidi}
      >
        Generate
      </button>
    </div>
  );
}

export default App;
