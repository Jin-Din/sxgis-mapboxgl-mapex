import {
  AnyBasemapStyle,
  ISBaseMap,
  ISBaseMapType,
  ISRasterBaseMap,
  ISToken,
  ISVectorTileBaseMap,
  RasterBasemapStyle,
  tokenType,
  VectorBaseMapStyle,
} from "./";

import { ref, computed } from "vue";
const _token = ref<ISToken>({ default: "", tianditu: "", sx_img: "", sx_img_label: "" });

/**
 * 内置天地图陕西默认的地图集
 */
const defaultBaseMapVectorStyles = computed(() => {
  return {
    //默认
    default: `https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/sxww2022Geo/${_token.value.default}/VectorTileServer/styles/default.json`,
    //黑色/夜光
    black: `https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/sxww2022Geo/${_token.value.default}/VectorTileServer/styles/black.json`,
    //科技蓝
    blue: `https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/sxww2022Geo/${_token.value.default}/VectorTileServer/styles/blue.json`,
    //灰白
    gray: `https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/sxww2022Geo/${_token.value.default}/VectorTileServer/styles/blue.json`,
  };
});

const defaultBasemapRasterStyle = computed(() => {
  let { tianditu, sx_img, sx_img_label } = _token.value;
  return {
    tianditu_img_c: [0, 1, 2, 3, 4, 5, 6, 7].map((index) => `https://t${index}.tianditu.gov.cn/DataServer?T=img_c&x={x}&y={y}&l={z}&tk=${tianditu}`),
    tianditu_cia_c: [0, 1, 2, 3, 4, 5, 6, 7].map((index) => `https://t${index}.tianditu.gov.cn/DataServer?T=cia_c&x={x}&y={y}&l={z}&tk=${tianditu}`),
    tianditu_vec_c: [0, 1, 2, 3, 4, 5, 6, 7].map((index) => `https://t${index}.tianditu.gov.cn/DataServer?T=vec_c&x={x}&y={y}&l={z}&tk=${tianditu}`),
    tianditu_cva_c: [0, 1, 2, 3, 4, 5, 6, 7].map((index) => `https://t${index}.tianditu.gov.cn/DataServer?T=cva_c&x={x}&y={y}&l={z}&tk=${tianditu}`),
    //以下为天地图陕西的瓦片地图
    tianditu_sx_img: [`https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/SxImgMap/${sx_img}/TileServer/tile/{z}/{y}/{x}`],
    tianditu_sx_img_label: [
      `https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/SxImgLabelMap/${sx_img_label}/TileServer/tile/{z}/{y}/{x}`,
    ],
  };
});

/**
 * 内置天地图陕西默认地图集--ISBaseItem 结构
 */
const _defaultBaseMapItems = computed(() => {
  return {
    //默认
    default: {
      id: "default",
      name: "浅色",
      type: "vector" as ISBaseMapType,
      style: defaultBaseMapVectorStyles.value["default"], // `https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/sxww2022Geo/${_mapConfig.token?.default}/VectorTileServer/styles/default.json`,
    } as ISVectorTileBaseMap,
    //黑色/夜光
    black: {
      id: "black",
      name: "夜光",
      type: "vector" as ISBaseMapType,
      style: defaultBaseMapVectorStyles.value["black"], //`https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/sxww2022Geo/${_mapConfig.token?.tdtsxVector}/VectorTileServer/styles/black.json`,
    } as ISVectorTileBaseMap,
    //科技蓝
    blue: {
      id: "blue",
      name: "科技蓝",
      type: "vector" as ISBaseMapType,
      style: defaultBaseMapVectorStyles.value["blue"], //`https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/sxww2022Geo/${_mapConfig.token?.tdtsxVector}/VectorTileServer/styles/blue.json`,
    } as ISVectorTileBaseMap,
    //灰白
    gray: {
      id: "gray",
      name: "灰白",
      type: "vector" as ISBaseMapType,
      style: defaultBaseMapVectorStyles.value["gray"], //`https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/sxww2022Geo/${_mapConfig.token?.tdtsxVector}/VectorTileServer/styles/blue.json`,
    } as ISVectorTileBaseMap,
    // 天地图 影像
    tianditu_img_c: {
      id: "tianditu_img_c",
      type: "raster" as ISBaseMapType,
      style: {
        sources: {
          tianditu_img_c_source: {
            type: "raster",
            tiles: defaultBasemapRasterStyle.value["tianditu_img_c"],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "tianditu_img_c_layer",
            type: "raster",
            source: "tianditu_img_c_source",
            metadata: {
              isBaseMap: true,
            },
            layout: {
              visibility: "visible",
            },
          },
        ],
        version: 8,
      },
    } as ISRasterBaseMap,
    // 天地图 影像组
    tianditu_img_c_group: {
      id: "tianditu_img_c_group",
      type: "raster" as ISBaseMapType,
      style: {
        sources: {
          tianditu_img_c_source: {
            type: "raster",
            tiles: defaultBasemapRasterStyle.value["tianditu_img_c"],
            tileSize: 256,
          },
          tianditu_cia_c_source: {
            type: "raster",
            tiles: defaultBasemapRasterStyle.value["tianditu_cia_c"],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "tianditu_img_c_layer",
            type: "raster",
            source: "tianditu_img_c_source",
            metadata: {
              isBaseMap: true,
            },
            layout: {
              visibility: "visible",
            },
          },
          {
            id: "tianditu_cia_c_layer",
            type: "raster",
            source: "tianditu_cia_c_source",
            metadata: {
              isBaseMap: true,
            },
            layout: {
              visibility: "visible",
            },
          },
        ],
        version: 8,
      },
      subLayers: [],
    } as ISRasterBaseMap,
    // 天地图 矢量组
    tianditu_vec_c_group: {
      id: "tianditu_vec_c_group",
      type: "raster" as ISBaseMapType,
      style: {
        sources: {
          tianditu_vec_c_source: {
            type: "raster",
            tiles: defaultBasemapRasterStyle.value["tianditu_vec_c"],
            tileSize: 256,
          },
          tianditu_cva_c_source: {
            type: "raster",
            tiles: defaultBasemapRasterStyle.value["tianditu_cva_c"],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "tianditu_vec_c_layer",
            type: "raster",
            source: "tianditu_vec_c_source",
            metadata: {
              isBaseMap: true,
            },
            layout: {
              visibility: "visible",
            },
          },
          {
            id: "tianditu_cva_c_layer",
            type: "raster",
            source: "tianditu_cva_c_source",
            metadata: {
              isBaseMap: true,
            },
            layout: {
              visibility: "visible",
            },
          },
        ],
        version: 8,
      },
      subLayers: [],
    } as ISRasterBaseMap,
    //天地图·陕西 影像
    tianditu_sx_img: {
      id: "tianditu_sx_img",
      type: "raster" as ISBaseMapType,
      style: {
        sources: {
          tianditu_sx_img_source: {
            type: "raster",
            tiles: defaultBasemapRasterStyle.value["tianditu_sx_img"],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "tianditu_sx_img_layer",
            type: "raster",
            source: "tianditu_sx_img_source",
            metadata: {
              isBaseMap: true,
            },
            layout: {
              visibility: "visible",
            },
          },
        ],
        version: 8,
      },
    } as ISRasterBaseMap,
    //天地图·陕西 影像注记
    tianditu_sx_img_label: {
      id: "tianditu_sx_img_label",
      type: "raster" as ISBaseMapType,
      style: {
        sources: {
          tianditu_sx_img_label_source: {
            type: "raster",
            tiles: defaultBasemapRasterStyle.value["tianditu_sx_img_label"],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "tianditu_sx_img_label_layer",
            type: "raster",
            source: "tianditu_sx_img_label_source",
            metadata: {
              isBaseMap: true,
            },
            layout: {
              visibility: "visible",
            },
          },
        ],
        version: 8,
      },
    } as ISRasterBaseMap,
    // 天地图·陕西 影像组
    tianditu_sx_img_group: {
      id: "tianditu_sx_img_group",
      type: "raster" as ISBaseMapType,
      style: {
        sources: {
          tianditu_sx_img_source: {
            type: "raster",
            tiles: defaultBasemapRasterStyle.value["tianditu_sx_img"],
            tileSize: 256,
          },
          tianditu_sx_img_label_source: {
            type: "raster",
            tiles: defaultBasemapRasterStyle.value["tianditu_sx_img_label"],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "tianditu_sx_img_layer",
            type: "raster",
            source: "tianditu_sx_img_source",
            metadata: {
              isBaseMap: true,
            },
            layout: {
              visibility: "visible",
            },
          },
          {
            id: "tianditu_sx_img_label_layer",
            type: "raster",
            source: "tianditu_sx_img_label_source",
            metadata: {
              isBaseMap: true,
            },
            layout: {
              visibility: "visible",
            },
          },
        ],
        version: 8,
      },
      subLayers: [],
    } as ISRasterBaseMap,
  };
});
/**
 * 获取内置的地图配置对象
 * @param data
 * @returns
 */
export const getInnerBasemapItem = (data: AnyBasemapStyle | string): ISBaseMap => {
  if (typeof data === "string" && Object.keys(_defaultBaseMapItems.value).includes(data as string)) {
    return _defaultBaseMapItems.value[data as AnyBasemapStyle];
  }
  return null as unknown as ISBaseMap;
};
/**
 * 获取内置的S矢量地图配置对象
 * @param data
 * @returns
 */
export const getInnerVectorBasemapItem = (data: VectorBaseMapStyle | string): ISVectorTileBaseMap => {
  if (
    typeof data === "string" &&
    Object.keys(_defaultBaseMapItems.value)
      .filter((item) => _defaultBaseMapItems.value[item as AnyBasemapStyle].type === "vector")
      .includes(data as VectorBaseMapStyle)
  ) {
    return _defaultBaseMapItems.value[data as VectorBaseMapStyle];
  }
  return null as unknown as ISVectorTileBaseMap;
};
/**
 * 获取内置的影像地图配置对象
 * @param data
 * @returns
 */
export const getInnerRasterBasemapItem = (data: RasterBasemapStyle | string): ISRasterBaseMap => {
  if (
    typeof data === "string" &&
    Object.keys(_defaultBaseMapItems.value)
      .filter((item) => _defaultBaseMapItems.value[item as AnyBasemapStyle].type === "raster")
      .includes(data as RasterBasemapStyle)
  ) {
    return _defaultBaseMapItems.value[data as RasterBasemapStyle];
  }
  return null as unknown as ISRasterBaseMap;
};

export const setTokens = (token?: ISToken) => {
  //token 合并
  token && (_token.value = { ..._token.value, ...token });
  //   _token.value = token ? { ..._token.value, ...token } : _token.value;

  //   console.log(_token.value);
};
