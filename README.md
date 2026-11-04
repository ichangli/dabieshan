# 大别山革命老区生态资源展示平台

[![Build and deploy demo](https://github.com/ichangli/dabieshan/actions/workflows/pages.yml/badge.svg)](https://github.com/ichangli/dabieshan/actions/workflows/pages.yml)

Vue 3、TypeScript、ArcGIS Maps SDK 与 Node.js 实现的 WebGIS 项目。提供 17 个区域的生态指标浏览、检索定位、专题着色、土地利用图层、二维码分享及 PDF 报告导出。

[在线演示](https://ichangli.github.io/dabieshan/) · [下载完整源码](https://github.com/ichangli/dabieshan/archive/refs/heads/main.zip) · [数据与依赖](docs/数据与依赖.md)

## 两种运行方式

| | 静态演示 | 完整本地版 |
|---|---|---|
| 登录 | 无需登录 | Node 校验密码与 Token，支持注销 |
| 区域 | 随项目提供的 GeoJSON | GeoServer WFS |
| 土地利用 | 306 张本地 PNG 瓦片 | GeoServer WMTS |
| 后端 | 无 | Node + 自行配置的 GeoServer |
| 底图 | 可配置 ArcGIS Key | 可配置 ArcGIS Key |

本项目定位为生态资源可视化作品。现有区域指标为项目数据快照，未在本次发布中独立核实来源年份与统计口径；不应作为现势官方统计或决策结论。土地利用图层目前用于显示，不包含实时面积计算或变化分析。

## 快速体验静态版

安装 Node.js 22.12+（推荐 24），在项目目录执行：

```sh
npm ci
npm run dev:demo
```

打开终端显示的地址，路径为 `/dabieshan/`。此模式不需要 Node 业务服务或 GeoServer。无需 Key 即可显示行政区与专题数据；ArcGIS 在线底图需按下文配置。

构建与预览：

```sh
npm run build:demo
npm run preview
```

访问预览地址的 `/dabieshan/`。不要双击 dist/index.html。

## 本地真实登录与地图服务

1. `npm ci` 安装前端依赖。
2. 复制 `server/.env.example` 为 `server/.env`，设置本机账号和密码。
3. 启动本机 GeoServer（默认 localhost:8080）。在 `tif` 工作区发布 17 个与 `src/composables/config.ts` 中 REGIONS 同名的区域 WFS 图层，以及 `tif:cutting` WMTS。区域属性字段见 `public/data/regions` 示例；原始栅格与 GeoServer 数据目录没有包含在本仓库，需要自行提供。
4. 执行 `npm run dev:full`，打开 Vite 输出的根地址。

也可以分别运行 `npm run server` 和 `npm run dev`。Node 仅使用内置模块，默认绑定 127.0.0.1:3200。未创建 server/.env 时，本机示例账号为 admin，密码为 change-me-locally。

请求链：浏览器 → Vite 开发代理 → Node（校验 Token）→ GeoServer。Node 不负责托管生产 dist；Vite 开发代理不会随构建产物发布。自行部署完整服务时需要配置同源静态托管与反向代理。

账号系统采用配置密码和内存会话，尚无用户注册、密码哈希、会话到期、限流或角色权限；Node 重启会清空会话。此实现供本地学习与联调，不是完整的公网账号系统。

## 配置 ArcGIS 底图

复制 `.env.example` 为 `.env.local`，填写 `VITE_ARCGIS_API_KEY`，重启 Vite。申请 ArcGIS Location Platform 的 Basemap styles service 权限，并限制允许的来源。当前提供浅灰底图与卫星影像。

Pages 使用仓库 Actions Secret `ARCGIS_API_KEY`。Key 不提交到源码，但 Vite 的浏览器 Key 会进入最终前端产物，应设置来源限制并按服务商规则管理配额和有效期。未配置时显示本地专题底板。

`VITE_GEOSERVER_BASE` 默认留空，通过 Node 代理访问；自行填写远程 GeoServer 地址会绕过本机 Node 代理，请明确其认证方式和 CORS 配置。

## GitHub Pages

仓库完整保留 src、server、scripts 与 public。Actions 运行类型检查并构建 demo，仅将 dist 发布到 Pages；不发布 Node 服务。Pages Source 应为 GitHub Actions。

演示路径目前固定 `/dabieshan/`，修改仓库名时需同步修改 vite.config.ts。演示使用 hash 路由，支持刷新。

## 目录

- `src/`：Vue 界面、地图、专题、报告与登录逻辑。
- `server/`：Node 登录、会话校验、注销和 GeoServer 代理。
- `public/data/regions/`：17 个区域 GeoJSON 快照。
- `public/tiles/cutting/`：0–10 级土地利用瓦片，放大或移出覆盖范围可能没有影像。
- `scripts/`：从本机 GeoServer 导出区域数据和瓦片的工具。
- `.github/workflows/`：构建与 Pages 发布配置。

## 验证与使用范围

`npm run type-check` 检查类型；`npm run build:demo` 生成静态版；`npm run build` 生成完整模式前端。构建成功不等于原始 GeoServer 图层已配置或数据准确性已经验证。

源码公开供浏览与学习，目前未另行指定本项目代码的开源授权许可。第三方依赖及数据按各自许可使用，参见数据与依赖说明。
