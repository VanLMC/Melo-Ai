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
import GenerationTypeSelector from "./components/GenerationTypeSelector";
import { generateMidiWithRandomNumbers } from "./helpers/generate-with-numbers";

const MELODY_BARS = 4;
const CHECKPOINT =
  "https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_4bar_med_q2";

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
  const [generationType, setGenerationType] = useState("artists");

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
        console.log("epoch", epoch + 1);
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

  async function generateMusicVaeMelody() {
    try {
      setLoading(true);

      await musicVae.initialize().then(async () => {
        await musicVae.sample(1).then((samples) => {
          const generatedMelodyeMelody = samples[0];
          setGeneratedSequence(generatedMelodyeMelody);
          setupVisualizer(generatedMelodyeMelody);
        });
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function generateWithRandomNumbers() {
    try {
      setLoading(true);
      const midi = generateMidiWithRandomNumbers();
      const sequence = await mm.midiToSequenceProto(midi);
      setGeneratedSequence(sequence);
      setupVisualizer(sequence);
    } catch (err) {
      console.log(err);
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

  const generateFunction = {
    ["artists"]: generateMidiMeMelody,
    ["pure-ai"]: generateMusicVaeMelody,
    ["algorithm"]: generateWithRandomNumbers,
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
      <GenerationTypeSelector
        generationType={generationType}
        setGenerationType={setGenerationType}
      />
      <Controls>
        {generationType === "artists" && (
          <>
            <Typography variant="h6" color="#fff" fontWeight={"bold"} mb={3}>
              Mix and Match Composers to create a unique melody using AI:
            </Typography>
            <DragComposers state={composers} setState={setComposers} />
          </>
        )}

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
          disabled={
            loading ||
            (generationType === "artists" && composers[1].length === 0)
          }
          onClick={generateFunction[generationType]}
          type="button"
        >
          {!loading ? "Generate" : <CircularProgress color="inherit" />}
        </Button>
      </Controls>
    </Container>
  );
}

export default App;
