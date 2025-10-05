const context = new AudioContext();
let music: AudioBuffer | null = null;
let yoink: AudioBuffer | null = null;

async function load(path: string): Promise<AudioBuffer> {
  const response = await fetch(path);
  const buffer = await response.arrayBuffer();
  return await context.decodeAudioData(buffer);
}

async function loadMusicAndSounds() {
  music = await load("audio/music.mp3");
  yoink = await load("audio/yoink.mp3");
}

async function startMusic() {
  await context.resume();
  const gainNode = context.createGain();
  gainNode.gain.value = 0.5;
  gainNode.connect(context.destination);
  const musicNode = new AudioBufferSourceNode(context, {
    buffer: music,
    loop: true,
  });
  musicNode.connect(gainNode);
  musicNode.start();
}
