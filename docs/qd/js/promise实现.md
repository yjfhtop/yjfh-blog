---
title: promise实现
description: 原生js 实现 promise
---

## 思路
1. Promise 的核心就是 then、 catch 等方法，而这些方法的本质就是往 Promise 添加回调，并且生成新的Promise。
2. 同一Promise 能够多次调用 then、 catch 等方法。 那么我们需要一个队列来执行回调。
3. 根据1，生成新的Promise 的状态改变依赖于 then、 catch 等方法接收的回调，因此 添加回调时，不仅仅是回调的添加，也需要添加新的 Promise
4. 只需要在 Promise 的状态发生改变 或者 状态确定后调用 then、 catch 等方法 时触发 自己的回调函数的执行即可  
**需要注意的是**  
   4.1：传入给resolve 方法的数据是 Promise， 那么当前的 Promise 由传入的Promise的状态决定  
   4.2：then方法的返回是如果是 Promise， 那么then 返回的Promise的状态由  then方法的返回的Promise 决定。 


## 代码实现
```js
class MyPromise {
    constructor(newFun) {
        //可能的状态：  wait  ok  err
        this._status = 'wait'
        // resolve  reject 接受到的数据
        this.data = null
        // 需要执行的队列
        this._cbkArr = []
        // 当前是否有运行中的 队列
        this._runCbkArrIng = false

        // 这里要绑定this， 防止this 指向错误
        this._resolve = this._resolve.bind(this)
        this._reject = this._reject.bind(this)

        newFun && newFun(this._resolve, this._reject)
    }

    _resolve(data) {
        // 如果 resolve 接收到的数据是 Promise， 那么 本Promise 的状态 由 接收到的数据（data） 决定
        if (data && data instanceof MyPromise) {
            data.then((data) => {
                this._resolve(data)
            }, (err) => {
                this._reject(err)
            })
        } else {
            this.data = data
            this._status = 'ok'
            this._runCbkArr()
        }
    }
    _reject(err) {
        this.data = err
        this._status = 'err'
        this._runCbkArr()
    }

    // 添加回调
    _addCb(cbObj, callCbk = true) {
        const next = new MyPromise()
        if (!cbObj) {
            cbObj = {}
        }
        cbObj.promise = next
        this._cbkArr.push(cbObj)
        callCbk && this._runCbkArr()
        return next
    }

    // then, catch, finally 本质上都是往队列里添加 回调函数。
    then(resolve, reject) {
        return this._addCb({ okCbk: resolve, errCb: reject})
    }

    catch(cb) {
        return this._addCb({ errCb: cb})

    }

    finally(cb) {
        return this._addCb({ finally: cb})
    }



    _runCbkArr() {
        if (this._runCbkArrIng ||  this._status === 'wait') return
        this._runCbkArrIng = true
        // Promise 的回调是异步的， 这里使用 setTimeout 模拟
        setTimeout(() => {
            this._cbkArr.forEach(item => {
                try {
                    const cb = this._status === 'ok' ? item.okCbk : item.errCb
                    const data =  cb && cb(this.data)

                    if (item.finally) {
                        item.finally()
                    }

                    // 如果 then 的 回调函数 返回是 Promise 需要额外的处理
                    // 如果是这样： 意味着 item.promise 由 【then 的回调函数 返回的 Promise决定】
                    if (this._status === 'ok' && data instanceof MyPromise) {
                        // item.promise 的状态由 返回的 Promise 决定
                        data.then((data) => {
                            item.promise._resolve(data)
                        }, (err)=> {
                            item.promise._reject(err)
                        })
                    } else {

                        if (this._status === 'err' && !item.errCb) {
                            // 如果当前是 err 状态， 并且没有错误处理， 那么错误将延续
                            item.promise._status = 'err'
                            item.promise.data = this.data
                        } else {
                            // 当前状态是 ok 状态， 或者 当前状态是err 但是有 错误处理函数（errCb）
                            item.promise._status = 'ok'
                            item.promise.data = data
                        }
                        item.promise._runCbkArr()
                    }
                }  catch (e) {
                    // 如果是语法错误导致的错误， 那么将导致 状态变为 err
                    item.promise._status = 'err'
                    item.promise.err = e
                    item.promise._runCbkArr()
                }
            })
            this._cbkArr.length = 0
            this._runCbkArrIng = false
        })
    }


    static reject(err) {
        const next = new MyPromise()
        next._status = 'err'
        next.data = err
        return next
    }

    static resolve(data) {
        const next = new MyPromise()
        next._status = 'ok'
        next.data = data
        return next
    }

}
```