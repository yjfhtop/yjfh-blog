const path = require('path')


console.log(path.resolve(__dirname, './components'), 'ath.resolve(__dirname, \'./components\')');

module.exports = {
    lang: 'zh-CN',
    title: '月剑风花的个人博客',
    description: '月剑风花的个人博客，记录自己的日常中的点点滴滴！',
    head: [
        ['link', { rel: 'icon', href: '/icon.png' }]
    ],
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
                    { text: 'JS', link: '/qd/js/' },
                    { text: '小程序', link: '/qd/miniProgram/' }
                ]
            },
            {
                text: '后端',
                children: [
                    { text: 'go', link: '/hd/go/' }
                ]
            },
            { text: 'github', link: 'https://github.com/yjfhtop' }
        ],
        sidebar: {
            // 前端 vue
            // '/qd/vue/': [
            //     ['', 'Vue'],
            // ],
            '/qd/vue/': [
                {
                    isGroup: true,
                    text: 'Vue',
                    children: [
                        'index.md',
                        'vue2.md'
                    ]
                }
            ],

            // // 前端 js
            // '/qd/js/': [
            //     ['', 'Js'],
            // ],
            //
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
        },
        sidebarDepth: 2,
        tip: '提示',
        warning: '警告',
        danger: '危险',
        notFound: ['没有找到本页面'],
        backToHome: '返回主页'
    }
}
