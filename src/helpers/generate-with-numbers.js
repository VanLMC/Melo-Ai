import MidiWriter from "midi-writer-js";

function generateRandomNumber(maxLimit) {
  let rand = Math.random() * maxLimit;

  rand = Math.floor(rand);

  return rand;
}

function generateMidiWithRandomNumbers() {
  //8 bars
  //each note takes a fourth
  // 8 * 4 = 32 = 32 notes until the end of the melody
  const eminorScale = ["E", "F#", "G", "A", "B", "C", "D"];
  const tonic = eminorScale[0];
  const fifth = eminorScale[4];
  const amountOfNotes = 32;
  const sentenceNoteAmount = amountOfNotes / 2;
  const intervals = ["4", "8"];

  const track = new MidiWriter.Track();

  let sentence = [];

  for (let i = 0; i <= sentenceNoteAmount - 1; i++) {
    //add tonic to start
    if (i === 0) {
      const midiEvent = new MidiWriter.NoteEvent({
        pitch: [tonic + "3"],
        duration: "4",
        velocity: 65,
      });
      sentence.push(midiEvent);
    } else if (i === sentenceNoteAmount - 1) {
      //add tension note in the end to restart the loop
      const midiEvent = new MidiWriter.NoteEvent({
        pitch: [fifth + "3"],
        duration: "4",
        velocity: 65,
      });
      sentence.push(midiEvent);
    } else {
      const duration = intervals[generateRandomNumber(intervals.length)];
      const midiEvent = new MidiWriter.NoteEvent({
        pitch: [eminorScale[generateRandomNumber(6)] + "3"],
        duration,
        velocity: 65,
      });
      sentence.push(midiEvent);
    }
  }

  track.addEvent(sentence);

  const write = new MidiWriter.Writer(track);

  return write.buildFile();
}

export { generateMidiWithRandomNumbers };
