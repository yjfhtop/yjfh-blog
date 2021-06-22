---
lang: zh-CN
title: 页面的标题
description: 页面的描述
---
### 自定义页面相关

#### 居中


### 导入代码
@[code](@v/components/Test/index.vue)

[comment]: <> (<Test-index/>)

[comment]: <> (<Badge text="beta" type="warning"/> <Badge text="默认主题"/>)


<span v-for="i in 3"> span: {{ i }} </span>
  
### md 扩展 提示
::: tip
这是一个提示
:::

::: warning
这是一个警告
:::

::: details 点击查看代码
```js
console.log('你好，VuePress！')
```
:::



###  Emoji 表情
*[Emoji 列表](https://github.com/markdown-it/markdown-it-emoji/blob/master/lib/data/full.json)*
:tada:



### 内置组件
<ClientOnly>
  此处只在客户端渲染
</ClientOnly>


### 主题内置组件
#### Badge

`type`: 'tip' | 'warning' | 'danger'
 <Badge text="测试--" />


#### code-group

:::: code-group
::: code-group-item FOO
```js
const foo = 'foo'
```
:::
::: code-group-item BAR
```js
const bar = 'bar'
```
:::
::::


### 组件

<MyCom />
<my-com />