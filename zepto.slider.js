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
        prefix = $.fx.cssPrefix,
        _slice = Array.prototype.slice;

    function Slider( $el, opts ){
        opts || (opts = {});

        if( !$el || $el.length === 0 ) return; //jshint ignore:line
        $.extend(this, {
            $el: $el,
            items: $el.children(),
            lazyload: opts.lazyload || false,
            attribute: opts.attribute || 'data-src',
            autoplay: opts.autoplay || false,
            interval: opts.interval || 3000,
            index: opts.index || 0,
            duration: opts.duration || 600,
            start: {},
            easing: opts.easing || 'ease'
        });

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

            var that = this;

            that.container = document.createElement('div');
            that.container.className = 'slider-container';
            that.items.wrapAll(that.container);

            if( that.items.length < 2 ){
                that._loadImg();
                that.refresh();
                return;
            }

            that._initEvents();

            //开启自动滑动
            that.autoplay && that._play();
            that.refresh();
        },
        /**
         * 初始化事件绑定
         * @private
         */
        _initEvents: function(){
            var that = this,
                /**
                 * touchstart事件句柄   
                 * @event 
                 * @param  {Object} e 
                 */
                start = function(e){
                    var touch = e.touches[0];

                    $.extend(that.start, {
                        x: touch.pageX,
                        y: touch.pageY,
                        time: Date.now()
                    });

                    that.move = {};
                },
                /**
                 * touchmove事件句柄
                 * @event
                 * @param  {Object} e 
                 */
                move = function(e){
                    var touch = e.touches[0],
                        start = that.start,
                        move = that.move;

                    move.x = touch.pageX - start.x;
                    move.y = touch.pageY - start.y;

                    if( that.timer != null ){
                        clearTimeout(that.timer);
                        that.timer = null;
                    }

                    if( !that.moving ){
                        var dir = move.x >= 0 ? 1 : -1;
                        that._loop(dir, that.index);
                    }
                    that.moving = true;
                    translate3d({
                        el: that.container,
                        posX: that.posX + move.x,
                        duration: 0,
                        easing: that.easing
                    });

                    e.preventDefault();
                },
                /**
                 * touchend事件句柄
                 * @event
                 * @param  {Object} e 
                 */
                end = function(){
                    var isMove = false,
                        move = that.move,
                        absMoveX = Math.abs(move.x),
                        absMoveY = Math.abs(move.y),
                        time = Date.now() - that.start.time;

                    // 当x方向移动值大于等于y方向，才认为是左右滑动
                    if( absMoveX >= absMoveY ) {
                        // 滑动持续时间小于200ms，判定为快速滑动
                        if( time < 200 ){
                            //快速滑动时候，只要移动的距离超过30px则视为需要变更
                            isMove = absMoveX > 30;
                        } else {
                            //慢速滑动，移动的距离超过总距离的50%则视为需要变更
                            isMove = !!Math.round(absMoveX / that.width);
                        }
                    }

                    if( isMove ){
                        if( move.x > 0 ){
                            that.index -= 1;
                        } else {
                            that.index += 1;
                        }
                    }
                    that._toIndex(that.duration);

                    that.moving = false;
                },
                /**
                 * 视窗宽高变化时触发的事件句柄
                 */
                resize = function(){
                    that.index = that.getIndex();
                    that.refresh();
                };

            that.$el.on({
                touchstart: start,
                touchmove: move,
                touchend: end
            })
            .on($.fx.transitionEnd, function(){
                if( that.autoplay && that.timer == null ){
                    that._play();
                }
            });
            
            $win.on(that.eventName, resize);
        },
        _loop: function( dir, index ){
            var that = this,
                items = that.items,
                length = items.length,
                target = that.width * (index - dir), 
                nextIndex = index + (-dir);

            items
                .eq(nextIndex % length)
                .css('left', target);

        },
        /**
         * 自动播放slider
         * @private
         */
        _play: function(){
            var that = this;

            clearTimeout(that.timer);
            that.timer = setTimeout(function __inner(){
                that.index++;
                that._loop(1, that.index + 1);
                that._toIndex(that.duration);
                that.timer = setTimeout(__inner, that.interval);
            }, that.interval);
        },
        /**
         * 跳转到指定索引
         * @private
         * @param {Number} duration 动画持续时间，当不传的时候为0
         */
        _toIndex: function( duration ){
            var that = this,
                posX = that.posX = -(that.width * that.index);

            that.lazyload && that._loadImg();
            translate3d({
                el: that.container,
                posX: posX,
                duration: duration,
                easing: that.easing
            });
        },
        /**
         * 加载图片
         * @private
         */
        _loadImg: function(){
            var that = this,
                //取当前索引对应的图像
                $el = that.items.eq(that.getIndex()),
                loaded = $el.data('loaded');

            // 只加载一次
            if( !loaded ){

                var $img = $el.find('img['+ that.attribute +']');
                $img.prop('src', $img.attr(that.attribute));
                $el.data('loaded', true);
            }
        },
        /**
         * 刷新slider 包括图像大小及位置的重新计算
         * @public
         */
        refresh: function(){
            var that = this;

            that.width = that.$el.width();
            that.posX = -(that.width * that.index);
            that._toIndex();

            that.items.each(function( index, item ){
                $(item).css({
                    position: 'absolute',
                    left: index * that.width,
                    width: that.width
                });
            });
        },
        /**
         * 移动到指定索引位置
         * @public
         * @param {Number} to 索引值
         */
        slideTo: function( to ){
            var that = this,
                max = that.items.length;

            to < 0 && (to = 0);
            to >= max && (to = max - 1);
            
            that.index = to;
            that.refresh();
            that._toIndex();
        },
        /**
         * 获取当前索引值
         * @public
         * @return {Number} 索引值
         */
        getIndex: function(){
            var that = this;
            return that.index % that.items.length;
        },
        /**
         * 销毁当前实例
         * @public
         */
        destroy: function(){
            var that = this, 
                $el = that.$el;

            $el.removeData('__slider').off();
            $win.off(that.eventName);
        }
    };

    /**
     * 移动一个元素
     * @param  {Element} el      
     * @param  {Number} duration 动画持续时间
     * @param  {Number} x        位置
     * @private
     */
    function translate3d(opts){
        var el = opts.el;
        if( el && el.nodeType === 1 ){
            el.style.cssText = prefix +'transition: '+ prefix +'transform '+ opts.duration +'ms '+ opts.easing +';'+
                                prefix +'transform: translate3d('+ opts.posX +'px,0,0)';
        }
    }

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
            ($.isPlainObject(options) && 
            args.length === 1)
        ){
            $.each(this, function(){
                var $this = $(this);

                $this.data('__slider', new Slider($this, options));
            });

        } else if( options === 'option' && args.length > 1 ) {
            var ret = [];
            $.each(this, function(){
                var slider = $(this).data('__slider'),
                    method = null;

                if( slider ){
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