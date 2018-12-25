const http = require('http')
const url = require('url')
const querystring = require('querystring')
const SDK = require('./index.js')
var mockSession = {}

var sdk = new SDK("jGZXZwCHSP5MCPLbuvlK3RRf", "SZd25NISWkGSlVYkCj4T56qR", "http://127.0.0.1:8000")

http.createServer(async (request, response)=>{

   let rURL = url.parse(request.url)
   let query = querystring.parse(rURL.query)
   response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
   response.setHeader("Pragma", "no-cache")
   response.setHeader("Expires", "0")

   switch(rURL.pathname){
    case "/favicon.ico":
        response.statusCode = 404
        response.end()
        break
    case "/":
        if(mockSession.username){
            response.end(mockSession.username)
            return
        }
        response.statusCode = 301
        console.log(sdk.getAuthorizedURL())
        response.setHeader("Location", sdk.getAuthorizedURL())
        response.end()
        break
    case "/auth":
        let token = query.token
        let body = await sdk.requestResource(token, "", "account")
        mockSession.username = body
        response.end(body)
        break
    default:
        if(!mockSession.username){
            response.statusCode = 301
            response.setHeader("Location", sdk.getAuthorizedURL())
            response.end()
            return
        }
        let result =  await sdk.verify(rURL.pathname, request.method, mockSession.username)
        console.log(rURL.pathname, result)
        response.end(JSON.stringify(result))
   }


}).listen(8080)