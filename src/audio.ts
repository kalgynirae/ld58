const offlineContext = new OfflineAudioContext(2, 1, 44100);
let audioContext: AudioContext | null = null;

let music: AudioBuffer | null = null;
let spacemusic: AudioBuffer | null = null;
let musicGainNode: GainNode | null = null;
let musicNode: AudioBufferSourceNode | null = null;

let collect: AudioBuffer | null = null;
let drop: AudioBuffer | null = null;
let fire: AudioBuffer | null = null;
let yoink: AudioBuffer | null = null;

async function load(path: string): Promise<AudioBuffer> {
  const response = await fetch(path);
  const buffer = await response.arrayBuffer();
  return await offlineContext.decodeAudioData(buffer);
}

async function loadMusicAndSounds() {
  music = await load("music.mp3");
  spacemusic = await load("spacemusic.mp3");
  collect = await load("collect.wav");
  drop = await load("drop.wav");
  fire = await load("fire.wav");
  yoink = await load("yoink.wav");
}

function initAudio() {
  audioContext = new AudioContext();
}

function playMusic(buf: AudioBuffer) {
  let startTime = 0;
  if (musicGainNode == null) {
    musicGainNode = audioContext!.createGain();
    musicGainNode.gain.value = 0.6;
    musicGainNode.connect(audioContext!.destination);
  } else {
    const now = audioContext!.currentTime;
    musicGainNode.gain.linearRampToValueAtTime(0.1, now + 1);
    musicGainNode.gain.setValueAtTime(0.6, now + 1);
    musicNode!.stop(now + 1);
    startTime = now + 1;
  }
  musicNode = new AudioBufferSourceNode(audioContext!, {
    buffer: buf,
    loop: (buf === music),
    loopStart: (buf === music) ? 3.872 : 0,
    loopEnd: music!.duration,
  });
  musicNode.connect(musicGainNode);
  musicNode.start(startTime);
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
