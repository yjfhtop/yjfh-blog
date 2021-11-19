---
title: 微信小程序 api 封装
description: 微信小程序 api 封装
---

# 微信小程序 api 封装
包含显示loading, 去除重复请求， 错误显示

### 封装class  文件 library/request.js

```js
// 用于封装微信的请求相关， 这里只处理 Ajax

const {mergeData, getDataType} = require('../utils/tools')

const defConf = {
    // wx.request 自带的配置 s
    header: {
        'content-type': 'application/json'
    },
    timeout: 5 * 1000,
    method: 'GET',
    dataType: 'json',
    responseType: 'text',
    enableHttp2: false,
    enableQuic: false,
    enableCache: false,
    enableHttpDNS: false,
    httpDNSServiceId: undefined,
    enableChunked: false,
    // wx.request 自带的配置 e

    // 自定义配置 s
    // 如果报错，是否显示错误信息
    showErr: true,
    // wx.showToast 的配置项,
    showErrConf: {
        title: '',
        icon: 'none',
        image: null,
        duration: 2 * 1000,
        mask: false
    },
    // 请求过程中是否显示loading
    showLoading: false,
    // loading 的配置项
    loadingConf: {
        title: '加载中...',
        mask: true
    },
    // 请求的基础路径
    baseUrl: '',
    // 去除重复请求，当重复请求时，默认返回 失败
    noRepeat: true,
    repeatMessage: '您的手速太快了...'
    // 自定义配置 e
}

// 是否 重复请求的错误, 业务如果需要对重复请求
function isRepeatErrObj(data) {
    return getDataType(data) === 'Object' && data.repeat
}


class Request {
    constructor(conf) {
        this._conf = mergeData(defConf, conf || {}, true)
        // 用于检验是否有重复的请求
        this._reqHashMap = {}
        // 请求拦截器 暂时只支持同步
        this._interceptorsRequest = []
        // 响应拦截器 暂时只支持同步
        this._interceptorsResponse = []
        // 请求前 +1 ，完成或者失败后-1,当 = 0 时关闭 loading
        this._loadingNumber = 0
    }

    request(url, data, conf) {
        conf = mergeData(this._conf, conf, true)

        // 请求拦截器处理
        const newConf = this._handleInterceptorsRequest(url, data, conf)
        url = newConf.url
        data = newConf.data
        conf = newConf.conf

        // 开始请求
        const newReq = new Promise((resolve, reject) => {

            // 如果启用去重，先判断有没有重复，没有的话将 hash 写入到 _reqHashMap
            const hash = this._getReqHash(url, data, conf)
            if (conf.noRepeat) {
                const isRepeat = this._isRepeat(hash)
                // 重复了
                if (isRepeat) {
                    reject({repeat: true, msg: conf.repeatMessage})
                    return
                } else {
                    this._reqHashMap[hash] = true
                }
            }

            // loading 处理
            this._showLoading(conf)

            // 真实的请求
            wx.request({
                url: conf.baseUrl + url,
                data,
                ...conf,
                success:(res) =>{
                    resolve(this._handleInterceptorsResponse(res))
                },
                fail: (err) => {
                    reject(err.errMsg)
                },
                complete: () => {
                    // loading 处理
                    this._hideLoading(conf)
                    // hash 处理
                    if (conf.noRepeat) {
                        delete this._reqHashMap[hash]
                    }
                }
            })

        })

        return new Promise((resolve, reject) => {
            newReq.then(data => {
                resolve(data)
            }).catch(err => {
                reject(err)
                // 错误回显
                if (conf.showErr) {
                    // 对于重复的请求需要额外处理
                    const isRepeat = isRepeatErrObj(err)
                    let errStr = err
                    if (isRepeat) {
                        errStr = err.msg
                    }
                    const useConf = { ...conf.showErrConf }
                    if (errStr) {
                        useConf.title = errStr + ''
                    }
                    wx.showToast(useConf)
                }
            })
        })
    }


    get(url, data, conf) {
        return this.request(url, data, { ...conf, method: 'GET' })
    }
    post(url, data, conf) {
        return this.request(url, data, { ...conf, method: 'POST' })
    }

    put(url, data, conf) {
        return this.request(url, data, { ...conf, method: 'PUT' })
    }

    delete(url, data, conf) {
        return this.request(url, data, { ...conf, method: 'DELETE' })
    }

    // 获取请求的hash  现阶段以 请求方法， 路径， 数据都相同 就为同一请求
    _getReqHash(url, data, conf) {
        const dataStr = JSON.stringify(data)
        const method = conf.method
        return url + dataStr + method
    }

    // 判断是否重复的请求,  现阶段以 请求方法， 路径， 数据都相同 就为同一请求
    _isRepeat(hash) {
        return !!this._reqHashMap[hash]
    }


    // 添加拦截器， 响应拦截器只建议添加一个，多次添加难以确定 cb 接收参数的类型
    addInterceptors(cb, type = 'request') {
        if (getDataType(cb) === 'Function') {
            if (type === 'request') {
                this._interceptorsRequest.push(cb)
            } else {
                this._interceptorsResponse.push(cb)
            }
        }
    }

    // 添加请求拦截器
    // 注意，cb 必须返回 { url, data, conf } 格式。 cb 接收的参数为 url, data, conf
    // 注意，cb 必须返回 { url, data, conf } 格式。 cb 接收的参数为 url, data, conf
    addInterceptorsRequest(cb) {
        this.addInterceptors(cb, 'request')
    }

    // 添加响应拦截器
    // cb 接收 wx.request  success 返回的参数。
    addInterceptorsResponse(cb) {
        this.addInterceptors(cb, 'response')
    }

    // 处理 请求拦截器
    _handleInterceptorsRequest(url, data, conf) {
        let target = { url, data, conf }
        this._interceptorsRequest.forEach(item => {
            const newTarget = item( target.url, target.data, target.conf )
            if (!newTarget || !newTarget.url || !newTarget.conf) {
                throw new Error(`请求拦截器 回调返回值错误， 请检查： ${item} 的返回值`)
            }
        })

        return target
    }

    _handleInterceptorsResponse(res) {
        let newRes = res

        for (let i = 0; i < this._interceptorsResponse.length; i++) {
            const item = this._interceptorsResponse[i]
            newRes = item(newRes)
            // // 当有一个返回的数据为 Promise 时，代表确定本次数据了，也就不在往下执行了
            // if (getDataType(newRes) === 'Promise') {
            //
            // }
        }
        return newRes
    }

    // 显示loading
    _showLoading(conf) {
        if (conf.showLoading) {
            if (this._loadingNumber > 0) {

            } else {
                wx.showLoading(conf.loadingConf)
            }
            this._loadingNumber++
        }
    }
    // 隐藏loading
    _hideLoading(conf) {
        if (conf.showLoading) {
            this._loadingNumber--
            if (this._loadingNumber <= 0) {
                wx.hideLoading()
                this._loadingNumber = 0
            }
        }
    }
}


module.exports = {
    Request,
    isRepeatErrObj
}

```


### 依赖文件  utils/tools.js

```js
/**
 * 获取数据类型
 * @param data
 * @returns {string}  Object  Array Function Null ....
 */
function getDataType(data) {
    const typeStr = Object.prototype.toString.call(data)
    let useTypeStr = typeStr.slice(8)
    useTypeStr = useTypeStr.slice(0, useTypeStr.length - 1)
    return useTypeStr
}

/**
 * 深度克隆
 * @param data
 * @returns {*|{}}
 */
function deepCopy(data) {
    // 存储引用数据, 用于判断是否有循环引用
    const reMap = new Map()

    function copy(data) {
        const typeStr = getDataType(data)
        switch (typeStr) {
            case 'Array':
            case 'Object':
                // 处理循环引用 s
                if (reMap.has(data)) {
                    return reMap.get(data)
                }
                // 处理循环引用 e
                const useData = data
                let newData = []
                if (typeStr === 'Array') {
                    newData = []
                    // 处理循环引用 s
                    reMap.set(data, newData)
                    // 处理循环引用 e
                    for (let i = 0; i < useData.length; i++) {
                        newData[i] = copy(useData[i])
                    }
                } else {
                    newData = {}
                    // 处理循环引用 s
                    reMap.set(data, newData)
                    // 处理循环引用 e
                    Object.keys(useData).forEach((key) => {
                        newData[key] = copy(useData[key])
                    })
                }
                return newData
            case 'Boolean':
            case 'Function':
            case 'Null':
            case 'Number':
            case 'String':
            case 'Undefined':
                return data
        }
    }

    return copy(data)
}


/**
 * 合并数据, 只有新旧数据都是 obj 类型才生效(key 对应的 value 也是这样)， 否则，一直返回新数据
 * @param oldData
 * @param newData
 * @param copy 是否copy数据， 脱离引用
 */
function mergeData(oldData, newData, copy = true) {
    if (copy) {
        oldData = deepCopy(oldData)
        newData = deepCopy(newData)
    }
    function merge(oldData, newData) {
        const oldTypeStr = getDataType(oldData)
        const newTypeStr = getDataType(newData)

        if (newTypeStr === 'Object' && oldTypeStr === 'Object') {
            Object.keys(newData).forEach((key) => {
                if (newData[key] !== undefined) {
                    oldData[key] = merge(oldData[key], newData[key])
                }
            })
            return oldData
        } else if (newData === undefined) {
            return oldData
        } else {
            return newData
        }
    }
    return merge(oldData, newData)
}



module.exports = {
    getDataType,
    deepCopy,
    mergeData
}

```


### 使用

```js
// 业务使用的请求
const {Request, isRepeatErrObj} = require('.././library/request')


const useConf = {
    baseUrl: 'xxx'
}

const request = new Request(useConf)

// 添加请求拦截器
request.addInterceptorsRequest((url, data, conf) => {
    // 这里一般是 token 处理
    return {
        url,
        data,
        conf
    }
})

// 响应拦截器
request.addInterceptorsResponse((data) => {
    // 这里一般 对后端的状态码处理
    return data
})


module.exports = request

// 真实请求
request.post('/v1/playback/exit', {}, { showLoading: true })
```