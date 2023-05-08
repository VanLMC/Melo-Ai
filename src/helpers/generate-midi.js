import MidiWriter from "midi-writer-js";

// const mockedArray = [
//   "F5",
//   "G5",
//   "A5",
//   "F5",
//   "G5",
//   " A5",
//   "C6",
//   " D6",
//   "F5",
//   "G5",
//   "A5",
//   "F5",
//   "G5",
//   "A5",
//   "C6",
//   "D6",
//   "E5",
//   "D5",
//   "E5",
//   "F5",
//   "G5",
//   "A5",
//   "F5",
//   "G5",
//   "E5",
//   "D5",
//   "E5",
//   "F5",
//   "G5",
//   "A5",
//   "F5",
//   "G5",
// ];

function generateRandomNumber(maxLimit) {
  let rand = Math.random() * maxLimit;

  rand = Math.floor(rand);

  return rand;
}

function generateMidi() {
  console.log("generateMidi");
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
    // const makeNextNoteWait = Math.random() >= 0.5;

    // if(makeNextNoteWait){

    // }

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

  console.log(sentence);
  track.addEvent(sentence);

  const write = new MidiWriter.Writer(track);
  console.log(write.dataUri());
  return write.dataUri();
}

// const repeatNote = Math.random() >= 0.5;
// console.log("repeatNote", repeatNote);
// if (repeatNote) {
//   console.log("repeatNote", repeatNote);
//   const amountOfRepetitions = generateRandomNumber(5);

//   let pitch = [];
//   for (let i = 0; i <= amountOfRepetitions; i++) {
//     pitch.push(note);
//   }

//   return new MidiWriter.NoteEvent({
//     pitch: pitch,
//     duration: intervals[generateRandomNumber(intervals.length)],
//     // wait:
//     //   index === 0 ? "0" : intervals[generateRandomNumber(intervals.length)],
//     velocity: 65,
//   });
// }

//calculate duration to fit the desired amount of bars

// function generateMidi(generatedMelodyArray = mockedArray) {
//   // Start with a new track
//   const track = new MidiWriter.Track();

//   // // Define an instrument (optional):
//   // track.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 1 }));

//   const midiEvents = generatedMelodyArray.map((note, index) => {
//     return new MidiWriter.NoteEvent({
//       pitch: [note],
//       duration: intervals[generateRandomNumber(intervals.length)],
//       //   wait:
//       //     index === 0 ? "0" : intervals[generateRandomNumber(intervals.length)],
//       velocity: 65,
//     });
//   });
//   // Add some notes:
//   track.addEvent(midiEvents);

//   // Generate a data URI
//   const write = new MidiWriter.Writer(track);
//   console.log(write.dataUri());
//   return write.dataUri();
// }

export { generateMidi };
