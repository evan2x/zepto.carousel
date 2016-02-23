/**
* @desc  slider插件
* @author evan(evan2zaw@gmail.com)
* @version 0.1.1
* @license MIT
*/

/* global Zepto */

(function( $, win ){
  'use strict';

  var VERSION = '0.1.1',
    nsid = 0,
    $win = $(win),
    cssPrefix = $.fx.cssPrefix,
    transitionEnd = $.fx.transitionEnd,
    _slice = Array.prototype.slice;

  function Slider( $el, options ){
    options = options || {};

    this.options = {
      lazyload: options.lazyload || false,
      attribute: options.attribute || 'data-src',
      autoplay: options.autoplay || false,
      interval: options.interval || 3000,
      index: options.index || 0,
      duration: options.duration || 400,
      easing: options.easing || 'ease',
      vertical: options.vertical || false
    };

    this.$el = $el;
    this.index = this.options.index;
    this.items = $el.children();
    this.eventName = 'onorientationchange' in win ? 'orientationchange' : 'resize' + '.slider' + (nsid++);

    this._init();
  }

  Slider.prototype = {
    constructor: Slider,
    /**
     * 初始化
     * @private
     */
    _init: function(){
      this.container = document.createElement('div');
      this.container.className = 'slider-container';
      this.items.wrapAll(this.container);
      this.position = {x: 0, y: 0};

      if(this.items.length < 2){
          this._loadImage();
      } else {
        this.$el.on('touchstart', this._handler.start.bind(this));
        $win.on(this.eventName, this.refresh.bind(this));

        if (this.options.autoplay) {
          this._play();
        }
      }

      this.refresh();
    },
    /**
     * 事件句柄集合
     * @private
     * @type {Object}
     */
    _handler: {
      start: function(e){
        if(e.touches.length > 1) return false;
        var touch = e.touches[0],
          handler = this._handler;

        this._stop();
        this.start = {
          x: touch.pageX,
          y: touch.pageY,
          time: Date.now()
        };

        this.offset = {x: 0, y: 0};
        this.changed = false;

        this.$el.on({
          touchmove: handler.move.bind(this),
          touchend: handler.end.bind(this),
          touchcancel: handler.end.bind(this)
        });

        this.$el.trigger('dragstart', {
          index: this.getIndex(),
          items: this.items
        });
      },

      move: function(e){
        if(e.touches.length > 1) return false;
        var touch = e.touches[0],
          start = this.start,
          offset = this.offset,
          position = this.position,
          prev = this.prev,
          // 检测手指是否向右移动
          rightMoved = this.options.vertical ? touch.pageY > start.y : touch.pageX > start.x;

        offset.x = touch.pageX - start.x;
        offset.y = touch.pageY - start.y;

        if (this.prevRightMoved !== rightMoved || !this.dragging) {
          var dir = this._direction();
          this._updateItemPos(this.index + dir);

          var idx = this.getIndex();
          this.$el.trigger('drag', {
            dir: dir,
            index: idx,
            items: this.items
          });
        }

        if (!this.dragging) {
          this.dragging = true;
        }

        this._translate({
          x: position.x + offset.x,
          y: position.y + offset.y
        });

        this.prevRightMoved = rightMoved;
        e.preventDefault();
      },

      end: function(e){
        this.$el.off('touchmove touchend touchcancel');

        var changed = false,
          offset = this.offset,
          absMoveX = Math.abs(offset.x),
          absMoveY = Math.abs(offset.y),
          slideTime = Date.now() - this.start.time,
          dir = 0,
          vertical = this.options.vertical;

        if (slideTime < 200) {
          changed = vertical ? absMoveY > 30 : absMoveX > 30;
        } else {
          changed = !!Math.round(vertical ? absMoveY / this.height : absMoveX / this.width);
        }

        if (changed) {
          dir = this._direction();
          this.index += dir;
        }

        var idx = this.getIndex();
        this.$el.trigger('dragend', {
          dir: dir,
          index: idx,
          items: this.items
        });

        this._toIndex(this.index);
        this.dragging = false;
      }
    },
    /**
     * 移动slider位置
     * @param {Object} opts 参数
     * @param {Number} opts.x 横向移动距离
     * @param {Number} opts.y 纵向移动距离
     * @param {Number} opts.duration 动画执行时持续的时间
     * @param {Function} callback 动画完成后的回调函数
     */
    _translate: function(opts, callback) {
      var el = this.container,
        options = this.options,
        easing = options.easing,
        duration = opts.duration || 0,
        x = 0,
        y = 0;

      if (options.vertical) {
        y = opts.y || 0;
      } else {
        x = opts.x || 0;
      }

      if (duration > 0) {
        var fn = function() {
          el.removeEventListener(transitionEnd, fn, false);
          callback && callback.call(this);
        }

        el.addEventListener(transitionEnd, fn, false);
      };

      el.style.cssText = cssPrefix + 'transition: ' + cssPrefix + 'transform ' +
                  duration + 'ms ' + easing + ';' + cssPrefix +
                  'transform: translate3d(' + x + 'px,' + y + 'px,0)';
    },
    /**
     * 返回手指拖拽的方向
     * @return {Number}
     */
    _direction: function(){
      var offset = this.offset,
        movingPoint = this.options.vertical ? offset.y : offset.x;
      return movingPoint > 0 ? -1 : movingPoint < 0 ? 1 : 0;
    },
    /**
     * 更新对应子元素的位置
     * @private
     */
    _updateItemPos: function( idx ){
      var items = this.items,
        item = items.eq(idx % items.length);

      if (this.options.vertical) {
        item.css('top', this.height * idx);
      } else {
        item.css('left', this.width * idx);
      }
    },
    /**
     * 自动播放slider
     * @private
     */
    _play: function(){
      var that = this,
        opts = this.options;

      clearTimeout(this.timer);
      this.timer = setTimeout(function __inner(){
        that.index += 1;
        that._updateItemPos(that.index);
        that._toIndex(that.index);

        that.timer = setTimeout(__inner, opts.interval);
      }, opts.interval);
    },
    /**
     * 停止自动播放
     * @private
     */
    _stop: function(){
      if( this.timer != null ){
        clearTimeout(this.timer);
        this.timer = null;
      }
    },
    /**
     * 跳转到指定索引
     * @private
     * @param {Number} 索引值
     * @param {Number} duration 跳转到指定索引位置时，动画执行时间
     */
    _toIndex: function( index, duration ){
      var opts = this.options;

      if (duration == null) {
        duration = opts.duration;
      }

      this.position = {
        x: parseInt(-(this.width * index), 10),
        y: parseInt(-(this.height * index), 10)
      }

      if (opts.lazyload) {
        this._loadImage();
      }

      this._translate({
        x: this.position.x,
        y: this.position.y,
        duration: duration
      }, function(){
        if (opts.autoplay) {
          this._play();
        }
      }.bind(this));
    },
    /**
     * 加载当前this.index位置的图片
     * @private
     */
    _loadImage: function(){
      var opts = this.options,
        $item = this.items.eq(this.getIndex()),
        loaded = $item.data('loaded');

      // 只加载一次
      if( !loaded ){
        var $img = $item.find('img['+ opts.attribute +']');
        $img.prop('src', $img.attr(opts.attribute));
        $item.data('loaded', true);
      }
    },
    /**
     * 刷新slider
     * @public
     */
    refresh: function() {
      var vertical = this.options.vertical,
        width = this.width = this.$el.width(),
        height = this.height = this.$el.height(),
        properties = {
          position: 'absolute',
          overflow: 'hidden'
        };

      this.index = this.index % this.items.length;

      this._toIndex(this.index, 0);

      if (vertical) {
        properties.height = height;
        this.items.each(function(index, item){
          properties.top = index * height;
          $(item).css(properties);
        });
      } else {
        properties.width = width;
        this.items.each(function(index, item){
          properties.left = index * width;
          $(item).css(properties);
        });
      }

    },
    /**
     * 移动到指定索引位置
     * @public
     * @param {Number} to 索引值
     */
    slideTo: function( to ){
      var max = this.items.length;

      to < 0 && (to = 0);
      to >= max && (to = max - 1);

      this.index = to;
      this.refresh();
      this._toIndex(to);
    },
    /**
     * 获取当前索引值
     * @public
     * @return {Number} 索引值
     */
    getIndex: function(){
      return this.index % this.items.length;
    },

    /**
     * 销毁当前实例
     * @public
     */
    destroy: function(){
      this.$el.removeData('__slider__').off();
      $win.off(this.eventName);
    }
  };

  /**
   * 移动端图片轮播
   * @example
   * <div class="container">
   *     <div class="slider-item">
   *         <img src="" alt="" />
   *         <span>说明</span>
   *     </div>
   *     <div class="slider-item">
   *         <img src="" alt="" />
   *         <span>说明</span>
   *     </div>
   * </div>
   * @param {Object} options 参数集合
   * @param {Boolean} options.lazyload 是否开启延迟加载，默认false
   * @param {String} options.attribute 当开启延迟加载时有效，用于设置图像真实的url存储在哪个属性中，默认使用data-url
   * @param {Number} options.index 初始化索引位置，从0开始，默认0
   * @param {Number} options.duration 动画持续时间
   * @param {Boolean} options.autoplay 是否开启自动滑动，默认false
   * @param {Number} options.interval 只有在开启autoplay参数的情况下才有效，默认3000ms
   */
  var _slider = $.fn.slider = function( options ){
    var args = arguments;

    if( args.length === 0 ||
      ($.isPlainObject(options) && args.length === 1)
    ){

      $.each(this, function(index, item){
        var $item = $(item);
        $item.data('__slider__', new Slider($item, options));
      });

    } else if( options === 'option' && args.length > 1 ) {
      var ret = [];
      $.each(this, function(){
        var slider = $(this).data('__slider__'),
          method = null;

        if(slider){
          method = slider[args[1]];
          if( method &&
            args[1].indexOf('_') < 0 &&
            $.isFunction(method)
          ){
            var ret = method.apply(slider, _slice.call(args, 2));
            ret != null && ret.push(ret);
          } else {
            throw new Error(args[1] + ' method does not exist.');
          }
        }
      });
      return ret.pop();
    }

    return this;
  };
  _slider.version = VERSION;

})(Zepto, window);
