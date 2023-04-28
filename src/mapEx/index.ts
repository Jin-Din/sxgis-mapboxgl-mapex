/**
 * Mapbox-GL plugin
 * 基于mapbox的图层管理扩展
 * 1.区分底图图层和普通图层
 * 2.支持图层分组
 *
 * auther:Jin
 * date:2023.3.7 修订
 * 修订：2023.3.7 修订 -Jin
 * 1.去掉分组，形成单一的底图切换功能
 * 2.部分接口重命名，如 MapOptionEx -> ISCustomOptionEx
 *
 * 修订：2023.3.8 修订 -Jin
 * 1.remeoveBasemapStyle 优化。 删除layer时同步删除引用的source
 * 2.替换axios 为 fetch
 *
 */
// 除了mapboxgl，其他接口引用了mapbox-gl库

// import { BaseMapVectorStyle, ISBaseMap, ISMapConfig, ISRasterBaseMap, ISVectorTileBaseMap } from "./types";
import type {
  MapboxOptions,
  AnyLayer,
  BackgroundLayer,
  CustomLayerInterface,
  Layer,
  Style,
  AnySourceImpl,
  AnySourceData,
  Sources,
  TerrainSpecification,
  LngLatBoundsLike,
} from "mapbox-gl";
import { ref, computed } from "vue";
import mapboxgl from "./mapbox-gl-tdtsx";

mapboxgl.accessToken = "pk.eyJ1Ijoib25lZ2lzZXIiLCJhIjoiY2plZHptcnVuMW5tazMzcWVteHM2aGFsZiJ9.ERWP7zZ-N6fmNl3cRocJ1g";

import defaultMapConfig from "./defaultMapConfig"; //默认配置
import { setTokens, getInnerBasemapItem, getInnerVectorBasemapItem, getInnerRasterBasemapItem } from "./defaultBaseMap";

export default mapboxgl;

// #region mapEx接口
export type ISBaseMapType = "vector" | "raster";

// export type ISBaseMapRasterName = "TDTSX_VECTOR" | "TDTSX_IMAGE" | "TDTSX_IMAGE_LABEL";

export type VectorBaseMapStyle = "default" | "blue" | "black" | "gray"; //天地图陕西矢量地图风格
export type RasterBasemapStyle = "tianditu_img_c" | "tianditu_img_c_group" | "tianditu_vec_c_group";
export type AnyBasemapStyle = VectorBaseMapStyle | RasterBasemapStyle;
export type tokenType = "tdtsxVector" | "tdt" | "tdtsx_img" | "tdtsx_img_anno"; //地图token 管理

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

// #region 自定义内容

//底图与其他业务图层的分割层
const BASEMAP_SPLITED_LAYER: string = "sxgis.basemap.splited.empty.layer";
// 默认的分割图层名称
const fill_group_layer: string = "sxgis.fill.splited.group.layer";
const line_group_layer: string = "sxgis.line.splited.group.layer";
const point_group_layer: string = "sxgis.point.splited.group.layer";

interface ISCustomMetadata {
  group?: string;
  isSplitLayer: boolean; //标识是否是分割图层
  isBaseMap: boolean; //标识是否是底图
}
interface ISCustomOptionEx {
  metadata: ISCustomMetadata;
}

/***
 * 默认选项，非底图，非分割
 *
 * isBaseMap: false, isSplitLayer: false
 */
const defaultOptionEx: ISCustomOptionEx = {
  metadata: { isBaseMap: false, isSplitLayer: false },
};
/***
 * 底图选项，底图，非分割
 *
 * isBaseMap: true, isSplitLayer: false
 */
const baseMapOptionEx: ISCustomOptionEx = {
  metadata: { isBaseMap: true, isSplitLayer: false },
};
/***
 * 图层分组选项，非底图，分割
 *
 * isBaseMap: false, isSplitLayer: true
 */
const layerGroupOptionEx: ISCustomOptionEx = {
  metadata: { isBaseMap: false, isSplitLayer: true },
};

declare module "mapbox-gl" {
  interface Layer {
    metadata?: ISCustomMetadata | any;
  }
}

/**
 * see doc: https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/
 *
 * @author wang1212
 * @interface LayerDefinition
 */
interface LayerDefinition {
  [p: string]: unknown;
}
// #endregion

export class Map extends mapboxgl.Map {
  constructor(options?: MapboxOptions) {
    super(options);
    this.on("load", () => {
      // 加载后初始化默认图层
      this.initDefaultEmptyLayers();
    });
  }

  /**
   * 初始化一些默认的空图层
   * @returns
   */
  initDefaultEmptyLayers(): void {
    //初始化底图和其他图层的分割
    this.safeAddBaseMapSplitedLayer();
    // 点、线、面、分组层
    [fill_group_layer, line_group_layer, point_group_layer].forEach((layergroup) => {
      //查找是否存在
      this.addEmptyLayer(layergroup);
    });
  }

  /**
   * 判断指定图层id的图层是否存在
   * @param id
   * @returns true or false
   */
  isLayer(id: string): boolean {
    return !!this.getLayer(id);
  }
  /**
   * 重写 addLayer，对新加入的图层强制加入 {metadata:{isBaseMap:boolean}} 扩展属性，默认加入 {metadata:{isBaseMap:false}}
   * @param layer
   * @param before
   * @returns
   */
  addLayer(layer: AnyLayer, before?: string | undefined): this {
    let { metadata } = defaultOptionEx;
    let nLayer = {
      metadata,
      ...layer,
    };
    //根据layer 类型判断，分别加入到指定的点、线、面 组内
    let beforeId = undefined;
    switch (layer.type) {
      case "circle":
      case "symbol":
        beforeId = point_group_layer;
        break;
      case "line":
        beforeId = line_group_layer;
        break;
      case "fill":
      case "raster":
        beforeId = fill_group_layer;
        break;
      default:
        break;
    }

    return super.addLayer(nLayer, before ?? beforeId);
    // return super.addLayer(nLayer, before);
  }

  addLayerEx(layer: AnyLayer, bOrder: boolean = true) {}

  refreshBaseLayers(): void {
    //TODO 对底图进行检查，并标记为底图 isBaseMap =true ,采取的办法是取到原来的图层，保存并检查加入配置，然后删除原图层，再次加入。 效率有待提高

    let splitedLayer = this.safeAddBaseMapSplitedLayer();

    let { layers } = this.getStyle();
    if (layers) {
      let index = layers.findIndex((item) => item.id == splitedLayer?.id);
      let toCheckLayers = layers.slice(0, index);
      //记录下来
      let toUpdatelayers: AnyLayer[] = [];
      for (let index = 0; index < toCheckLayers.length; index++) {
        const checkLayer = toCheckLayers[index];
        let toUpdateLayer = {
          ...baseMapOptionEx,
          ...checkLayer,
        };
        toUpdatelayers.push(toUpdateLayer);
        this.removeLayer(checkLayer.id);
      }
      //再重新加进去
      for (const layer of toUpdatelayers) {
        this.addLayer(layer, splitedLayer?.id);
      }
    }
  }
  /**
   * [自定义方法]清空除了底图、分割图层等内置图层之外的所有临时（专题）图层
   */
  removeOtherLayers(): void {
    let [id, index] = this.getFirstBaseMapSplitedLayerId();
    let { layers } = this.getStyle();
    layers &&
      layers
        .slice(index + 1)
        .filter((anylayer) => {
          let metadata = (anylayer as Layer).metadata as ISCustomMetadata;
          return metadata && !metadata.isSplitLayer && !metadata.isBaseMap;
        })
        .map((item) => {
          this.removeLayer(item.id);
        });
  }
  //#region  图层（包括底图图层）加载控制
  /**
   * [自定义]切换底图
   * @param data string类型代表矢量瓦片url 地址
   * @param removeLast  是否移除上一次的底图 ，默认为true,目前不起作用
   */
  private _changeBaseMap = async (data: Style | string | undefined, removeLast = true) => {
    if (!data) return;
    this.removeBaseStyle();
    await this.addBaseMapStyle(data, baseMapOptionEx);
  };
  /**
   * 切换底图
   * @param baseMapItem 传入底图item，可以是内置地图的id（如default，black，blue，gray），也可以是自定义的ISBaseMap对象。
   */
  changeBaseMap = (baseMapItem: AnyBasemapStyle | ISBaseMap) => {
    if (!baseMapItem) return;

    if (typeof baseMapItem === "string") {
      //如果是string，则判读为内置底图id，根据id获取内置真实的配置
      baseMapItem = getInnerBasemapItem(baseMapItem as string);
      this.changeBaseMap(baseMapItem);
    } else {
      //增加一道检测：检查 ISVectorTileBaseMap.style 的值，返回真实的 内置矢量瓦片地址
      this._changeBaseMap(parseBasemItemToStyle(baseMapItem));
    }
  };
  /**
   * 切换style ，
   * 方法一：[不推荐] setSyle。 把新style与旧style合并，重新setStyle。简单粗暴
   *
   * 缺点：
   * 1.切换时整个地图会重新刷一遍，视觉上就会出现白屏
   * 2.之前动态加载的资源（如图标）将被清空，需要重新加载
   * @param styleJson
   * @param stay
   * @returns
   */
  private changeStyle = async (styleJson: Style | string, stay: boolean = false) => {
    if (!stay) {
      //移除上一个
      let currentStyle = this.getStyle();
      if (!currentStyle) return;
      // console.log(currentStyle);
      let { layers, sources: currentSources } = currentStyle;

      //原 sources ids
      let curretnSourceIds = Object.keys(currentSources);
      //找到自定义的图层
      let customLayers = layers.filter((item) => {
        let layer = item as Layer;
        return layer && layer.metadata && layer.metadata.isBaseMap === false;
      });

      if (typeof styleJson === "string") {
        //TODO 矢量瓦片地址 从新解析
        let styleString = styleJson as string;
        const response = await fetch(styleString);
        // const responseJson = await response.json();
        let [error, result] = await awaitHelper(response.json());
        // let [error, result] = await awaitHelper(axios.get(styleString));
        if (error) return;
        styleJson = result as Style;
      }

      //合并到新的style里
      styleJson.sources = Object.assign({}, currentSources, styleJson.sources);
      styleJson.layers = [...styleJson.layers, ...customLayers]; //自定义的图层要放在上面

      // 过滤非必要的sources.从合并后的layers中反向查找对应的sources(待完善)

      // console.log(styleJson);
      this.setStyle(styleJson, { diff: true });

      // //重新加载图片资源
      // this.reloadImages();
    }
  };

  /**
   * 加载底图地图样式
   * @param styleJson
   * @param option
   */
  private addBaseMapStyle = async (styleJson: Style | string, option?: ISCustomOptionEx) => {
    await this.addStyle(styleJson, option);
  };
  /**
   * 加载地图样式
   * @param styleJson
   * @param option
   */
  private addStyle = async (styleJson: Style | string, option?: ISCustomOptionEx) => {
    let opt = {
      ...defaultOptionEx,
      ...option,
    };
    this.initDefaultEmptyLayers();
    if (typeof styleJson === "string") {
      //TODO 矢量瓦片地址 从新解析
      let styleString = styleJson as string;
      let [error, result] = await fetchJson(styleString); //awaitHelper(axios.get(styleString));
      if (error) return;
      styleJson = result as Style;
      let { sprite, sources, layers, terrain } = styleJson;
      if (sprite) await this.addSpriteImages(sprite as string); //记载雪碧图
      let vectorStyle = {
        // version: 8,
        // sources,
        // layers,
        ...styleJson,
      };
      await this.addStyle(vectorStyle, opt);
      // this.setStyle(styleJson as string, {diff: false});
    } else {
      let { sources, layers, terrain } = styleJson as Style;
      //添加数据源
      // @ts-ignore
      Object.keys(sources).forEach((key) => {
        //同名source 不会更新
        if (!this.getStyle() || !this.getSource(key)) {
          this.addSource(key, sources![key]);
        }
      });

      let { metadata } = opt;
      let { isBaseMap } = metadata;
      if (layers)
        //添加图层
        for (const lyr of layers) {
          // console.log(lyr);
          let layerid = lyr.id;
          let layer = {
            metadata,
            ...lyr,
          };
          //@ts-ignore
          // if (layer.metadata) layer.metadata = metadata;
          // let layer = Object.assign(lyr, opt);
          // console.log(layer);

          if (!this.getStyle() || !this.getLayer(layerid)) {
            let firstSpeLayer = this.safeAddBaseMapSplitedLayer();
            if (isBaseMap && firstSpeLayer) {
              this.addLayer(layer, firstSpeLayer.id);
            } else {
              this.addLayer(layer);
            }
          }
        }

      //配置地形
      if (!!terrain) this.setTerrain(terrain);
      else if (this.getTerrain()) this.setTerrain(null);
    }
  };
  /**
   * 移除底图的style，主要是 layers
   *
   * 判定依据：
   * layer对象中，没有metadata字段，是底图；
   * layer对象中，有metadata字段，isBaseMap =undefined 是底图。
   * layer对象中，有metadata字段，且metadata.isBaseMap为ture，是底图。
   * 综上： 有metadata且isBaseMap 明确标记为false 的是 非底图，其他情况都是底图
   */
  private removeBaseStyle = () => {
    //非底图图层中如果有引用了底图的source。如果source删除，那么该非底图图层也将失去source。除非新加入的source中恰好有同名的source
    //解决方法：
    //1.方法1：不处理source。即保留（不删除）原来source。这样，就不用担心非底图的图层失去source的风险。可以达到切换数据源不重渲染图层的效果
    //2.方法2：1.一刀切删除处理source：只要涉及被删除图层的source，都删除。遍历现有图层中引用了该source的layer，包括非底图图层（专题图层），也会被删除。
    //        2.【推荐】仅保留必要的source：在删除source时，判断非底图图层是否有引用，如果有，则保留，反之，没有图层引用就删除。
    //以下代码采用了 第2.1种 方法。

    /**
     * 这里隐藏着一种情况：
     * 如果新加载的source中与原来的source存在同名情况。
     * 举例说明：
     * 在切换Style前，非底图图层A，引用了名为 youmap 的source。按照删除逻辑，此处切换style时将保留youmap 这个source。
     * 此时，如果新的style中存在同为youmap 的source；如果两个新旧的youmap source是同名同内容，则是不用去处理；但如果这两个source只是同名内容不同，
     * 按照此处处理逻辑同名不处理原则，那么这个新的source加不进来，非底图的图层还是引用原来的source，内容上不会刷新改变。这在一些场景比如动态切换数据源改变显示内容场景将不起作用。
     */

    let splitedLayer = this.safeAddBaseMapSplitedLayer(); //限定在分割层之内

    let { layers } = this.getStyle();
    if (layers) {
      let index = layers.findIndex((item) => item.id == splitedLayer?.id);
      //获取所有待删除图层集
      let removedLayers = layers.slice(0, index).filter((anylayer) => {
        let metadata = (anylayer as Layer).metadata as ISCustomMetadata;
        return !metadata || metadata.isBaseMap === undefined || metadata.isBaseMap === true;
      });
      //查找非底图(metadata.isBaseMap==true)图层集
      let stayinLayers = layers.filter((anylayer) => {
        let metadata = (anylayer as Layer).metadata as ISCustomMetadata;
        return metadata && !metadata.isBaseMap;
      });
      //待删除的source
      let readyToRemovedSourceIds = removedLayers.map((anylayer) => {
        //收集被删除layer对应的source
        if (Object.keys(anylayer).includes("source")) {
          let removedSource = (anylayer as Layer).source;
          if (typeof removedSource === "string") {
            return removedSource;
          }
        }
      });
      //待保留的source
      let stayinSourceIds = stayinLayers.map((anylayer) => {
        //收集被删除layer对应的source
        if (Object.keys(anylayer).includes("source")) {
          let stayinSource = (anylayer as Layer).source;
          if (typeof stayinSource === "string") {
            return stayinSource;
          }
        }
      });

      //收集被删除layer对应的source
      //去重，求差
      // let removeSourceIds: string[] = [];
      let removeSourceIds = Array.from(new Set(readyToRemovedSourceIds)).filter((item) => {
        // console.log(Array.from(new Set(stayinSourceIds)).includes(item));
        return !Array.from(new Set(stayinSourceIds)).includes(item);
      });

      //删除图层
      for (const anylayer of removedLayers) {
        //删除图层
        this.removeLayer(anylayer.id);
      }

      //同步删除对应的source
      removeSourceIds.forEach((item) => {
        if (item && this.getSource(item)) this.removeSource(item);
      });

      //之前的代码，暂时保留，等上面的代码测试稳定后可删除
      // let removeSourceIds: string[] = [];
      // for (const anylayer of removedLayers) {
      //   let metadata = (anylayer as Layer).metadata as ISCustomMetadata;
      //   if (!metadata || metadata.isBaseMap === undefined || metadata.isBaseMap === true) {
      //     this.removeLayer(anylayer.id);

      //     //收集被删除layer对应的source
      //     if (Object.keys(anylayer).includes("source")) {
      //       let source = (anylayer as Layer).source;
      //       if (typeof source === "string" && !removeSourceIds.some((item) => item === source)) {
      //         removeSourceIds.push(source);
      //       }
      //     }
      //   }
      // }
      // //同步删除对应的source
      // removeSourceIds.forEach((item) => {
      //   //遍历非底图图层，查找是否有引用该source的图层

      //   if (this.getSource(item)) this.removeSource(item);
      // });
    }
  };
  /**
   * [自定义方法]查找第一个非底图的图层。内置的 BASEMAP_SPLITED_LAYER 图层
   *
   * {layer:{meta:{isBaseMap:false}}}
   */
  getFirstBaseMapSplitedLayerId = (): [string, number] => {
    let [layerid, index] = ["", -1];
    let { layers } = this.getStyle();
    if (layers) {
      let idx = layers.findIndex((layer) => {
        return layer.id === BASEMAP_SPLITED_LAYER;
      });
      [layerid, index] = [idx >= 0 ? BASEMAP_SPLITED_LAYER : "", idx];
    }
    return [layerid, index];
    // for (let layer of layers) {
    //   let baseMapMeta = layer as Layer;
    //   if (!baseMapMeta.metadata || baseMapMeta.metadata.isBaseMap == false) {
    //     return layer.id;
    //   }
    // }
    // return "";
  };

  /**
   * [自定义方法]查找并获取紧挨着当前图层的上一个图层id，
   *
   * 如果是空，则表示当前图层不在map图层内，或者已经是第一个图层。
   * @param layerId 当前图层id
   */
  getLayerIdBefore = (layerId: string): string | undefined => {
    let beforeId: string | undefined = undefined;
    let { layers } = this.getStyle();
    if (layers) {
      let index = layers.findIndex((layer) => {
        return layer.id === layerId;
      });
      if (index > 0 && index < layers.length) beforeId = layers[index - 1].id;
    }
    return beforeId;
  };
  /**
   * [自定义方法]查找并获取紧挨着当前图层的下一个图层id，
   *
   * 如果是空，则表示当前图层不在map图层内，或者已经是最后一个图层。
   * @param layerId 当前图层id
   */
  getLayerIdAfter = (layerId: string): string | undefined => {
    let afterId: string | undefined = undefined;
    let { layers } = this.getStyle();
    if (layers) {
      let index = layers.findIndex((layer) => {
        return layer.id === layerId;
      });
      if (index >= 0 && index < layers.length - 1) afterId = layers[index + 1].id;
    }
    return afterId;
  };

  /**
   * [自定义方法]添加一个空图层，仅用做占位。空图层为 background 类型，
   * @param layerId
   * @returns
   */
  addEmptyLayer = (layerId: string, beforeId?: string | undefined): AnyLayer | null => {
    if (!this.getStyle()) return null;
    let { layers } = this.getStyle();
    if (!layers || !this.getLayer(layerId)) {
      this.addLayer(
        {
          id: layerId,
          type: "background",
          layout: {
            visibility: "none",
          },
          ...layerGroupOptionEx,
        },
        beforeId
      );
    }
    return this.getLayer(layerId);
  };

  /**
   * 添加底图分割图层
   * @returns
   */
  private safeAddBaseMapSplitedLayer = (): AnyLayer | null => {
    return this.addEmptyLayer(BASEMAP_SPLITED_LAYER);
  };

  /**
   *   加载雪碧图
   *   Jin 2023.1.6
   *   */
  addSpriteImages = async (spritePath: string) => {
    // console.log(spritePath);
    let [error, spriteJson] = await fetchJson(`${spritePath}.json`); //(await axios.get(`${spritePath}.json`)).data;
    let img = new Image();
    img.onload = () => {
      // console.log("雪碧图")
      Object.keys(spriteJson).forEach((key: string) => {
        let spriteItem = spriteJson[key];
        let { x, y, width, height } = spriteItem;
        let canvas = this.createCanvas(width, height);
        let context = canvas.getContext("2d");
        context!.drawImage(img, x, y, width, height, 0, 0, width, height);
        // 单位雪碧图项，转base64字符串
        let base64Url = canvas.toDataURL("image/png");
        this.loadImage(base64Url, (error, simg: any) => {
          if (!this.hasImage(key)) {
            // console.log(key);

            this.addImage(key, simg);
          }
        });
      });
    };
    img.crossOrigin = "anonymous";
    img.src = `${spritePath}.png`;
  };
  /**
   * [自定义扩展] 扩展 addSource方法，加入判断，简化addsource之前的 this.getSource(id) 是否存在的判断
   * @param id
   * @param source
   * @param bOverwrite 是否覆盖，如果是，将移除已存在的，再添加。反之，同名的source不做处理
   * @returns
   */
  addSourceEx = (id: string, source: AnySourceData, bOverwrite: boolean = false) => {
    if (this.getSource(id) && bOverwrite) {
      this.removeSource(id);
    }
    if (!this.getSource(id)) this.addSource(id, source);

    return this;
  };

  /**
   * 设置自定义鼠标样式。 如果是自定义鼠标样式，名称要避开内置默认的鼠标样式名称
   * 建议使用大小为32x32 的png
   *
   * 不支持带别名的路径 如 @assets/image/curor.png
   * @param cursor 鼠标地址。可以用默认的鼠标样式名称
   */
  setMapCursor = (cursor: string, offset: [number, number] = [0, 0]) => {
    //
    let defaultCursors = [
      "auto",
      "crosshair",
      "default",
      "hand",
      "move",
      "help",
      "wait",
      "text",
      "w-resize",
      "s-resize",
      "n-resize",
      "e-resize",
      "ne-resize",
      "sw-resize",
      "se-resize",
      "nw-resize",
      "pointer",
    ];
    if (!cursor) this.getCanvas().style.cursor = "";
    else if (defaultCursors.includes(cursor)) this.getCanvas().style.cursor = cursor;
    else this.getCanvas().style.cursor = `url(${cursor}) ${offset[0]} ${offset[1]}, auto`;
  };
  /**
   *   绘制canvas
   *   Jin 2023.1.6
   *   */
  private createCanvas = (width: number, height: number) => {
    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  };

  //#endregion
}

const awaitHelper = async <T = any>(promise: Promise<T>) => {
  try {
    const result = await promise;
    return [null, result] as const;
  } catch (error) {
    return [error, null] as const;
  }
};

const fetchJson = async (url: string) => {
  const response = await fetch(url);
  return await awaitHelper(response.json());
};
//=============以上是地图map的操作逻辑=====================

// #region  地图操作辅助 处理逻辑
//=====================================================

// 经过格式化处理的地图配置
let _mapConfig: Partial<ISMapConfig> = {
  current: "default",
  token: {
    tdtsxVector: "abc",
    tdt: "48ad25d128061c24f00559d481310004",
  },
  baseMaps: ["default", "blue"],
};

//用于标识是否通过createMap 创建的地图对象
let bCreateMap = false;
let _map: Map;
let currentBaseMapId = ref("" as string);

function _createMap(options?: MapboxOptions): Map {
  _map = new Map(options);
  return _map;
  // return new Map(options);
}
/**
 * 提供一个创建map对象的一个方法,这是统一入口，需通过此方法创建地图对象
 * @param mapid mapcontainer 的div 元素id
 * @param mapConfig 自定义地图配置。如果为空，则使用内置的地图配置
 * @param basemapId 传入指定的basemapid，该值应与mapconfig中的配置一致
 * @returns map 对象
 */
export function createMap(mapid: string, mapConfig?: ISMapConfig, basemapId?: string): Map {
  //对mapconfig进行组织，转换成完整的结构（转换成对象）
  let config = mapConfig ? { ...defaultMapConfig, ...mapConfig } : defaultMapConfig;
  // console.log(config);

  //解析并保存mapconfig
  _mapConfig = normalizeMapConfig(config as ISMapConfig);

  // console.log(_mapConfig);
  let { view, current, baseMaps, token } = _mapConfig;
  //1.没有配置basemaps，则加载current 默认地图
  if (!baseMaps) {
    // 获取默认的内置配置
    let currentBasemap = getInnerBasemapItem(current!);
    if (typeof currentBasemap === "string") throw new Error("加载初始地图失败!原因：当前配置的默认加载地图错误或不存在");
    let style = parseBasemItemToStyle(currentBasemap);
    bCreateMap = true;
    currentBaseMapId.value = current!;
    return _createMap({
      container: mapid,
      ...view,
      style,
    });
  }
  //2. 使用配置文件
  //如果外部传入初始加载的basemap的id，则使用
  if (basemapId) current = basemapId;
  //查找默认加载地图,此处的basemap 转换成对象
  let initBaseMap = baseMaps!.find((item: unknown) => {
    if (typeof item === "string") return item === current;
    else return (item as ISBaseMap).id === current;
  });

  if (!initBaseMap) {
    throw new Error(`加载初始地图失败!原因：在当前配置的配置中，未找到名为 ${current} 的配置`);
  }
  let style = parseBasemItemToStyle(initBaseMap as ISBaseMap);
  bCreateMap = true;
  currentBaseMapId.value = (initBaseMap as ISBaseMap).id;
  return _createMap({
    container: mapid,
    ...view,
    style,
  });
}

// TODO: 优化
/**
 * 【很重要，代码要加强】解析 IBaseMap 到 Style | string，
 * @param data
 * @returns
 */
const parseBasemItemToStyle = (vrBasemap: ISBaseMap): string | Style | undefined => {
  if (vrBasemap.type === "vector") {
    let vectorBaseMap = vrBasemap as ISVectorTileBaseMap;
    return parseVectorBasemapToStyle(vectorBaseMap);
  } else if (vrBasemap.type === "raster") {
    let rasterBaseMap: ISRasterBaseMap = vrBasemap as ISRasterBaseMap;
    return parseRasterBasemapToStyle(rasterBaseMap);
  }
  return "";
};
/**
 * 对ISBaseItm的style进行构建，组织真实的矢量瓦片的style
 * @param data
 * @returns
 */
const parseVectorBasemapToStyle = (vectorBaseMap: ISVectorTileBaseMap): string | Style | undefined => {
  let vectorStyle = vectorBaseMap.style;
  //这里根据style的值去检索和检查，
  if (!vectorStyle) {
    //如果style为空，则改为用id去转成内置的style对象
    //后期可以改成baseMap.id,强化id的作用
    let innerBasemap = getInnerVectorBasemapItem(vectorBaseMap.id);
    vectorStyle = innerBasemap ? (innerBasemap as ISVectorTileBaseMap).style : vectorStyle;
  }
  //判断是否以http:// 或 https:// 开头
  if (typeof vectorStyle === "string") {
    let reg = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    // console.log(vectorStyle);

    if (reg.test(vectorStyle)) {
      // console.log("http 或 https 开头");
      return vectorStyle;
    } else {
      //TODO:处理 相对路径。此处暂无处理，后续完善
      return vectorStyle;
    }
  }
  return vectorStyle;
};
/**
 * 构建栅格地图的style
 * @param basemap
 * @returns
 */
const parseRasterBasemapToStyle = (basemap: ISRasterBaseMap): Style | undefined => {
  let rasterBaseMap: ISRasterBaseMap = basemap as ISRasterBaseMap;
  let rasterStyle = rasterBaseMap.style;
  if (!rasterStyle) rasterBaseMap = getInnerRasterBasemapItem(rasterBaseMap.id as string);
  if (!rasterBaseMap) return rasterStyle;
  let { style, subLayers } = rasterBaseMap;
  //设定默认值
  subLayers = subLayers ?? ([] as ISLayer[]);
  let { layers } = style!;
  style!.layers = [...layers, ...subLayers] as AnyLayer[]; // 图层合并
  return {
    ...style,
    version: 8,
  } as Style;
};

/**
 * 重构地图配置mapConfig，主要过滤转换一些带有默认地图名称的地图服务转换成真实的地图地址，比如矢量瓦片的名称 default，将处理转换成真实的地址
 * @param mapConfig
 * @returns
 */
const normalizeMapConfig = (mapConfig: ISMapConfig): ISMapConfig => {
  let { baseMaps, token } = mapConfig;
  //必须先给token，以便响应获取到真实的地址
  setTokens(token); //保存到默认底图的配置文件中
  _mapConfig.token = token ? { ...defaultMapConfig.token, ...token } : defaultMapConfig.token;
  if (baseMaps) {
    mapConfig.baseMaps = baseMaps.map((basemap: any) => {
      if (typeof basemap === "string") {
        // 只有名字，则默认他是使用了内置地图
        return getInnerBasemapItem(basemap as string);
      } else {
        // let vrBasemap = basemap as ISBaseMap;
        // if (vrBasemap.type === "vector") {
        //   let vectorBaseMap = vrBasemap as ISVectorTileBaseMap;
        //   //判断 style 是否有值,梅有值则使用id进行处理
        //   let style = parseVectorBasemapToStyle(vectorBaseMap); //vectorBaseMap.style ? _getBasemapVectorStyle(vectorBaseMap.style) : _getBasemapVectorStyle(vectorBaseMap.id);
        //   return {
        //     ...vectorBaseMap,
        //     style,
        //   };
        // } else if (vrBasemap.type === "raster") {
        //   let rasterBaseMap = vrBasemap as ISRasterBaseMap;
        //   return rasterBaseMap;
        // } else return basemap;

        return {
          ...basemap,
          style: parseBasemItemToStyle(basemap as ISBaseMap),
        };
      }
    });
  }

  return mapConfig;
};
/**
 * [被抛弃。已被normalizeMapConfig 替换]重构地图配置mapConfig，主要过滤转换一些带有默认地图名称的地图服务转换成真实的地图地址，比如矢量瓦片的名称 default，将处理转换成真实的地址
 * @param mapConfig
 * @returns
 */
const resolveMapConfig = (mapConfig: ISMapConfig): ISMapConfig => {
  let { baseMaps, token } = mapConfig;
  //必须先给token，以便响应获取到真实的地址
  setTokens(token); //保存到默认底图的配置文件中
  _mapConfig.token = token ? { ...defaultMapConfig.token, ...token } : defaultMapConfig.token;
  if (baseMaps) {
    mapConfig.baseMaps = baseMaps.map((basemap: any) => {
      if (typeof basemap === "string") {
        // 只有名字，则默认他是使用了内置地图
        return getInnerBasemapItem(basemap as string);
      } else {
        // let vrBasemap = basemap as ISBaseMap;
        // if (vrBasemap.type === "vector") {
        //   let vectorBaseMap = vrBasemap as ISVectorTileBaseMap;
        //   //判断 style 是否有值,梅有值则使用id进行处理
        //   let style = parseVectorBasemapToStyle(vectorBaseMap); //vectorBaseMap.style ? _getBasemapVectorStyle(vectorBaseMap.style) : _getBasemapVectorStyle(vectorBaseMap.id);
        //   return {
        //     ...vectorBaseMap,
        //     style,
        //   };
        // } else if (vrBasemap.type === "raster") {
        //   let rasterBaseMap = vrBasemap as ISRasterBaseMap;
        //   return rasterBaseMap;
        // } else return basemap;

        return {
          ...basemap,
          style: parseBasemItemToStyle(basemap as ISBaseMap),
        };
      }
    });
  }

  return mapConfig;
};
/**
 * 根据id查找并获取到地图配置项,前提是使用createMap创建过地图.
 *
 * @param id 出入底图id,优先从配置文件中找。如果id 是内置底图的id，将先从配置文件中找，找不到再从内置底图中找
 * @returns
 */
export const findBaseMapItem = (id: string): ISBaseMap => {
  //先从 mapconfig中找
  let hitBasemap = _mapConfig.baseMaps
    ?.filter((basemap: any) => basemap && typeof basemap != "string")
    .find((item: any) => {
      return (item as ISBaseMap).id === id;
    });
  // 在自定义配置中没有找到，则找默认的配置
  return (hitBasemap as ISBaseMap) ?? getInnerBasemapItem(id);
};
/**
 * 地图切换
 * @param baseMapItem
 * @returns
 */
export const switchBaseMap = (baseMapItem: AnyBasemapStyle | ISBaseMap | string) => {
  if (!bCreateMap) throw new Error("未使用createMap创建地图对象，不能使用switchMap");
  if (!_map) throw new Error("map尚未创建，请先使用createMap创建");

  let previousId = currentBaseMapId.value;
  let currentId = "";

  if (!baseMapItem) return { previousId, currentId };

  // console.log(_map.getStyle().layers);
  if (typeof baseMapItem === "string") {
    //如果是string，则判读为内置底图id，根据id获取内置真实的配置
    baseMapItem = findBaseMapItem(baseMapItem as string);
  }

  if (!baseMapItem || currentBaseMapId.value === baseMapItem.id) return { previousId, currentId: currentBaseMapId.value };
  // console.log(_lastBaseMapId);
  // console.log(baseMapItem.id);

  currentId = baseMapItem.id;
  currentBaseMapId.value = baseMapItem.id;
  _map.changeBaseMap(baseMapItem);

  return {
    previousId,
    currentId,
  };
};
/**
 * 返回输出内部的一些地图控制状态，返回值具有响应式
 * @returns
 */
export const useBaseMapState = () => {
  return {
    currentBaseMapId,
  };
};
// #endregion
