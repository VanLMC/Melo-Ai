import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { generateMidi } from "./helpers/generate-midi";
import { MidiMe } from "@magenta/music";
// const MagentaMusic = require("@magenta/music");
function App() {
  const [count, setCount] = useState(0);

  // const generateMelody = () => {
  //   const midime = new MidiMe({ epochs: 100 });
  //   midime.initialize();
  //   console.log("midime", midime);
  //   console.log("midime");
  // };

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
        //onClick={generateMelody}
        onClick={generateMidi}
      >
        Generate
      </button>
    </div>
  );
}

export default App;
