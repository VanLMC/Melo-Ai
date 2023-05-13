export function loadMidi(fileNames, artistName) {
  const serverURl = import.meta.env.VITE_SERVER_URL;
  const promises = [];
  fileNames.forEach((fileName) => {
    const fileUrl = `${serverURl}/midi-files/${artistName}/${fileName}`;
    const promise = mm.urlToBlob(fileUrl).then(async (blob) => {
      return await mm.blobToNoteSequence(blob);
    });
    promises.push(promise);
  });

  return Promise.all(promises).then((res) => res);
}
