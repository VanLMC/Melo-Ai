import { useState } from "react";
import { MidiMe } from "@magenta/music";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useSpring, animated } from "@react-spring/web";
import { Container, Logo, SvgContainer } from "./styles";
import animatedPiano from "./assets/animated_piano.svg";

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

  const [props, api] = useSpring(
    () => ({
      config: { duration: 4000 },
      from: { position: "absolute", top: -30 },
      to: [
        { position: "absolute", top: 0 },
        { position: "absolute", top: -30 },
      ],
      loop: true,
    }),
    []
  );

  return (
    <Container>
      <Typography variant="h2" color="secondary" fontWeight={"bold"}>
        Melo AI
      </Typography>

      <SvgContainer>
        <animated.div style={props}>
          <Logo src={animatedPiano} className="logo" />
        </animated.div>
      </SvgContainer>
      <Button
        size="large"
        sx={{ marginTop: "20px" }}
        variant="contained"
        dowload="melody"
        onClick={generateMidiMeMelody}
        //onClick={generateMusicVaeMelody}
        type="button"
      >
        {!loading ? "Generate" : "..."}
      </Button>
    </Container>
  );
}

export default App;
