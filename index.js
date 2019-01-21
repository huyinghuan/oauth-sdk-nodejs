
const http = require('http')
const https = require('https')
const url = require('url')
const encrypt = require('./encrypt')
class SDK {
    
    /**
     * 
     * @param {string} clientID 
     * @param {string} privateKey 
     * @param {string} oauthServer 
     */
    constructor(clientID, privateKey, oauthServer){
        this.clientID = clientID
        this.privateKey = privateKey
        this.oauthServer =  url.parse(oauthServer)
    }
    /**
     * 获取oauth server 认证地址，用于获取resource token
     */
    getAuthorizedURL(){
        return `${this.oauthServer.href}authorize?client_id=${this.clientID}&t=${parseInt(Date.now()/1000)}`
    }
    verityTimestamp(timestamp) {
        return Math.abs(timestamp-parseInt(Date.now()/1000)) < 5*60
    }
    /**
     * 获取用户名
     * @param {string} token 
     * @param {string} username 
     */
    requestResource(token, username, soureType = "account"){

        var body = JSON.stringify({
            timestamp: parseInt(Date.now()/1000),
            token: token
        })

        body = encrypt.encryptText(this.privateKey, body)

        let httpClient = http

        if (this.oauthServer.protocol == "https:"){
            httpClient = https
        }

        return new Promise((resovle, reject)=>{
            var request = httpClient.request({
                protocol: this.oauthServer.protocol,
                hostname: this.oauthServer.hostname,
                port: this.oauthServer.port,
                path: `/resource/`+soureType,
                method: "POST",
                headers: {
                    "Content-Length": Buffer.byteLength(body),
                    "client-id": this.clientID,
                    "account": username,
                }
            }, (response)=>{
                let respBody = ""
                response.on('data', (chunk)=> {
                    respBody = respBody+chunk
                });
                response.on("end", ()=>{
                    if(response.statusCode != 200){
                        return reject(`Get Statsu code:${response.statusCode} msg: ${respBody}`)
                    }
                    respBody = encrypt.decryptText(this.privateKey, respBody)
                    try{
                        respBody = JSON.parse(respBody)
                        if(!this.verityTimestamp(respBody.timestamp)){
                            return reject("数据时间戳校验失败")
                        }
                        resovle(respBody.username)
                    }catch(e){
                        reject(e)
                    }
                })
                
            })
            request.on("error", (e)=>{
                reject(e)
            })
            request.end(body)
        })
    }
    /**
     * 
     * @param {string} path 
     * @param {string} method 
     * @param {string} username 
     */
    verify(path, method, username){
        let scope = {
            name: path,
            type: method
        }
        scope = JSON.stringify(scope)

        scope = encrypt.encryptText(this.privateKey, scope)


        let httpClient = http

        if (this.oauthServer.protocol == "https:"){
            httpClient = https
        }

        return new Promise((resovle, reject)=>{
            var request = httpClient.request({
                protocol: this.oauthServer.protocol,
                hostname: this.oauthServer.hostname,
                port: this.oauthServer.port,
                path: "/authorize",
                method: "POST",
                headers: {
                    "Content-Length": Buffer.byteLength(scope),
                    "client-id": this.clientID,
                    "account": username,
                }
            }, (response)=>{
                let respBody = ""
                if(response.statusCode != 200){
                    return resovle({
                        statusCode: response.statusCode
                    })
                }
                response.on('data', (chunk)=>{
                    respBody = respBody+chunk
                });
                response.on("end", ()=>{
                    respBody = encrypt.decryptText(this.privateKey, respBody)
                    try{
                        respBody = JSON.parse(respBody)
                        if(!this.verityTimestamp(respBody.timestamp)){
                            return reject("数据时间戳校验失败")
                        }
                        resovle({
                            statusCode: response.statusCode,
                            scope: respBody.scope
                        })
                    }catch(e){
                        reject(e)
                    }
                })
            })
            request.on("error", (e)=>{
                reject(e)
            })
            request.end(scope)
        })

    }
}

module.exports = SDK