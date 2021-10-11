---
title: k线插件体悟
description: 写k线插件后的一些体悟...
---
# k线插件体悟

前段时间写了个k线插件， 虽然还有 ~~一点点~~（亿点点） 细节没有处理，可总归还是有些体悟的。

---
   
  
### 1. 关于多倍屏canvas 模糊的问题

关于这一点，一般会采用获取dpi然后等比缩放处理。mdn上也有简单的处理[window.devicePixelRatio](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/devicePixelRatio)

**实现**
```ts
/**
 * 获取屏幕比
 */
export function getPixelRatio() {
    return window.devicePixelRatio || 1
}

export interface CanvasElCtx {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
}

/**
 * 创建高清canvas
 * @param w
 * @param h
 * @param style
 */
export function createHDCanvas(
    w: number,
    h: number,
    style?: Partial<CSSStyleDeclaration>
): CanvasElCtx {
    let canvas = document.createElement('canvas')
    let ctx = canvas.getContext('2d')

    let pxRatio = getPixelRatio()

    canvas.width = w * pxRatio
    canvas.height = h * pxRatio

    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'

    ctx.scale(pxRatio, pxRatio)

    if (style) {
        Object.keys(style).forEach((key) => {
            canvas.style[key as any] = style[key as any]
        })
    }

    return {
        canvas,
        ctx,
    }
}
```


### 2. 关于1px模糊
当然，不仅仅是1px模糊， 只要是宽度为 奇数， 坐标是整数就会出现这个问题。 主要是因为最小的绘制单位是1个像素点，当绘制一条1px的线段时，
由于绘制的坐标是整数，那么canvas会在这个坐标点的两边扩散绘制，导致出现的样子是 2px、颜色变浅的线段。 如下图的第二幅图

![GitHub](/canvas-1px.webp)

但是如果将坐标偏移0.5px就可以解决这个问题， 如上图的 第三副图

**代码**
```ts
// 绘制样式 string(颜色)  CanvasPattern(纹理)  CanvasGradient(渐变)
type StrokeAndFillStyle = string | CanvasGradient | CanvasPattern

// 绘制样式， 包含填充 和 stroke 的所有样式
interface DrawStyle {
    w?: number
    style?: StrokeAndFillStyle
    // 本项存在就是虚线
    lineDash?: number[]
}

// 坐标
interface Coordinate {
    x: number
    y: number
}

// 通过 类型 和样式设置绘制样式
function setDrawStyle(
    ctx: CanvasRenderingContext2D,
    drawType: DrawType = DefDrawType,
    drawStyle: DrawStyle = { w: 1, style: '#000' }
) {
    drawStyle = drawStyle || {}
    if (drawType === 'stroke') {
        drawStyle.w && (ctx.lineWidth = drawStyle.w)
        drawStyle.lineDash && ctx.setLineDash(drawStyle.lineDash)
        drawStyle.style && (ctx.strokeStyle = drawStyle.style)
    } else if (drawType === 'full') {
        drawStyle.style && (ctx.fillStyle = drawStyle.style)
    }
}

/**
 * 绘制 线段
 */
function drawLine(
    ctx: CanvasRenderingContext2D,
    startCoordinate: Coordinate,
    endCoordinate: Coordinate,
    drawStyle?: DrawStyle
) {
    ctx.save()
    ctx.beginPath()
    ctx.imageSmoothingEnabled = true
    startCoordinate = { ...startCoordinate }
    endCoordinate = { ...endCoordinate }

    setDrawStyle(ctx, 'stroke', drawStyle)

    // 处理 模糊问题
    if (!drawStyle || !drawStyle.w || isOdd(drawStyle.w)) {
        if (startCoordinate.x === endCoordinate.x) {
            startCoordinate.x = Math.floor(startCoordinate.x) + 0.5
            endCoordinate.x = Math.floor(endCoordinate.x) + 0.5
        }
        if (startCoordinate.y === endCoordinate.y) {
            startCoordinate.y = Math.floor(startCoordinate.y) + 0.5
            endCoordinate.y = Math.floor(endCoordinate.y) + 0.5
        }
    }
    // 绘制
    ctx.moveTo(startCoordinate.x, startCoordinate.y)
    ctx.lineTo(endCoordinate.x, endCoordinate.y)
    ctx.stroke()
    ctx.restore()
}
```

::: tip tips
关于模糊的问题， 不仅仅是线段...填充等也会有这个问题。 所以在canvas中绘制尽量不要出现小数点...
:::


---
### 3. 关于性能问题
在刚开始时， 由于k线x轴的配置是采用的get, 但是get方法中有 [deepCopy](/qd/js/深度克隆.html) 方法 , 而deepCopy方法中调用了 getDataType(前) 方法,
由于本方法最开始的获取数据类型是使用的正则表达式， 导致性能极具下降。 后改为 [getDataType(后)](/qd/js/深度克隆.html)

**getDataType(前)**
```ts
function getDataType(data: any): DataType {
    const typeStr: string = Object.prototype.toString.call(data)
    const useTypeStr = typeStr.replace('[object ', '').replace(']', '')
    return useTypeStr as DataType
}
```

修改后虽然性能提升，但是 在get中有复杂计算依旧是不合适的， [kLine](https://github.com/yjfhtop/simple-k-line/blob/master/src/kLineConf.ts) 的 initConf方法的 Y轴的 配置项处理 注释部分。
这里是将 配置的合并部分放在了 k线本身的 配置初始化，在

::: tip tips
关于正则表达式，非必要的情况下尽量不使用（性能问题）。 在get 方法中尽量避免复杂的计算（这点我是知道的，但是依旧犯错了） 
:::