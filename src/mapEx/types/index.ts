import { Layer, LngLatBoundsLike, Style } from "mapbox-gl";

// #region mapEx接口
export type ISBaseMapType = "vector" | "raster";

// export type ISBaseMapRasterName = "TDTSX_VECTOR" | "TDTSX_IMAGE" | "TDTSX_IMAGE_LABEL";

export type VectorBaseMapStyle = "default" | "blue" | "black" | "gray"; //天地图陕西矢量地图风格

export type RasterBasemapStyle =
  | "tianditu_sx_img"
  | "tianditu_sx_img_label"
  | "tianditu_sx_img_group"
  | "tianditu_img_c"
  | "tianditu_img_c_group"
  | "tianditu_vec_c_group";
export type AnyBasemapStyle = VectorBaseMapStyle | RasterBasemapStyle;
export type tokenType = "default" | "tianditu" | "sx_img" | "sx_img_label"; //地图token 管理

export interface ISToken extends Partial<Record<tokenType, string | undefined>> {}

export interface ISMapView {
  center: [number, number];
  zoom: number; // 默认级别
  pitch?: number; // 视角倾斜角度
  maxPitch?: number;
  minPitch?: number;
  minZoom?: number;
  maxZoom?: number;
  dragRotate?: boolean;
}
export interface ISMapViewFullExtent {
  extent: LngLatBoundsLike;
  pitch: number; // 视角倾斜角度
}
export interface ISMapConfig {
  view?: ISMapView;
  current: string;
  fullExtent?: ISMapViewFullExtent;
  token?: ISToken; //Partial<Record<tokenType, string>>;
  baseMaps: (ISBaseMap | string)[];
}

export interface ISLayer extends Layer {
  id: any;
  layout: any;
  name?: string;
}
export interface ISBaseMap {
  id: string;
  name?: string;
  icon?: string;
  type: ISBaseMapType;
  style?: string | Style;
}
export interface ISVectorTileBaseMap extends ISBaseMap {
  type: "vector";
  style?: string;
}
export interface ISRasterBaseMap extends ISBaseMap {
  type: "raster";
  // sources: Sources;
  style?: Style;
  // baseLayers: ISLayer[];
  subLayers?: ISLayer[];
  // terrain?: TerrainSpecification | undefined;
}
/**
 * 鼠标样式
 */
export interface ISMapCursorOption {
  url: string;
  offset?: [number, number];
}

// #endregion
