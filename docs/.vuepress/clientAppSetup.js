import { defineClientAppEnhance } from '@vuepress/client'
import MyCom from './components/MyCom'

export default defineClientAppEnhance(({ app, router, siteData }) => {
    app.component('MyCom', MyCom)
})
