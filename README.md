## mapboxgl 地图增强对象(适用于天地图陕西的 mapbox-gl api)

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
