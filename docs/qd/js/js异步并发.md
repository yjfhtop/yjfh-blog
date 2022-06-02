---
title: js 异步并发
description: js 异步并发 处理
---

## 思路
1. 加速并发数目为n, 前n个任务是异步执行,当n+1个任务时,就需要阻塞任务
2. 如何阻塞: await, 阻塞什么: Promise.race

## 代码实现

### 形式一
```js
async function concurrencyFun(limitNumber, taskArr, fun) {
    const nowRunArr = []
    const errArr = []
    for (let item of taskArr) {
        if (nowRunArr.length >= limitNumber) {
            await Promise.race(nowRunArr)
        }
        const funP = fun(item, taskArr)
        // useP 保证会成功
        const useP = new Promise((resolve, reject) => {
            funP.then().catch(() => {
                console.log(item, 'item');
                errArr.push(item)
            }).finally(() => {
                const index = nowRunArr.indexOf(useP)
                nowRunArr.splice(index, 1)
                resolve();
            })
        })
        nowRunArr.push(useP)
    }
    await Promise.all(nowRunArr)
    return errArr
}

// 使用
let ii = 0;
function fff() {
    let p = new Promise((resolve, reject) => {
        setTimeout(()=> {
            const random = Math.random()
            if (random > 0.5) {
                resolve(ii)
            } else {
                reject(new Error('ssdf'))
            }
            ii++

        }, 1000)
    })
    p.then(data => {
        console.log(data);
    }).catch(err => {
        console.log(err);
    })
    return p
}

concurrencyFun(2, new Array(10).fill(1).map((item,index) => index), fff).then(errArr => {
    console.log(errArr);
})

```

### 形式二
```js
class Concurrency {
    constructor(limitNumber = 10) {
        // 并发数目
        this.limitNumber = limitNumber
        // 当前并发的数目
        this.nowRunNumber = 0
        // 等待并发的 占位
        this.awaitList = []
    }

    // fun 返回一个 Promise
    async add(fun) {
        if (this.nowRunNumber >= this.limitNumber) {
            // 并发已满, 等待
            await new Promise((resolve, reject) => {
                this.awaitList.push(resolve)
            })
        }
        this.nowRunNumber++

        let data = null
        let err = null

        // 就算 fun 失败,也要释放资源
        try {
            data = await fun()
        } catch (e) {
            err = e
        }

        this.nowRunNumber--

        // 释放资源, 让后面的并发执行
        if (this.awaitList.length > 0) {
            this.awaitList.shift()();
        }
        return new Promise((resolve, reject) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    }
}

// 使用
const schedule = new Concurrency(3);

const asyncFun = (n, time) => {
    return () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const random = Math.random()
                if (random > 0.5) {
                    resolve(n)
                } else {
                    reject(new Error('ssdf'))
                }
            }, time);
        });
    };
};

schedule.add(asyncFun(1, 2000)).then((n) => {
    console.log(`异步任务:${n}`);
}).catch(err => {
})

schedule.add(asyncFun(2, 2000)).then((n) => {
    console.log(`异步任务:${n}`);
}).catch(err => {
})

schedule.add(asyncFun(3, 2000)).then((n) => {
    console.log(`异步任务:${n}`);
}).catch(err => {
})

schedule.add(asyncFun(4, 2000)).then((n) => {
    console.log(`异步任务:${n}`);
}).catch(err => {
})

schedule.add(asyncFun(5, 2000)).then((n) => {
    console.log(`异步任务:${n}`);
}).catch(err => {
})
```



