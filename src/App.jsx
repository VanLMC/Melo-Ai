import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { MidiMe } from "@magenta/music";
import { useState } from "react";

const model = new mm.MusicVAE(
  "https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small"
);
const MELODY_BARS = 2;

const serverUrl = "http://192.168.0.4:8000";

async function generateMusicVaeMelody() {
  let musicVaeMelody;

  async function generate() {
    await mm.Player.tone.context.resume(); // enable audio
    await model.initialize().then(async () => {
      await model.sample(1).then((samples) => {
        musicVaeMelody = samples[0];
        //player.start(musicVaeMelody);
      });
    });
  }
  console.log(musicVaeMelody);
  function download() {
    if (!musicVaeMelody) {
      alert("You must generate a musicVaeMelody before you can download it!");
    } else {
      musicVaeMelody.notes.forEach((note) => (note.velocity = 100));
      saveAs(new File([mm.sequenceProtoToMidi(musicVaeMelody)], "melody.mid"));
    }
  }

  await generate();
  download();
}

const fetchFileNames = async (artistName) => {
  return await fetch(`${serverUrl}/midi-files/${artistName}`)
    .then((res) => res.json())
    .then((res) => res.files);
};

function App() {
  const [loading, setLoading] = useState(false);

  async function generateMidiMeMelody() {
    let midiMeMelody;
    const artistName = "martin-garrix";

    setLoading(true);

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

    function loadMidi(fileNames, artistName) {
      const promises = [];

      fileNames.forEach((fileName) => {
        const fileUrl = `${serverUrl}/midi-files/${artistName}/${fileName}`;
        const promise = mm.urlToBlob(fileUrl).then(async (blob) => {
          return await mm.blobToNoteSequence(blob);
        });
        promises.push(promise);
      });

      return Promise.all(promises).then((res) => res);
    }

    const fileNames = await fetchFileNames(artistName);

    const midisequencesFromServer = await loadMidi(fileNames, artistName);

    const quantizedSequences = midisequencesFromServer.map((sequence) =>
      mm.sequences.quantizeNoteSequence(sequence, 4)
    );

    const chunks = getChunks(quantizedSequences);
    const z = await model.encode(chunks);

    const midime = new MidiMe({ epochs: 100 });
    midime.initialize();

    await midime.train(z, async (epoch, logs) => {
      console.log("epoch + 1", epoch + 1);
      console.log("plot loss", logs.total);
    });

    const s = await midime.sample(1);
    const zArray = s.arraySync()[0];
    midiMeMelody = (await model.decode(s))[0];

    if (!midiMeMelody) return;
    midiMeMelody.notes.forEach((note) => (note.velocity = 100));
    saveAs(new File([mm.sequenceProtoToMidi(midiMeMelody)], "melody.mid"));

    setLoading(false);
  }

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
        <select name="artist" id="artist">
          <option>None</option>
          <option>Stevie Wonder</option>
          <option>Michael Jackson</option>
          <option>Martin Garrix</option>
        </select>
      </div>

      <button
        className="btn btn-success mt-3"
        dowload="melody"
        onClick={generateMidiMeMelody}
        type="button"
        //onClick={generateMusicVaeMelody}
        // onClick={initializeMidiMe}
        //onClick={generateMidi}
      >
        {!loading ? "Generate" : "..."}
      </button>
    </div>
  );
}

export default App;
