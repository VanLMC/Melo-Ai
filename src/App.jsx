import { useRef, useState } from "react";
import { MidiMe } from "@magenta/music";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useSpring, animated } from "@react-spring/web";
import {
  Container,
  Controls,
  Logo,
  PianoCanvasContainer,
  SvgContainer,
} from "./styles";
import animatedPiano from "./assets/animated_piano.svg";
import DragComposers from "./components/DragComposers";
import { options, pianoCanvasConfig } from "../constants";
import { CircularProgress } from "@mui/material";

const model = new mm.MusicVAE(
  "https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_4bar_med_q2"
);
const MELODY_BARS = 4;

const serverUrl = "http://192.168.0.4:8000";

async function generateMusicVaeMelody() {
  let musicVaeMelody;

  async function generate() {
    await mm.Player.tone.context.resume(); // enable audio
    await model.initialize().then(async () => {
      await model.sample(1).then((samples) => {
        musicVaeMelody = samples[0];
      });
    });
  }

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
  const [composers, setComposers] = useState([options, []]);
  const [loading, setLoading] = useState(false);
  const [generatedSequence, setGeneratedSequence] = useState(null);

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

  async function generateMidiMeMelody() {
    setLoading(true);

    let midiMeMelody;
    const selectedComposers = composers[1];

    const fetchMidiPromises = selectedComposers.map(async (composer) => {
      const fileNames = await fetchFileNames(composer.id);
      const midisequencesFromServer = await loadMidi(fileNames, composer.id);
      return midisequencesFromServer;
    });
    const midiSequencesResponse = await Promise.all(fetchMidiPromises).then(
      (res) => res
    );

    const midiSequences = midiSequencesResponse.flat();

    const quantizedSequences = midiSequences.map((sequence) =>
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
    midiMeMelody = (await model.decode(s))[0];

    if (!midiMeMelody) return;
    midiMeMelody.notes.forEach((note) => (note.velocity = 100));

    setGeneratedSequence(midiMeMelody);

    new mm.PianoRollCanvasVisualizer(
      midiMeMelody,
      document.getElementById("canvas"),
      pianoCanvasConfig
    );
    saveAs(new File([mm.sequenceProtoToMidi(midiMeMelody)], "melody.mid"));

    setLoading(false);
  }

  const [props, api] = useSpring(
    () => ({
      config: { duration: 4000 },
      from: { position: "absolute", top: -60 },
      to: [
        { position: "absolute", top: -30 },
        { position: "absolute", top: -60 },
      ],
      loop: true,
    }),
    []
  );

  const visualizerRef = useRef(null);
  return (
    <Container>
      <Typography variant="h2" color="secondary" fontWeight={"bold"}>
        Melo AI
      </Typography>

      <SvgContainer>
        <animated.div style={props}>
          <Logo draggable="false" src={animatedPiano} className="logo" />
        </animated.div>
      </SvgContainer>

      <Controls>
        <Typography variant="h6" color="#fff" fontWeight={"bold"} mb={3}>
          Mix and Match Composers to create a unique melody using AI:
        </Typography>

        <DragComposers state={composers} setState={setComposers} />

        <PianoCanvasContainer show={generatedSequence}>
          <canvas id="canvas" width="500"></canvas>
        </PianoCanvasContainer>

        <Button
          size="large"
          sx={{ marginTop: "20px" }}
          variant="contained"
          dowload="melody"
          color="secondary"
          onClick={generateMidiMeMelody}
          disabled={loading}
          //onClick={generateMusicVaeMelody}
          type="button"
        >
          {!loading ? "Generate" : <CircularProgress color="inherit" />}
        </Button>
      </Controls>
    </Container>
  );
}

export default App;
