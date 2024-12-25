type ResourceKey = "sky" | "ground" | "hero" | "shadow";

export interface ResourceToLoad {
  sky: string;
  ground: string;
  hero: string;
  shadow: string;
}

export interface LoadedResource {
  image: HTMLImageElement;
  isLoaded: boolean;
}

class Resources {
  toLoad: ResourceToLoad;
  images: { [key in ResourceKey]: LoadedResource };

  constructor() {
    // everything to download
    this.toLoad = {
      sky: "/sprites/sky.png",
      ground: "sprites/ground.png",
      hero: "sprites/hero-sheet.png",
      shadow: "sprites/shadow.png",
    };

    // bucket of images
    this.images = {
      sky: { image: new Image(), isLoaded: false },
      ground: { image: new Image(), isLoaded: false },
      hero: { image: new Image(), isLoaded: false },
      shadow: { image: new Image(), isLoaded: false },
    };

    // Download all images
    (Object.keys(this.toLoad) as ResourceKey[]).forEach((key) => {
      const img = new Image();
      img.src = this.toLoad[key];
      this.images[key] = {
        image: img,
        isLoaded: false,
      };
      img.onload = () => {
        this.images[key].isLoaded = true;
      };
    });
  }
}

export const resources = new Resources();
