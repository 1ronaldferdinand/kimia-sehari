export interface SceneSpec {
  id: number;
  badge: string;
  narration: string;
  callouts: string[];
  audioFile: string;
  durationInFrames: number;
}

export interface VideoProps {
  topik: string;
  judul_pendek: string;
  scenes: SceneSpec[];
}

export interface SceneRendererProps {
  sceneIndex: number;
  totalScenes: number;
  scene: SceneSpec;
  judulPendek: string;
}
