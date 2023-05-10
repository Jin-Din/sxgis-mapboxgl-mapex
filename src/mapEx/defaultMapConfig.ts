import { ISMapConfig } from "./";

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
    default: "",
    tianditu: "",
  },
  baseMaps: ["default", "blue", "black"],
} as ISMapConfig;
