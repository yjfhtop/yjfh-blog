const path = require('path')
const Fs = require('fs')
const Path = path


console.log(path.resolve(__dirname, './components'), 'ath.resolve(__dirname, \'./components\')');

// 获取 文件 扩展名  如 .js
function getExtname (filePath) {
    return Path.extname(filePath)
}

function arrToObj (arr, toLowerCase = false) {
    const TargetObj = {}
    if (!Array.isArray(arr)) {
        return TargetObj
    }
    arr.forEach((item, index) => {
        let key = item
        if (toLowerCase) {
            key = (`${item}`).toLowerCase()
        }
        TargetObj[key] = index
    })

    return TargetObj
}

function eachDir (dir, callback, fileTypeArr = []) {
    if (!dir) {
        throw new Error('dir 必须')
    }
    const KeyObj = arrToObj(fileTypeArr)
    Fs.readdirSync(dir).forEach((file) => {
        const pathname = Path.join(dir, file)
        let FileInfo = null
        try {
            FileInfo = Fs.statSync(pathname)
        } catch (e) {
            return
        }
        if (FileInfo.isFile()) {
            const ext = getExtname(file)
            if (KeyObj[ext.toLowerCase()] >= 0) {
                callback(pathname, dir, file, ext, FileInfo)
            }
        }
    })
}

function getSidebarConf(path, txt) {
    const conf = {
        isGroup: true,
        text: txt,
        children: [
            // 'index.md',
            // 'vue2.md'
        ]
    }

    const children = []
    const preChildren = []
    const usePath = Path.resolve(__dirname, '../', path)
    eachDir(usePath, (pathname, dir, file, ext, fileInfo) => {
        if (file.startsWith('index')) {
            preChildren.unshift(file)
        } else {
            children.push({file, createTime: fileInfo.birthtime})
        }

    }, ['.md'])
    children.sort((l, r) => {
        if (l.createTime && r.createTime) {
            if (l.createTime > r.createTime) {
                return 1
            } else {
                return -1
            }
        } else {
            return 0
        }
    })
    conf.children = [...preChildren, ...children.map(item => item.file)]
    return conf
}


module.exports = {
    lang: 'zh-CN',
    title: '月剑风花的个人博客',
    description: '月剑风花的个人博客，记录自己的日常中的点点滴滴！',
    head: [
        ['link', { rel: 'icon', href: '/icon.ico' }]
    ],
    // git: {
    //     contributors: {
    //         name: '月剑风花'
    //     }
    // },
    plugins: [
        [
            '@vuepress/register-components',
            {
                componentsDir: path.resolve(__dirname, './components'),
            },
        ],
    ],
    markdown: {
        lineNumbers: false,
        importCode: {
            handleImportPath: (str) => {
                const v = {

                }
                const p = str.replace(/^@v/, path.resolve(__dirname))
                return p
            },
        },
    },
    themeConfig: {
        logo: '/icon.png',
        // lastUpdated: '最后更新', // string | boolean
        navbar: [
            { text: '主页', link: '/' },
            {
                text: '前端',
                children: [
                    { text: 'Vue', link: '/qd/vue/' },
                    { text: 'JS和TS', link: '/qd/js/' },
                    { text: '小程序', link: '/qd/miniProgram/' }
                ]
            },
            {
                text: '后端',
                children: [
                    { text: 'go', link: '/hd/go/' }
                ]
            },
            {
                text: '算法',
                link: '/sf/',
            },
            {
                text: '项目',
                link: '/project/',
            },
            { text: 'github', link: 'https://github.com/yjfhtop' }
        ],
        sidebar: {
            // 前端 vue
            // '/qd/vue/': [
            //     ['', 'Vue'],
            // ],
            '/qd/vue/': [
                // {
                //     isGroup: true,
                //     text: 'Vue',
                //     children: [
                //         'index.md',
                //         'vue2.md'
                //     ]
                // }
                getSidebarConf('qd/vue', 'VUE')
            ],

            // // 前端 js
            '/qd/js/': [
                getSidebarConf('qd/js', 'JS和TS')
                // {
                //     isGroup: true,
                //     text: 'Vue',
                //     children: [
                //         'README.md',
                //         '广度遍历.md'
                //     ]
                // }
            ],
            // // 前端 js
            // '/qd/miniProgram/': [
            //     ['', '小程序'],
            // ],
            //
            // // 后端go
            // '/hd/go/': [
            //     ['', 'go'],
            //     // ['test', 'go 的测试']
            // ]
            '/sf/': [
                getSidebarConf('sf', '算法')
            ],
            '/project/': [
                getSidebarConf('project', '项目（插件和库）')
            ]
        },
        sidebarDepth: 1,
        tip: '提示',
        warning: '警告',
        danger: '危险',
        notFound: ['没有找到本页面'],
        backToHome: '返回主页'
    }
}
