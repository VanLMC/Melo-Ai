import { SERVER_URL } from "../../constants";

export function loadMidi(fileNames, artistName) {
  const promises = [];

  fileNames.forEach((fileName) => {
    const fileUrl = `${SERVER_URL}/midi-files/${artistName}/${fileName}`;
    const promise = mm.urlToBlob(fileUrl).then(async (blob) => {
      return await mm.blobToNoteSequence(blob);
    });
    promises.push(promise);
  });

  return Promise.all(promises).then((res) => res);
}
