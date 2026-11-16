import {dirname, relative, resolve} from 'path'
import type {ConfigEnv, UserConfig} from 'vite'
import {loadEnv, normalizePath} from 'vite'
import {createVitePlugins} from './build/vite'
import {exclude, include} from "./build/vite/optimize"
// 当前执行node命令时文件夹的地址(工作目录)
const root = process.cwd()

// 路径查找
function pathResolve(dir: string) {
    return resolve(root, '.', dir)
}

function getRelativeScssUsePath(filename: string, targetPath: string) {
    const cleanFilename = filename.split('?')[0]
    const relativePath = normalizePath(relative(dirname(cleanFilename), targetPath))
    return relativePath.startsWith('.') ? relativePath : `./${relativePath}`
}

// https://vitejs.dev/config/
export default ({command, mode}: ConfigEnv): UserConfig => {
    let env = {} as any
    const isBuild = command === 'build'
    if (!isBuild) {
        env = loadEnv((process.argv[3] === '--mode' ? process.argv[4] : process.argv[3]), root)
    } else {
        env = loadEnv(mode, root)
    }
    const variablesScssPath = pathResolve('src/styles/variables.scss')
    return {
        base: env.VITE_BASE_PATH,
        root: root,
        // 服务端渲染
        server: {
            port: env.VITE_PORT, // 端口号
            host: "0.0.0.0",
            // 允许通过 Tailscale 地址（tom.tailec9db2.ts.net）访问开发服务器；默认只允许 localhost
            allowedHosts: ['tom.tailec9db2.ts.net'],
            open: env.VITE_OPEN === 'true',
            // 本地跨域代理：前端 API 改走相对路径（.env.env.local 的 VITE_BASE_URL 置空）后，
            // /admin-api 请求由 Vite 在服务端转发到本机后端。浏览器只跟 Vite 同源通信，
            // 这样经 Tailscale 地址（https）在手机/其它设备上打开时，API 也能通，
            // 不再被浏览器的混合内容 / 本机网络访问限制拦截。
            // 注意：不做 rewrite —— 后端接口本身就带 /admin-api 前缀。
            proxy: {
                ['/admin-api']: {
                    target: 'http://localhost:48080',
                    ws: true,
                    changeOrigin: true,
                },
            },
        },
        // 项目使用的vite插件。 单独提取到build/vite/plugin中管理
        plugins: createVitePlugins(isBuild, env),
        css: {
            lightningcss: {
                // Preserve legacy star-hack declarations by stripping invalid syntax during minification.
                errorRecovery: true
            },
            preprocessorOptions: {
                scss: {
                    additionalData: (source: string, filename: string) => {
                        const normalizedFilename = normalizePath(filename)
                        // Windows 下更容易触发重复注入：定义或显式转导变量的文件，不能再次注入同一个
                        // `@use ... as *`，否则 Sass 会报 duplicate global variables。
                        if (
                            normalizedFilename.endsWith('/src/styles/variables.scss') ||
                            normalizedFilename.endsWith('/src/styles/global.module.scss')
                        ) {
                            return source
                        }
                        return `@use "${getRelativeScssUsePath(filename, variablesScssPath)}" as *;\n${source}`
                    },
                    api: 'modern-compiler'
                }
            }
        },
        resolve: {
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.scss', '.css'],
            alias: [
                {
                    find: /\@\//,
                    replacement: `${pathResolve('src')}/`
                }
            ]
        },
        build: {
            chunkSizeWarningLimit: 2000,
            minify: 'oxc',
            outDir: env.VITE_OUT_DIR || 'dist',
            reportCompressedSize: false,
            sourcemap: env.VITE_SOURCEMAP === 'true' ? 'inline' : false,
            rollupOptions: {
                output: {
                    minify: {
                        compress: {
                            dropDebugger: env.VITE_DROP_DEBUGGER === 'true',
                            dropConsole: env.VITE_DROP_CONSOLE === 'true'
                        }
                    },
                    codeSplitting: {
                        groups: [
                            { name: 'echarts', test: /node_modules[\\/]echarts[\\/]/ }, // 将 echarts 单独打包，参考 https://gitee.com/yudaocode/yudao-ui-admin-vue3/issues/IAB1SX 讨论
                            { name: 'form-create', test: /node_modules[\\/]@form-create[\\/]element-ui[\\/]/ }, // 参考 https://github.com/yudaocode/yudao-ui-admin-vue3/issues/148 讨论
                            { name: 'form-designer', test: /node_modules[\\/]@form-create[\\/]designer[\\/]/ }
                        ]
                    }
                },
            },
        },
        optimizeDeps: {include, exclude}
    }
}
