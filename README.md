# Slider

此插件依赖 [zepto.js](http://zeptojs.com/)

## Options

`index` {Number} 初始索引位置，默认： `0`

`duration` {Number} 动画过渡时间， 默认：`600ms`

`autoplay` {Boolean} 是否自动滑动，默认：`false`

`interval` {Number} 自动滑动间隔时间，默认：`3000ms`

`lazyload` {Boolean} 是否开启延迟加载，`此功能暂无`

## Methods
### destroy  
销毁当前实例  
```js
$('#slider').slider('option', 'destroy');
```
### slideTo  
设置slider的索引值  
```js
$('#slider').slider('option', 'slideTo', 1);
```
### getIndex  
获取slider当前的索引值  
```js
$('#slider').slider('option', 'getIndex');
```
### refresh  
刷新整个slider  
```js
$('#slider').slider('option', 'refresh');
```

## Examples

```html
<div id="slider">
    <div class="slider-item">
        <img src="1.jpg" alt="" />
    </div>
    <div class="slider-item">
        <img src="2.jpg" alt="" />
    </div>
    <div class="slider-item">
        <img src="3.jpg" alt="" />
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
.slider-item > img {
    max-width: 100%;
}
```
```js
(function($){
    $(function(){
        $('#slider').slider();
    });
})(Zepto);

```

## License

MIT
