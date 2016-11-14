# Slider

此插件依赖 [zepto.js](http://zeptojs.com/)

> 开启延迟加载建议设置src属性为小图片，推荐使用base64，避免发起HTTP请求

## Options

`index` {Number} 初始索引位置，默认： `0`

`duration` {Number} 动画过渡时间， 默认：`400ms`

`easing` {Number} 动画过渡效果的速度曲线，默认：`ease`

`autoplay` {Boolean} 是否自动滑动，默认：`false`

`interval` {Number} 自动滑动间隔时间，默认：`3000ms`

`lazyload` {Boolean} 是否开启延迟加载，默认：`false`

`attribute` {String} 设置图像真实的url存储在哪个属性中，当开启延迟加载时有效，默认：`data-url`

`vertical` {Boolean} 是否启用垂直方向滑动，默认：`false`

`loop` {Boolean} 是否启用无限循环滚动，默认：`true`

## Methods

### destroy  
销毁当前实例  

```js
$('#carousel').carousel('option', 'destroy');
```

### slideTo  
滑动到指定的的索引值  

```js
$('#carousel').carousel('option', 'slideTo', 1);
```

### getItems
获取轮播图中的子元素

```js
$('#carousel').carousel('option', 'getItems');
```

### refresh  
刷新轮播图，主要更新轮播图中的子元素大小

```js
$('#carousel').carousel('option', 'refresh');
```

## Examples

```html
<div id="carousel">
  <div class="carousel-item">
    <img src="1.jpg" alt="1.jpg">
  </div>
  <div class="carousel-item">
    <img src="2.jpg" alt="2.jpg">
  </div>
  <div class="carousel-item">
    <img src="3.jpg" alt="3.jpg">
  </div>
</div>
```

```css
body {
  margin: 0;
}
.container {
  position: relative;
  width: 100%;
  overflow: hidden;
  height: 12.5rem;
}
.carousel-item > img {
  max-width: 100%;
}
```

```js
(function($){
  $('#carousel').carousel();
})(Zepto);
```

## License

MIT
