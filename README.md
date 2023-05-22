## mapboxgl 地图扩展(适用于天地图陕西的 mapbox-gl api)

## 技术栈

- vue3+typescript

## 引入地图开发包

### 1、地图开发包资源

陕西省地理信息公共服务平台提供了专门的地图 API 包进行访问地图服务。地图 API 包提供了 CGCS2000 和 web 墨卡托两种地图坐标系的 api，用户可根据需要选择调用不同坐标系的地图并选择相应的 API。

- [js 文件（cgcs2000）](https://shaanxi.tianditu.gov.cn/vectormap/YouMapServer/JavaScriptLib/mapbox-gl-cgcs2000.js)
- [js 文件（web 墨卡托）](https://shaanxi.tianditu.gov.cn/vectormap/YouMapServer/JavaScriptLib/mapbox-gl.js)
- [css 文件](https://shaanxi.tianditu.gov.cn/vectormap/YouMapServer/JavaScriptLib/mapbox-gl.css)

> 地图 API 包基于 mapboxgl 基础上扩展封装而成，功能上与原生的 mapboxgl 没有差别。详细使用请参阅[mapbox-gl 开发帮助文档](https://docs.mapbox.com/mapbox-gl-js/api/)

### 2、引入方式

#### 方法一:在线引用

打开 index.html， 文件内直接引入以上提供的 js、css 地址

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + Vue</title>
    <script src="https://shaanxi.tianditu.gov.cn/vectormap/YouMapServer/JavaScriptLib/mapbox-gl-cgcs2000.js"></script>
    <link rel="stylesheet" href="https://shaanxi.tianditu.gov.cn/vectormap/YouMapServer/JavaScriptLib/mapbox-gl.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

#### 方法二:下载离线引入

1.在 vite 项目中， 将 mapbox-gl-cgcs2000.js、mapbox-gl.css 两个文件包放置在根目录下的 public 文件(
项目中没有，自己创建）下。比如 public/libs/mapbox-gl 文件夹下 2.引入到 index.html 中，同上

```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vite + Vue + TS</title>
  <script src="/libs/mapbox-gl/mapbox-gl-cgcs2000.js"></script>
  <link rel="stylesheet" href="/libs/mapbox-gl/mapbox-gl.css" />
</head>
```

### 3、使用地图对象

在 vue 代码中需要使用的地方使用 widow 解构，比如：

```javascript
//获得 mapboxgl
const { mapboxgl } = window; //结构获得mapboxgl
mapboxgl.accessToken = "你自己申请的key";
//初始化创建map对象
const map = new mapboxgl.Map(option);
```

以上代码为举例。

## 如何使用

### 安装引入

```
npm install sxgis-mapboxgl-mapex
```

```
import { Map, createMap, ISMapConfig } from "sxgis-mapboxgl-mapex";

const { mapboxgl } = window;
mapboxgl.accessToken = "申请token";

//使用createMap初始化map对象
const map = createMap(mapid,mapconfig,basemapId);
map.on("load",()=>{
  //do something
})
```

> 注意：要调用 createMap 方法来初始化 Map 对象！！！！

### 扩展内容

#### 1.底图与非底图分组

map 对象将底图和非底图进行分组。初始化 map 对象时，内部默认加入一个空图层进行标识分组，划分底图区域和非底图区域。同时，重新 addLayer 方法，对每个新加入的图层默认并强制加入 metadata 属性，用于标识图层的类型；

```
// layer
{
  ...,
  metadata:
  {
    isBaseMap:boolean
  }
}
```

#### 2.重新 addLayer

- 1. 新加入图层强制加入{metadata:{isBaseMap:boolean}} 扩展属性，默认加入 {metadata:{isBaseMap:false}}
- 2. 图层分组。划分不同类型的图层区域--点、线、面，点层最上，线层中间，面层最下。通过传入参数来启动是否使用图层分组功能。

```
 /**
     * 重写 addLayer，对新加入的图层强制加入 {metadata:{isBaseMap:boolean}} 扩展属性，默认加入 {metadata:{isBaseMap:false}}
     * @param layer
     * @param before 插入到此图层id之前。
     *
     * 特别说明：当传入的参数为boolean并且为true时，将干预新加入图层的顺序。
     *
     *
     * 便于图层的分组管理，本程序设计了一种默认的地图分组规则。地图map对象在初始化后会默认生成三个分别是点、线、面的分组，点层最上，面层最下。
     * 当有新图层加入时，如果传入的参数为boolean且未true，将使用默认分组规则干预新图层的顺序，使得点层永远在上，面层永远处于点、线层之下：
     * 反之，按正常的顺序添加图层，不干预；
     * @returns
     */
    addLayer(layer: AnyLayer, before?: string | boolean | undefined): this;
```

> map 对象扩展的内容参见接口

```
export declare class Map extends mapboxgl.Map {
    constructor(options?: MapboxOptions);
    /**
     * 初始化一些默认的空图层
     * @returns
     */
    initDefaultEmptyLayers(): void;
    /**
     * 判断指定图层id的图层是否存在
     * @param id
     * @returns true or false
     */
    isLayer(id: string): boolean;
    /**
     * 重写 addLayer，对新加入的图层强制加入 {metadata:{isBaseMap:boolean}} 扩展属性，默认加入 {metadata:{isBaseMap:false}}
     * @param layer
     * @param before 插入到此图层id之前。
     *
     * 特别说明：当传入的参数为boolean并且为true时，将干预新加入图层的顺序。
     *
     *
     * 便于图层的分组管理，本程序设计了一种默认的地图分组规则。地图map对象在初始化后会默认生成三个分别是点、线、面的分组，点层最上，面层最下。
     * 当有新图层加入时，如果传入的参数为boolean且未true，将使用默认分组规则干预新图层的顺序，使得点层永远在上，面层永远处于点、线层之下：
     * 反之，按正常的顺序添加图层，不干预；
     * @returns
     */
    addLayer(layer: AnyLayer, before?: string | boolean | undefined): this;
    refreshBaseLayers(): void;
    /**
     * [自定义方法]清空除了底图、分割图层等内置图层之外的所有临时（专题）图层
     */
    removeOtherLayers(): void;

    /**
     * 切换底图
     * @param baseMapItem 传入底图item，可以是内置地图的id（如default，black，blue，gray），也可以是自定义的ISBaseMap对象。
     */
    changeBaseMap: (baseMapItem: AnyBasemapStyle | ISBaseMap) => void;

    /**
     * [自定义方法]查找第一个非底图的图层。内置的 BASEMAP_SPLITED_LAYER 图层
     *
     * {layer:{meta:{isBaseMap:false}}}
     */
    getFirstBaseMapSplitedLayerId: () => [string, number];
    /**
     * [自定义方法]查找并获取紧挨着当前图层的上一个图层id，
     *
     * 如果是空，则表示当前图层不在map图层内，或者已经是第一个图层。
     * @param layerId 当前图层id
     */
    getLayerIdBefore: (layerId: string) => string | undefined;
    /**
     * [自定义方法]查找并获取紧挨着当前图层的下一个图层id，
     *
     * 如果是空，则表示当前图层不在map图层内，或者已经是最后一个图层。
     * @param layerId 当前图层id
     */
    getLayerIdAfter: (layerId: string) => string | undefined;
    /**
     * [自定义方法]添加一个空图层，仅用做占位。空图层为 background 类型，
     * @param layerId
     * @returns
     */
    addEmptyLayer: (layerId: string, beforeId?: string | undefined) => AnyLayer | null;

    /**
     *   加载雪碧图
     *   Jin 2023.1.6
     *   */
    addSpriteImages: (spritePath: string) => Promise<void>;
    /**
     * [自定义扩展] 扩展 addSource方法，加入判断，简化addsource之前的 this.getSource(id) 是否存在的判断
     * @param id
     * @param source
     * @param bOverwrite 是否覆盖，如果是，将移除已存在的，再添加。反之，同名的source不做处理
     * @returns
     */
    addSourceEx: (id: string, source: AnySourceData, bOverwrite?: boolean) => this;
    /**
     * 设置自定义鼠标样式。 如果是自定义鼠标样式，名称要避开内置默认的鼠标样式名称
     * 建议使用大小为32x32 的png
     *
     * 不支持带别名的路径 如 @assets/image/curor.png
     * @param cursor 鼠标地址。可以用默认的鼠标样式名称
     */
    setMapCursor: (cursor: string, offset?: [number, number]) => void;
}
```

## 默认地图的 Id

程序内置了一部分常用的地图配置，使用地图 id 来进行标识。

### 矢量瓦片服务

- default
- gray
- black
- blue

### 影像服务

- tianditu_img_c //天地图 影像服务（cgcs2000)
- tianditu_img_c_group //天地图影像服务组(cgcs2000), tianditu_img_c（天地图 影像服务）和 tianditu_cia_c（天地图影像注记）的组合
- tianditu_vec_c_group //天地图的综合地图服务组(cgcs2000), tianditu_vec_c（天地图 影像服务）和 tianditu_cva_c（天地图影像注记）的组合
- tianditu_sx_img //天地图陕西 影像服务（cgcs2000）
- tianditu_sx_img_label //天地图陕西影像注记 （cgcs2000）
- tianditu_sx_img_group //天地图陕西影像地图服务组(cgcs2000), tianditu_sx_img（天地图陕西 影像服务）和 tianditu_sx_img_label（天地图陕西影像注记）的组合
- 待续...

### 关于 token

```
{
  default: "", //天地图陕西矢量瓦片服务的token，也可适用于蓝色（blue）、暗黑版（black）、灰色版（gray）等矢量瓦片服务
  tianditu: "", // 天地图 地图服务的token
  sx_img: "", // 天地图陕西 影像服务的token
  sx_img_label: "" // 天地图陕西 影像注记服务的token
 }
```

## 地图配置文件

### 简单的配置

```
{
  view: {
    center: [108.653, 35.2],
    zoom: 6,
    minZoom: 5,
    maxZoom: 17.5,
    dragRotate: true,
  },
  current: "black", //指定默认初始加载的地图，要和baseMaps中的id对应起来
  token: {
    default: "",
    tianditu: "", //天地图 地图 toekn
    sx_img: "", // 天地图陕西 影像服务的token
    sx_img_label: "" // 天地图陕西 影像注记服务的token
  },
  baseMaps: ["default", "blue", "black","gray","tianditu_img_c","tianditu_sx_img_group",...],
}
```

baseMaps 也可展开详细记录，比如:

```
//如果不指定style
{
  ....
  baseMaps:[
    {
      id:"default", // id,标识地图。
      name:"地图", // 显示的名称
      icon: "/img/basemap/stand.png", //显示的图标，可以配置使用自定义的地图切换组件以显示组件的图标
      type:"vector",
    }
  ]
}
```

### basemap 配置说明

basemap 的配置相对比较灵活，有以下几种情况：

#### 1.使用默认地图 id 配置

使用默认地图的 id 即可，如

```
baseMaps:["default", "blue", "black","gray","tianditu_img_c","tianditu_sx_img_group",...]
```

> 注意：使用此方法配置是使用了默认的地图地址配置，免去了自己写完整的地址，所以在使用前需要传入 token 配置。比较完整的使用方法如下：

```
{
  ...
 token: {
    default: "",
    tianditu: "", //天地图 地图 toekn
    sx_img: "", // 天地图陕西 影像服务的token
    sx_img_label: "" // 天地图陕西 影像注记服务的token
  },
  baseMaps: ["default", "blue", "black","gray","tianditu_img_c","tianditu_sx_img_group",...],
}
```

#### 2. 使用对象配置

使用此方法可以对 basemap 进行更进一步的配置

```
{
  ....
  baseMaps:[
    {
      id:"default", // id,标识地图。
      name:"地图", // 显示的名称
      icon: "/img/basemap/stand.png", //显示的图标，可以配置使用自定义的地图切换组件以显示组件的图标
      type:"vector",
      style:{} // 地图具体配置
    }，
    {
      id:"tianditu_img_c", // id,标识地图。
      name:"影像地图", // 显示的名称
      icon: "/img/basemap/img.png", //显示的图标，可以配置使用自定义的地图切换组件以显示组件的图标
      type:"raster",
      style:{} // 地图具体配置
    }，
  ]
}
```

- id : [必填]记录 地图的 id，是地图的唯一标识，
- name，icon ：[选填]记录地图的基本信息，可用于开发自定义组件时显示在组件上的名称、图标
- type: [必填]地图类型，仅支持 vector 和 raster 两种
- style: [选填]地图配置，基于 mapboxgl.style 扩展

分两种情况：

- 使用默认地图 id。

> 当不指定 style（style 配置为 null）,将根据 id 优先寻找默认地图中的地图。如果没有找到，则判断无效地图

- 自定义的配置

> 当指定了 style(style 配置不为 null)，则 id 是本地图配置的地图 id。即便使用了默认地图的 id，也与默认地图 id 无关（可以理解为自定义的地图 id 和默认地图 id 仅同名而已）。如果地图加载无效也不会使用默认地图 id 来进行替换。

比如：

```
{
  ...
  "current": "222",
  "baseMaps": [
    {
      "id": "111",
      "name": "矢量",
      "icon": "/img/basemap/stand.png",
      "type": "vector",
      "style": "https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/sxww2022Geo/自定义token/VectorTileServer/styles/default.json"
    },
    {
      "id": "222",
      "name": "蓝色",
      "icon": "/img/basemap/blue.png",
      "type": "vector",
      "style": "https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/sxww2022Geo/自定义token/VectorTileServer/styles/blue.json"
    },
    {
      "id": "tdtsximg",
      "name": "影像",
      "type": "raster",
      "icon": "/img/basemap/image.png",
      "style": {
        "sources": {
          "tdtsximg": {
            "type": "raster",
            "tiles": ["https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/SxImgMap/自定义token/TileServer/tile/{z}/{y}/{x}"],
            "tileSize": 256
          },
          "tdtsximglabel": {
            "type": "raster",
            "tiles": ["https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/SxImgLabelMap/自定义token/TileServer/tile/{z}/{y}/{x}"],
            "tileSize": 256
          }
        },
        "layers": [
          {
            "id": "tdtsximg-layer",
            "name": "影像底图",
            "type": "raster",
            "source": "tdtsximg",
            "metadata": {
              "isBaseMap": true
            },
            "layout": {
              "visibility": "visible"
            }
          }
        ],
        "vesrion": 8
      }

    }
  ]
}

```

#### style 扩展说明

baseMap.style 是基于 mapboxgl.style 扩展而成，在此基础上扩展了 subLayers 属性，用于分离图层。 虽然是在配置上进行了分离，实际在记载地图时是合并在一起。此处的设计仅是为了能够在实际使用过程中更好地去区分一个地图组中底图图层和非底图图层的控制（比如加载影像地图时，在界面组件上能够分布控制不同的地图图层）

```
 {
      "id": "tdtsximg",
      "name": "影像",
      "type": "raster",
      "icon": "/img/basemap/image.png",
      "style": {
        "sources": {
          "tdtsximg": {
            "type": "raster",
            "tiles": ["https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/SxImgMap/自定义token/TileServer/tile/{z}/{y}/{x}"],
            "tileSize": 256
          },
          "tdtsximglabel": {
            "type": "raster",
            "tiles": ["https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/SxImgLabelMap/自定义token/TileServer/tile/{z}/{y}/{x}"],
            "tileSize": 256
          }
        },
        "layers": [
          {
            "id": "tdtsximg-layer",
            "name": "影像底图",
            "type": "raster",
            "source": "tdtsximg",
            "metadata": {
              "isBaseMap": true
            },
            "layout": {
              "visibility": "visible"
            }
          }
        ],
        "vesrion": 8
      },
      "subLayers": [
        {
          "id": "tdtsximglabel-layer",
          "name": "地名",
          "type": "raster",
          "source": "tdtsximglabel",
          "metadata": {
            "isBaseMap": true
          },
          "layout": {
            "visibility": "none"
          }
        }
      ]
    }
```

Map 增强
