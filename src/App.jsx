import { useMemo, useState } from "react";
import { MidiMe } from "@magenta/music";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useSpring, animated } from "@react-spring/web";
import {
  Container,
  Controls,
  Logo,
  PianoCanvasContainer,
  PianoRollButtonsContainer,
  SvgContainer,
} from "./styles";
import animatedPiano from "./assets/animated_piano.svg";
import DragComposers from "./components/DragComposers";
import { SERVER_URL, options, pianoCanvasConfig } from "../constants";
import { CircularProgress } from "@mui/material";
import { Download, Pause, PlayArrow } from "@mui/icons-material";
import { getChunks } from "./helpers/quantize-melodies";
import { loadMidi } from "./helpers/load-midi";

const MELODY_BARS = 4;
const CHECKPOINT =
  "https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_4bar_med_q2";

async function generateMusicVaeMelody() {
  let musicVaeMelody;

  async function generate() {
    await mm.Player.tone.context.resume(); // enable audio
    await musicVae.initialize().then(async () => {
      await musicVae.sample(1).then((samples) => {
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
  return await fetch(`${SERVER_URL}/midi-files/${artistName}`)
    .then((res) => res.json())
    .then((res) => res.files);
};

function App() {
  const [composers, setComposers] = useState([options, []]);
  const [loading, setLoading] = useState(false);
  const [generatedSequence, setGeneratedSequence] = useState(null);
  const [isPLaying, setIsPlaying] = useState(false);
  const [visualizer, setVisualizer] = useState(null);

  const musicVae = useMemo(() => new mm.MusicVAE(CHECKPOINT), []);

  const [props, _] = useSpring(
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

  const player = useMemo(
    () =>
      new mm.Player(false, {
        run: (note) => visualizer.redraw(note),
        stop: () => {
          setIsPlaying(false);
        },
      }),
    [visualizer]
  );

  async function generateMidiMeMelody() {
    try {
      setLoading(true);

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

      const chunks = getChunks(quantizedSequences, MELODY_BARS);
      const z = await musicVae.encode(chunks);

      const midime = new MidiMe({ epochs: 100 });
      midime.initialize();

      await midime.train(z, async (epoch, logs) => {
        console.log("epoch + 1", epoch + 1);
        console.log("plot loss", logs.total);
      });

      const s = await midime.sample(1);
      const generatedMelodyeMelody = (await musicVae.decode(s))[0];

      if (!generatedMelodyeMelody) return;
      generatedMelodyeMelody.notes.forEach((note) => (note.velocity = 100));

      setGeneratedSequence(generatedMelodyeMelody);
      setupVisualizer(generatedMelodyeMelody);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const setupVisualizer = (generatedMelodyeMelody) => {
    const visualizer = new mm.PianoRollCanvasVisualizer(
      generatedMelodyeMelody,
      document.getElementById("canvas"),
      pianoCanvasConfig
    );
    setVisualizer(visualizer);
  };

  const playSequence = () => {
    setIsPlaying(true);
    player.start(generatedSequence);
  };

  const stopSequence = () => {
    setIsPlaying(false);
    player.stop();
  };

  const downloadSequence = async () => {
    saveAs(new File([mm.sequenceProtoToMidi(generatedSequence)], "melody.mid"));
  };

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
        {generatedSequence && (
          <PianoRollButtonsContainer>
            {isPLaying ? (
              <Button
                color="secondary"
                onClick={stopSequence}
                title="Stop  melody"
              >
                <Pause />
              </Button>
            ) : (
              <Button
                color="secondary"
                onClick={playSequence}
                title="Play  melody"
              >
                <PlayArrow />
              </Button>
            )}
            <Button
              color="secondary"
              onClick={downloadSequence}
              title="Download midi"
            >
              <Download />
            </Button>
          </PianoRollButtonsContainer>
        )}
        <Button
          size="large"
          sx={{ marginTop: "20px" }}
          variant="contained"
          dowload="melody"
          color="secondary"
          onClick={generateMidiMeMelody}
          disabled={loading || composers[1].length === 0}
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
