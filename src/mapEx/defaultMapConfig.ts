import { ISMapConfig } from "./types";

export default {
  view: {
    center: [108.653, 35.2],
    zoom: 6,
    minZoom: 5,
    maxZoom: 17.5,
    dragRotate: true,
  },
  current: "black",
  token: {
    default: "KLSZfloFZoYooU*g",
    tianditu: "48ad25d128061c24f00559d481310004",
  },
  baseMaps: ["default", "blue", "black"],
} as ISMapConfig;
