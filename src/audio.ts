const offlineContext = new OfflineAudioContext(2, 1, 44100);
let audioContext: AudioContext | null = null;
let music: AudioBuffer | null = null;
let yoink: AudioBuffer | null = null;

async function load(path: string): Promise<AudioBuffer> {
  const response = await fetch(path);
  const buffer = await response.arrayBuffer();
  return await offlineContext.decodeAudioData(buffer);
}

async function loadMusicAndSounds() {
  music = await load("music.mp3");
  // yoink = await load("yoink.mp3");
}

function initAudio() {
  audioContext = new AudioContext();
}

function startMusic() {
  const gainNode = audioContext!.createGain();
  gainNode.gain.value = 0.5;
  gainNode.connect(audioContext!.destination);
  const musicNode = new AudioBufferSourceNode(audioContext!, {
    buffer: music,
    loop: true,
  });
  musicNode.connect(gainNode);
  musicNode.start();
}

const audioLoading = loadMusicAndSounds();
