const offlineContext = new OfflineAudioContext(2, 1, 44100);
let audioContext: AudioContext | null = null;
let music: AudioBuffer | null = null;
let drop: AudioBuffer | null = null;
let yoink: AudioBuffer | null = null;

async function load(path: string): Promise<AudioBuffer> {
  const response = await fetch(path);
  const buffer = await response.arrayBuffer();
  return await offlineContext.decodeAudioData(buffer);
}

async function loadMusicAndSounds() {
  music = await load("music.mp3");
  drop = await load("drop.wav");
  yoink = await load("yoink.wav");
}

function initAudio() {
  audioContext = new AudioContext();
}

function startMusic() {
  const gainNode = audioContext!.createGain();
  gainNode.gain.value = 0.2;
  gainNode.connect(audioContext!.destination);
  const musicNode = new AudioBufferSourceNode(audioContext!, {
    buffer: music,
    loop: true,
  });
  musicNode.connect(gainNode);
  musicNode.start();
}

function playSound(buf: AudioBuffer) {
  const gainNode = audioContext!.createGain();
  gainNode.gain.value = 1.0;
  gainNode.connect(audioContext!.destination);
  const soundNode = new AudioBufferSourceNode(audioContext!, {
    buffer: buf,
  });
  soundNode.connect(gainNode);
  soundNode.start();
}

const audioLoading = loadMusicAndSounds();
