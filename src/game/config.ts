import * as Phaser from "phaser";

export interface CreateGameConfigOptions {
  parent: HTMLElement;
  scenes: Phaser.Types.Scenes.SceneType[];
}

export function createGameConfig(options: CreateGameConfigOptions): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: options.parent,
    width: 1024,
    height: 576,
    backgroundColor: "#0b101b", // Elegantna tamna pozadina u tonu sajta
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1024,
      height: 576,
    },
    render: {
      antialias: true,
      roundPixels: true,
    },
    scene: options.scenes,
  };
}
