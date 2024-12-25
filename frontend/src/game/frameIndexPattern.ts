type Frame = {
  time: number;
  frame: number;
};

type AnimationConfig = {
  duration: number;
  frames: Frame[];
};

export class FrameIndexPattern {
  animationConfig;
  currentTime: number;
  duration: number;
  constructor(animationConfig: AnimationConfig) {
    this.currentTime = 0;
    this.animationConfig = animationConfig;
    this.duration = animationConfig.duration ?? 500;
  }

  get frame() {
    const { frames } = this.animationConfig;
    for (let i = frames.length - 1; i >= 0; i--) {
      if (this.currentTime >= frames[i].time) {
        return frames[i].frame;
      }
    }
    throw "Time is before the first keyframe";
  }

  step(delta: number) {
    this.currentTime += delta;
    if (this.currentTime >= this.duration) {
      this.currentTime = 0;
    }
  }
}
