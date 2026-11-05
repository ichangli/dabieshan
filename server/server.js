import http from 'node:http'
import { randomUUID } from 'node:crypto'

const ACCOUNTS = Object.freeze({
    [process.env.ADMIN_ACCOUNT || 'admin']: process.env.ADMIN_PASSWORD || '123456'
})
const geoserverHost = process.env.GEOSERVER_HOST || 'localhost'
const geoserverPort = Number(process.env.GEOSERVER_PORT || 8080)
const sessions = new Map()

function sendJson(res, status, data) {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(data))
}

function readBody(req, callback) {
    let text = ''
    req.setEncoding('utf8')
    req.on('data', chunk => {
        text += chunk
    })
    req.on('end', () => {
        callback(text)
    })
}

function getToken(req) {
    const auth = req.headers.authorization || ''
    return auth.replace('Bearer ', '')
}

function proxyToGeoServer(req, res) {
    const headers = { ...req.headers }
    delete headers.authorization
    headers.host = `${geoserverHost}:${geoserverPort}`

    const upstream = http.request(
        { host: geoserverHost, port: geoserverPort, path: req.url, method: req.method, headers },
        upstreamRes => {
            res.writeHead(upstreamRes.statusCode, upstreamRes.headers)
            upstreamRes.pipe(res)
        }
    )
    upstream.on('error', () => {
        if (!res.headersSent) {
            sendJson(res, 502, { message: 'GeoServer 不可用' })
        } else {
            res.destroy()
        }
    })
    req.pipe(upstream)
}

const server = http.createServer((req, res) => {
    res.setHeader(
        'Access-Control-Allow-Origin',
        'https://ichangli.github.io'
    )
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
        res.statusCode = 204
        res.end()
        return
    }

    console.log('收到请求：', req.method, req.url)

    if (req.url.startsWith('/geoserver/')) {
        if (!sessions.get(getToken(req))) {
            sendJson(res, 401, { message: '未登录' })
            return
        }
        proxyToGeoServer(req, res)
        return
    }

    if (req.method === 'GET' && req.url === '/api/hello') {
        sendJson(res, 200, { message: '你好，我是后端' })
        return
    }

    if (req.method === 'POST' && req.url === '/api/login') {
        readBody(req, text => {
            let body
            try {
                body = JSON.parse(text)
            } catch (err) {
                sendJson(res, 400, { message: '请求格式错误' })
                return
            }

            if (!body || typeof body.account !== 'string' || typeof body.password !== 'string') {
                sendJson(res, 400, { message: '请求格式错误' })
                return
            }

            if (Object.hasOwn(ACCOUNTS, body.account) && ACCOUNTS[body.account] === body.password) {
                const token = randomUUID()
                sessions.set(token, body.account)
                sendJson(res, 200, { message: '登录成功', token })
            } else {
                sendJson(res, 401, { message: '账号或密码错误' })
            }
        })
        return
    }

    if (req.method === 'GET' && req.url === '/api/me') {
        const token = getToken(req)
        const account = sessions.get(token)
        if (account) {
            sendJson(res, 200, { account })
        } else {
            sendJson(res, 401, { message: '未登录' })
        }
        return
    }

    if (req.method === 'POST' && req.url === '/api/logout') {
        const token = getToken(req)
        sessions.delete(token)
        res.statusCode = 204
        res.end()
        return
    }

    sendJson(res, 404, { message: '没有这个接口' })
})

server.listen(Number(process.env.PORT || 3200), '127.0.0.1', () => {
    console.log('后端已启动：http://localhost:3200')
})