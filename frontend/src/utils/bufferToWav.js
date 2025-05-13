export function bufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let offset = 0;
  const writeString = function (str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  writeString("RIFF"); offset += 4;
  view.setUint32(offset, length - 8, true); offset += 4;
  writeString("WAVE"); offset += 4;
  writeString("fmt "); offset += 4;
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, numOfChan, true); offset += 2;
  view.setUint32(offset, buffer.sampleRate, true); offset += 4;
  view.setUint32(offset, buffer.sampleRate * 2 * numOfChan, true); offset += 4;
  view.setUint16(offset, numOfChan * 2, true); offset += 2;
  view.setUint16(offset, 16, true); offset += 2;
  writeString("data"); offset += 4;
  view.setUint32(offset, length - offset - 4, true); offset += 4;
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  let sample = 0;
  while (sample < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      const s = Math.max(-1, Math.min(1, channels[i][sample]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
    sample++;
  }
  return new Blob([view], { type: "audio/wav" });
}
