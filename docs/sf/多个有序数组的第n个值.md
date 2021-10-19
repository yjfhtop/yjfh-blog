---
title: 多个有序数组的第n个值
description: 多个有序数组的第n个值
---
# 多个有序数组的第n个值

>   多个有序数组的第n个值， 这个也可以用于求 多个有序数组的 中位数

### 思路 
二分查找， 每次二分 number一半的数目

### 实现代码
```js
/***
 * 有序数组 查找第 n 个值（从小到大）
 * @param arr1
 * @param arr2
 * @param number
 * @returns {*|number}
 */
function multipleArrGetMinValue(arr1, arr2, number) {
    function numberGetValue(arr1, s1, e1, arr2, s2, e2, number) {
        const arr1Len = e1 - s1 + 1
        const arr2Len = e2 - s2 + 1

        const sValue1 = arr1[s1]
        const sValue2 = arr2[s2]

        const halfNumber = Math.floor(number / 2)

        // 考虑为某个数组长度为0 或者截取后长度为0 的情况 s
        if (arr1Len === 0) {
            return arr2[s2 + number -1]
        }
        if (arr2Len === 0) {
            return arr1[s1 + number -1]
        }
        // 考虑为某个数组长度为0 或者截取后长度为0 的情况 e

        // 当 number === 1，就是要寻找最小的值 s
        if (number === 1) {
            return Math.min(sValue1, sValue2)
        }
        // 当 number === 1，就是要寻找最小的值 e


        // 这里是为了排除number一半 的干扰项
        const newS1 = s1 + Math.min(arr1Len, halfNumber) - 1
        const newS2 = s2 + Math.min(arr2Len, halfNumber) - 1


        if (arr1[newS1] > arr2[newS2]) {
            return numberGetValue(arr1, s1, e1, arr2, newS2 + 1, e2, number - ( newS2 - s2 + 1 ))
        } else {
            return numberGetValue(arr1, newS1 + 1, e1, arr2, s2, e2, number - ( newS1 - s1 + 1 ))
        }


    }

    return numberGetValue(arr1, 0, arr1.length - 1, arr2, 0, arr2.length - 1, number)
}
```