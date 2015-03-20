/**
 * @description  slider插件，暂时没写lazyload功能
 * @author evan(evan2zaw@gmail.com)
 * @date 2015/02/11
 * @version 0.0.1-alpha
 * @dependencies Zepto
 */

(function( $ ){
    'use strict';

    var VERSION = '0.0.1-alpha',
        nsid = 0,
        $win = $(window),
        prefix = $.fx.cssPrefix,
        _slice = Array.prototype.slice;

    function Slider( $el, opts ){
        opts || (opts = {});

        if( !$el || $el.length === 0 ) return;
        $.extend(this, {
            $el: $el,
            items: $el.children(),
            lazyload: opts.lazyload || false,
            autoplay: opts.autoplay || false,
            interval: opts.interval || 3000,
            index: opts.index || 0,
            duration: opts.duration || 600,
            start: {},
            ns: 'slider' + (nsid++)
        });

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
            that.items.wrapAll(that.container);

            that.refresh();
            that._initEvents();

            //开启自动滑动
            that.autoplay && that._play();
            that._toIndex();
        },
        /**
         * 初始化事件绑定
         * @private
         */
        _initEvents: function(){
            var that = this;

            that.$el.on({
                touchstart: $.proxy(that._start, that),
                touchmove: $.proxy(that._move, that),
                touchend: $.proxy(that._end, that)
            })
            .on($.fx.transitionEnd, function(){
                if( that.autoplay && that.timer == null ){
                    that._play();
                }
            });

            $win.on(
                'resize.' + that.ns,
                $.proxy(that._resize, that)
            );
        },
        _resize: function(){
            var that = this;

            that.index = that.getIndex();
            that.refresh();
        },
        /**
         * 根据索引计算下张图片的位置    
         * @param  {Number} dir  方向：1 表示从左向右滑动，-1表示从右向左滑动
         * @param {Number} index 
         */
        _loopItem: function( dir, index ){
            var that = this,
                items = that.items,
                length = items.length,
                target = that.width * (index - dir), 
                nextIndex = index + (-dir);

            items
                .eq(nextIndex % length)
                .css('left', target);

        },
        _start: function(e){
            var touche = e.touches[0];

            $.extend(this.start, {
                x: touche.pageX,
                y: touche.pageY,
                time: Date.now()
            });

            this.move = {};
        },
        _play: function(){
            var that = this;

            clearTimeout(that.timer);
            that.timer = setTimeout(function __inner(){
                that.index++;
                that._loopItem(1, that.index + 1);
                that._toIndex(that.duration);
                that.timer = setTimeout(__inner, that.interval);
            }, that.interval);
        },
        _move: function(e){
            var that = this,
                touche = e.touches[0],
                start = that.start,
                move = that.move;

            move.x = touche.pageX - start.x;
            move.y = touche.pageY - start.y;

            // 当x方向移动值大于y方向的，才认为是左右滑动
            if( Math.abs(move.x) > Math.abs(move.y) ){
                if( that.timer != null ){
                    clearTimeout(that.timer);
                    that.timer = null;
                }

                if( !that.moving ){
                    var dir = move.x >= 0 ? 1 : -1;
                    that._loopItem(dir, that.index);
                }
                that.moving = true;
                translate3d(that.container, 0, that.posX + move.x);
            } else {
                e.preventDefault();
            }
        },
        _end: function(){
            var that = this,
                diff = 0,
                absMoveX = Math.abs(that.move.x),
                time = Date.now() - that.start.time;

            // 滑动持续时间小于200ms，判定为快速滑动
            if( time < 200 ){
                //快速滑动时候，只要移动的距离超过30px则视为需要变更
                diff = absMoveX > 30 ? 1 : 0;
            } else {
                //慢速滑动，移动的距离超过总距离的50%则视为需要变更
                diff = Math.round(absMoveX / that.width);
            }

            if( diff ){
                if( that.move.x > 0 ){
                    that.index -= 1;
                } else {
                    that.index += 1;
                }
            }
            that._toIndex(that.duration);

            that.moving = false;
        },
        _toIndex: function( duration ){
            var that = this,
                pos = that.posX = -(that.width * that.index);

            translate3d(that.container, duration || 0, pos);
        },
        /**
         * 刷新每个图片的位置及宽度
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
                    top: 0,
                    width: that.width
                });
            });
        },
        /**
         * 移动到指定索引位置
         * @param {Number} to 索引值
         * @public
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
         * @return {Number} 索引值
         * @public
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
            $win.off('resize' + that.ns);
        }
    }

    /**
     * 移动一个元素
     * @param  {Element} el      
     * @param  {Number} duration 动画持续时间
     * @param  {Number} x        位置
     * @inner
     */
    function translate3d( el, duration, x ){
        el.style.cssText += prefix + 'transition: transform '+ duration +'ms ease;'
                + prefix + 'transform: translate3d('
                + x + 'px,0,0)';
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
    }
    _slider.version = VERSION;

})(Zepto);