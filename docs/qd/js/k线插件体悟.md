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
这里是将 配置的合并部分放在了 k线本身的 配置初始化阶段来防止get 做 deepCopy 等复杂操作。

::: tip tips
关于正则表达式，非必要的情况下尽量不使用（性能问题）。 在get 方法中尽量避免复杂的计算（这点我是知道的，但是依旧犯错了） 
:::

---

### 4. 关于思路问题

#### 初始化思路
1. 元素准备阶段： 创建容器（没有什么好说的）...  唯一需要注意的采用了`分层绘制`， 分为上下两层。底层绘制图表等惰性图形。 上层绘制工具、十字线等活跃的图形，用来优化性能。
2. 绘制的结束下标的确定： 默认以图表可见部分的最右方的柱子下标为结束下标，
   当结束小标可通过 结束下标 - 图表的绘制宽度 / 柱子的宽度 [代码](https://github.com/yjfhtop/simple-k-line/blob/2078ba93aa30c04e09a74704a6ecf72741573881/src/index.ts#L143)来确定。
3. 实例的实例化（图表、指标等）: 这个没有什么好所的，有了指标才能够对y轴就行确定。
4. 确定y轴宽度： 由于y轴的宽度 和 图表可显示的 柱子的数目是相互影响的。那么需要确定后才能够开始绘制，我这边是采用了递归的形式来处理， 同时
为了防止死循环，给y轴的宽度放了余量（2px）(代码)[https://github.com/yjfhtop/simple-k-line/blob/2078ba93aa30c04e09a74704a6ecf72741573881/src/index.ts#L328]。
   主要的实现就是通过图表的各个指标来计算这个图表的最大和最小值，然后计算得出刻度文字。 所有图表宽度最大的就是y轴的文字的宽度。
5. 绘制： 没有什么好说的，图表和指标都有自己的绘制方法，调用即可。


### 防止图表为空
1. 确定 结束下标 的最大最小值。
2. 最大值 当结束小标为数据的最后一位元素，向左移动 图表可展示的元素 + （最小需要展示的柱子的个数） 可得
3. 最小值 结束下标 = 最小需要展示的柱子的个数
4. 当出现 结束下标 重新赋值时，需要对最大最小值规范即可

#### resize 思路
1. 清空原有的容器和canvas元素，重新创建。
2. 其他部分就同 `初始化思路` 4往后。 确定y轴宽度（todo: 这里有个优化点， 图表的宽高应该等比缩放）
3. 绘制


#### 柱子的放大和缩小
1. 修改柱子的宽度， 保持 结束下标 相对不变。 同时使用 `防止图表为空` 来规范化 结束下标
2. 确定 y 轴的宽度。 然后对 x轴 确定绘制开始下标 以及 填充空白时间。
3. 绘制

### 平移
1. 左移： 结束下标 减小。 右移： 结束下标 增加（在变化时记得 `防止图表为空` 规范一下）
2. 确定 y 轴的宽度。 然后对 x轴 确定绘制开始下标 以及 填充空白时间。
3. 绘制



