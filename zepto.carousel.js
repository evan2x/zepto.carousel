;(function(factory, root) {
  if (typeof define === 'function' && define.amd) {
    define(['zepto'], function(zepto) {
      factory(zepto, root);
    });
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('zepto'), root);
  } else {
    root.carousel = factory(Zepto, root);
  }
})(function($, root) {
  'use strict';

  /**
   * window 对象
   * @type {Object}
   */
  var $win = $(root),
    /**
     * 浏览器私有前缀
     * @type {String}
     */
    cssPrefix = $.fx.cssPrefix,
    /**
     * css 过渡完成事件
     * @type {String}
     */
    transitionEnd = $.fx.transitionEnd,
    /**
     * 屏幕旋转事件不兼容的情况下用resize代替
     * @type {String}
     */
    eventType = 'onorientationchange' in root ? 'orientationchange' : 'resize',
    /**
     * 数组的slice方法
     * @type {Function}
     */
    core_slice = Array.prototype.slice,
    /**
     * 将一个指定的值转换为方向值, 当传入正数时返回-1，传入负数返回1，传入0返回0
     * @param  {Number} n
     * @return {Number}
     */
    offset2dir = function(n) {
      if (n > 0) {
        return -1;
      }

      if (n < 0) {
        return 1;
      }

      if (n === 0) {
        return 0;
      }
    },
    /**
     * 求一个值的衰减值
     * @todo 由于负数没有平方根，所以如果接受一个负数的值，那么会先求绝对值，然后再转为负值
     * @param {Number} n
     * @return {Number}
     */
    attenuate = function(n) {
      if (n < 0) {
        return -Math.sqrt(Math.abs(n));
      }

      return Math.sqrt(n);
    };

  /**
   * 移动端图片轮播
   * @example
   * <div class="container">
   *   <div class="carousel-item">
   *     <img src="" alt="" />
   *     <p>说明</p>
   *   </div>
   *   <div class="carousel-item">
   *     <img src="" alt="" />
   *     <p>说明</p>
   *   </div>
   * </div>
   * @param {Object<Zepto>} $el
   * @param {Object} options 参数集合
   * @param {Boolean} options.lazyload 是否开启延迟加载，默认false
   * @param {String} options.attribute 当开启延迟加载时有效，用于设置图像真实的url存储在哪个属性中，默认使用data-url
   * @param {Number} options.index 初始化索引位置，从0开始，默认0
   * @param {Number} options.duration 动画持续时间，默认：400ms
   * @param {Boolean} options.autoplay 是否开启自动滑动，默认false
   * @param {Number} options.interval 只有在开启autoplay参数的情况下才有效，默认3000ms
   * @param {Number} options.vertical 是否启用垂直方向滑动，默认：false
   * @param {Number} options.loop 是否无缝循环滑动，默认：true
   */
  function Carousel($el, options) {
    options = options || {};

    // 实例参数项
    this.options = {
      lazyload: options.lazyload || false,
      attribute: options.attribute || 'data-src',
      autoplay: options.autoplay || false,
      interval: options.interval || 3000,
      index: options.index || 0,
      duration: options.duration || 400,
      easing: options.easing || 'ease',
      vertical: options.vertical || false,
      loop: typeof options.loop === 'boolean' ? options.loop : true
    };

    this.$el = $el;
    this.width = $el.width();
    this.height = $el.height();
    this.realIndex = this.prevIndex = this.options.index;
    this.items = this.$el.children();
    this.length = this.items.length;

    // 用于记录上次滑动的位置
    this.records = {x: 0, y: 0};

    this._init();
  }

  Carousel.prototype = {
    constructor: Carousel,
    get index() {
      var n = this.realIndex % this.length;

      if (n < 0) {
        n += this.length;
      }

      return n;
    },
    /**
     * 初始化, 创建一个容器用于包装所有子元素
     * @private
     */
    _init: function () {
      this.container = document.createElement('div');
      this.container.className = 'carousel-container';
      this.items.wrapAll(this.container);

      // 轮播图小于两张直接加载图片
      if (this.length < 2) {
        this._imageLoad();
      } else {
        this.$el.on('touchstart', this._startHandler.bind(this));
        $win.on(eventType, this.refresh.bind(this));
        $win.on('touchmove', function (e) {
          if (this.$el.has(e.target).length) {
            e.preventDefault();
          }
        }.bind(this));

        if (this.options.autoplay) {
          this.play();
        }
      }

      this.refresh();
    },
    /**
     * 移动容器位置
     * @private
     * @param {Object} options 参数
     * @param {Number} options.x 横向移动距离
     * @param {Number} options.y 纵向移动距离
     * @param {Number} options.duration 动画执行时持续的时间
     * @param {Number} options.easing 动画执行的缓动公式
     * @param {Function} callback 动画完成后的回调函数
     */
    _translate: function (options, callback) {
      options = options || {};

      var el = this.container,
        duration = options.duration || 0,
        easing = options.easing || this.options.easing,
        y = options.y || 0,
        x = options.x || 0;

      if (duration > 0) {
        el.style[cssPrefix + 'transition'] = cssPrefix + 'transform ' + duration + 'ms ' + easing;

        var fn = function () {
          el.style[cssPrefix + 'transition'] = cssPrefix + 'transform 0ms ' + easing;
          el.removeEventListener(transitionEnd, fn, false);
          $.isFunction(callback) && callback.call(this);
        }

        el.addEventListener(transitionEnd, fn, false);
      }

      el.style[cssPrefix + 'transform'] = 'translate3d(' + x + 'px,' + y + 'px,0)';
    },
    /**
     * 处理延迟加载的图片
     * @private
     */
    _imageLoad: function () {
      var options = this.options,
        $item = this.items.eq(this.index),
        loaded = $item.data('loaded');

      // 只加载一次
      if (!loaded) {
        var $img = $item.find('img['+ options.attribute +']');
        $img.prop('src', $img.attr(options.attribute));
        $item.data('loaded', true);
      }
    },
    /**
     * 跳转到指定索引
     * @private
     * @param {Number} 索引值
     * @param {Number} duration 跳转到指定索引位置时，动画执行时间
     */
    _toIndex: function (index, duration) {
      var that = this,
        options = this.options,
        x = 0,
        y = 0;

      if (duration == null) {
        duration = options.duration;
      }

      if (options.vertical) {
        y = this.records.y = parseInt(-this.height * index, 10);
      } else {
        x = this.records.x = parseInt(-this.width * index, 10);
      }

      if (options.lazyload) {
        this._imageLoad();
      }

      if (this.prevIndex != index) {
        this.prevIndex = index;
        that.$el.trigger('change', {
          index: that.index,
          items: that.items
        });
      }

      this._translate({
        x: x,
        y: y,
        duration: duration
      }, function () {
        if (options.autoplay) that.play();
      });
    },
    /**
     * 更新指定子元素的位置
     * @private
     * @param {Number} index
     */
    _positionForItemUpdate: function (index) {
      var item = this.items.eq(index % this.length),
        x = 0,
        y = 0;

      if (this.options.vertical) {
        y = this.height * index;
      } else {
        x = this.width * index;
      }

      item.css(
        cssPrefix + 'transform',
        'translate3d(' + x + 'px,' + y + 'px,0)'
      );
    },
    /**
     * touchstart 事件处理程序
     * @private
     */
    _startHandler: function (e) {
      if(e.touches.length > 1) return false;

      var touch = e.touches[0];

      // 记录滑动起始坐标及时间
      this.start = {
        x: touch.pageX,
        y: touch.pageY,
        time: Date.now()
      };

      // 重置偏移位置
      this.offset = {x: 0, y: 0};

      this.$el.on({
        touchmove: this._moveHandler.bind(this),
        touchend: this._endHandler.bind(this),
        touchcancel: this._endHandler.bind(this)
      });

      this.$el.trigger('dragstart', {
        index: this.index,
        items: this.items
      });
    },
    /**
     * touchmove 事件处理程序
     * @private
     */
    _moveHandler: function (e) {
      if (e.touches.length > 1) return false;

      var touch = e.touches[0],
        loop = this.options.loop,
        vertical = this.options.vertical,
        start = this.start,
        offset = this.offset,
        records = this.records,
        min = 0,
        max = this.length - 1,
        x = 0,
        y = 0,
        forward = false, // true 手指向左/上(前)移动，false 手指向右/下(后)移动
        direction = 0;

      if (vertical) {
        // 计算y轴偏移量
        offset.y = touch.pageY - start.y;
        forward = touch.pageY > start.y;
        direction = offset2dir(offset.y);
      } else {
        // 计算x轴偏移量
        offset.x = touch.pageX - start.x;
        forward = touch.pageX > start.x;
        direction = offset2dir(offset.x);
      }

      if (!loop && this.index === min && direction === -1) {
        if (vertical) {
          offset.y = attenuate(offset.y);
        } else {
          offset.x = attenuate(offset.x);
        }
      }

      if (!loop && this.index === max && direction === 1) {
        if (vertical) {
          offset.y = attenuate(offset.y);
        } else {
          offset.x = attenuate(offset.x);
        }
      }

      if (this.forward !== forward || !this.dragging) {
        if (loop) {
          this._positionForItemUpdate(this.realIndex + direction);
        }

        this.$el.trigger('drag', {
          direction: direction,
          index: this.index,
          items: this.items
        });
      }

      if (vertical) {
        y = records.y + offset.y;
      } else {
        x = records.x + offset.x;
      }

      this._translate({
        x: x,
        y: y
      });

      // 记录本次拖拽方向
      this.forward = forward;
      this.dragging = true;
    },
    /**
     * touchend/touchcancel 事件处理程序
     * @private
     */
    _endHandler: function () {
      this.$el.off('touchmove touchend touchcancel');

      var vertical = this.options.vertical,
        loop = this.options.loop,
        offset = this.offset,
        moveX = Math.abs(offset.x),
        moveY = Math.abs(offset.y),
        direction = 0,
        changed = false,
        min = 0,
        max = this.length - 1,
        timeDiff = Date.now() - this.start.time;

      if (vertical) {
        direction = offset2dir(offset.y);
      } else {
        direction = offset2dir(offset.x);
      }

      if (!loop && this.index === min && direction === -1) {
        this.realIndex = min;
      } else if (!loop && this.index === max && direction === 1) {
        this.realIndex = max;
      } else {
        if (timeDiff < 200) {
          changed = vertical ? moveY > 30 : moveX > 30;
        } else {
          changed = !!Math.round(vertical ? moveY / this.height : moveX / this.width);
        }

        if (changed) {
          this.realIndex += direction;
        }
      }

      this._toIndex(this.realIndex);

      this.$el.trigger('dragend', {
        direction: direction,
        index: this.index,
        items: this.items
      });

      this.dragging = false;
    },
    /**
     * 自动播放
     * @public
     */
    play: function () {
      var that = this,
        options = this.options;

      clearTimeout(this.timer);
      this.timer = setTimeout(function __inner() {
        that.realIndex += 1;
        that._positionForItemUpdate(that.realIndex);
        that._toIndex(that.realIndex);

        that.timer = setTimeout(__inner, options.interval);
      }, options.interval);
    },
    /**
     * 停止自动播放
     * @public
     */
    stop: function () {
      if(this.timer != null){
        clearTimeout(this.timer);
        this.timer = null;
      }
    },
    /**
     * 获取当前索引
     * @return {Number}
     */
    getIndex: function() {
      return this.index;
    },
    /**
     * 获取子元素
     * @return {Array}
     */
    getItems: function() {
      return this.items;
    },
    /**
     * 子元素位置及更新索引位置
     * @public
     */
    refresh: function () {
      var vertical = this.options.vertical,
        width = this.$el.width(),
        height = this.$el.height(),
        x = 0,
        y = 0,
        properties = {
          position: 'absolute',
          overflow: 'hidden'
        };

      this.width = width;
      this.height = height;

      this.realIndex = this.index;
      this._toIndex(this.realIndex, 0);

      this.items.each(function (index, item) {
        if (vertical) {
          properties.height = height;
          y = index * height;
        } else {
          properties.width = width;
          x = index * width;
        }

        properties[cssPrefix + 'transform'] = 'translate3d(' + x + 'px,' + y + 'px, 0)';
        $(item).css(properties).show();
      });
    },
    /**
     * 移动到指定索引位置
     * @public
     * @param {Number} index 索引值
     */
    slideTo: function (index) {
      var that = this,
        max = this.length;

      index < 0 && (index = 0);
      index >= max && (index = max - 1);

      this.refresh();

      this.realIndex = index;
      that._toIndex(index);
    },
    /**
     * 销毁当前实例
     * @public
     */
    destroy: function () {
      this.$el.removeData('__carousel__').off();
      $win.off(eventType);
    }
  }

  var _carousel = $.fn.carousel = function (options) {
    var args = arguments;

    if(args.length === 0 || ($.isPlainObject(options) && args.length === 1)){
      $.each(this, function (index, item){
        var $item = $(item);
        $item.data('__carousel__', new Carousel($item, options));
      });
    } else if (args.length >= 1 && typeof options === 'string') {
      var ret = [];

      $.each(this, function () {
        var carousel = $(this).data('__carousel__');

        if (carousel) {
          var method = options;

          if(method
            && method.indexOf('_') === -1
            && $.isFunction(carousel[method])
          ){
            ret.push(carousel[method].apply(carousel, core_slice.call(args, 1)));
          } else {
            throw new Error(method + ' method does not exist.');
          }
        }
      });

      return ret.pop();
    }

    return this;
  };

  _carousel.version = '1.1.0';
}, window);
