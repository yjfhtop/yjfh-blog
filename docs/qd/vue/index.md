# Vue

### 你好，Vue！

```vue
<template>
    <div>
        {{ v }}
    </div>
</template>

<script>
export default {
    name: "index",
    data() {
        return {
            v: 'Hello world!'
        }
    }
}
</script>
```