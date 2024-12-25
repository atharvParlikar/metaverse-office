import { FrameIndexPattern } from "./frameIndexPattern";

type Patterns = { [key: string]: FrameIndexPattern };

export class Animations {
  patterns: Patterns;
  activeKey: string;
  constructor(patterns: Patterns) {
    this.patterns = patterns;
    this.activeKey = Object.keys(this.patterns)[0];
  }

  get frame() {
    return this.patterns[this.activeKey].frame;
  }

  play(key: string, startTime: number = 0) {
    if (this.activeKey === key) return;

    this.activeKey = key;
    this.patterns[key].currentTime = startTime;
  }

  step(delta: number) {
    this.patterns[this.activeKey].step(delta);
  }
}
