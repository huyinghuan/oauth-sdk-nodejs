## client SDK for oauth  github.com/huyinghuan/oauth

### SDK

```
new SDK(clientID, privateKey, oauthServer)
```

### sdk.getAuthorizedURL()

获取oauth认证地址。利用配置的回调地址获取 resource token

### sdk.requestResource(token, username, resource)

获取资源。 resource默认为 `account`, 获取登陆的用户名


### sdk.verify(path, method, username)

校验访问权限

## Example

示例见 https://github.com/huyinghuan/oauth-sdk-nodejs/master/example.js
