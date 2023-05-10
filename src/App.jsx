import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

const player = new mm.Player();
const model = new mm.MusicVAE(
  "https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_16bar_small_q2"
);

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

      <button
        className="btn btn-success mt-3"
        dowload="melody"
        onClick={generateMusicVaeMelody}
        // onClick={initializeMidiMe}
        //onClick={generateMidi}
      >
        Generate
      </button>
    </div>
  );
}

export default App;
