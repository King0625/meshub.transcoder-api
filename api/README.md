# Meshub API Doc（v2）
> 此文件僅列出修改過的 API，其餘則與當初一樣

## 注意事項
1. 由於業主那邊想把原專案先保留下來，所以 baseUrl 會跟前端專案有點不一樣，測試之前記得修改
2. 雖然 API 支援多個解析度轉檔，不過目前前端的需求依舊是維持單一解析度
3. API token 用範例的就可以了 ( iA9Ra0pB )


## 影音轉檔 API

### POST /v2/api/transcode/job

為了因應多個解析度的功能，form data 會以 array 的方式存在 data key 中，並且需要帶 X-MESHUB-TRANSCODER-API-TOKEN ( 會由 admin user 透過 line or email 寄過去 )

request:

- body

> meshubNumber 為 0 時，server 會自動分割任務給所有 meshub 機器

example1:
```json
{
   "transcode_job":{
      "sourceUrl":"https://torii-demo.meshub.io/v2/test.mp4",
      "job_type": "transcode"
      "meshubNumbers":0,
      "previewFromSec": 21,
      "previewToSec": 60
   },
   "resolutions":[
      {
         "paramBitrate":"1000000",
         "paramCrf":"23",
         "paramPreset":"ultrafast",
         "paramResolutionWidth":"1280",
         "paramResolutionHeight":"720"
      }
   ]
}
```

example2:

```json
{
   "transcode_job":{
      "sourceUrl":"https://torii-demo.meshub.io/v2/test.mp4",
      "imageSourceUrl": "https://cdn.jpegmini.com/user/images/slider_puffin_jpegmini_mobile.jpg"
      "job_type": "merge"
      "meshubNumbers":0,
      "previewFromSec": 21,
      "previewToSec": 60
   },
   "resolutions":[
      {
         "paramBitrate":"1000000",
         "paramCrf":"23",
         "paramPreset":"ultrafast",
         "paramResolutionWidth":"1280",
         "paramResolutionHeight":"720"
      }
   ]
}
```

- header

```json
{ "X-MESHUB-TRANSCODER-API-TOKEN":"iA9Ra0pB" }
```
response (200): 
```json
{
   "sourceUrl":"https://torii-demo.meshub.io/v2/test.mp4",
   "jobs":[
      {
         "paramCrf":"23",
         "paramBitrate":"1000000",
         "paramPreset":"ultrafast",
         "paramResolutionWidth":"1280",
         "paramResolutionHeight":"720",
         "uuid":"079b96d8-3f42-4f62-97eb-307612475d84"
      },
      {
         "paramCrf":"23",
         "paramBitrate":"5000000",
         "paramPreset":"ultrafast",
         "paramResolutionWidth":"1920",
         "paramResolutionHeight":"1080",
         "uuid":"194e9f44-4784-46f5-a309-7f11badcb033"
      }
   ]
}

```

> P.S. 如果沒有任何meshub機器存活的狀況下 ( 雖然這是極端狀況，但以防萬一，還是列了出來 ):

response(200):
```json
{
    "message": "No meshubs alive now!!!!"
}
```

- response(400)
*當 job_type 為 merge 時沒提供 imageSourceUrl*

```json
{
  "error": "You have to provide imageSourceUrl when job_type is merge"
}
```

- response(400)
*當 previewFromSec 和 previewToSec 這兩個參數中缺了一個*
```json
{
  "error": "You missed previewToSec or previewFromSec"
}
```

- response(400) 
*當 previewFromSec < 0 或 previewToSec < 0 或 previewToSec - previewFromSec <= 0 時*
```json
{
  "error": "invalid preview data"
}
```

- response(400)
*無法測出影片網址的長度時*
```json
{
  "error": "unable to probe duration of given url {URL}"
}
```
### [前端] GET /v2/api/transcode/job?uuids[]={uuid}&

這支前端發的 API 與原本的相同，不過多個解析度的功能會產生多個 uuid 的 job，所以 query string 會以 array 傳值

request:

- queryString
```json
{
    "uuids[]": "3e07e4f7-c7c5-426b-b24b-40aed2129773",
    "uuids[]": "a9f45a99-220b-4355-bfa7-058e3a125b84"
}
```


response (200):

```json
{
  "jobs": [
    {
      "sourceUrl": "https://torii-demo.meshub.io/test.mp4",
      "meshubNumbers": 2,
      "paramBitrate": 1000000,
      "paramCrf": 23,
      "paramPreset": "ultrafast",
      "paramResolutionWidth": 1280,
      "paramResolutionHeight": 720,
      "uuid": "3e07e4f7-c7c5-426b-b24b-40aed2129773",
      "overall_progress": 100,
      "result_mp4": "https://torii-demo.meshub.io/9fvje.mp4",
      "splitJobs": [
        {
          "sourceUrl": "https://torii-demo.meshub.io/test.mp4",
          "paramBitrate": 1000000,
          "paramCrf": 23,
          "paramPreset": "ultrafast",
          "paramResolutionWidth": 1280,
          "paramResolutionHeight": 720,
          "uuid": "3e07e4f7-c7c5-426b-b24b-40aed2129773",
          "paramSeekBeginSec": 0,
          "paramSeekEndSec": 40,
          "progress": 10,
          "uploadFileName": "3e07e4f7-c7c5-426b-b24b-40aed2129773-0.mp4"
        },
        {
          "sourceUrl": "https://torii-demo.meshub.io/test.mp4",
          "paramBitrate": 1000000,
          "paramCrf": 23,
          "paramPreset": "ultrafast",
          "paramResolutionWidth": 1280,
          "paramResolutionHeight": 720,
          "uuid": "3e07e4f7-c7c5-426b-b24b-40aed2129773",
          "paramSeekBeginSec": 40,
          "paramSeekEndSec": 80,
          "progress": 0,
          "uploadFileName": "3e07e4f7-c7c5-426b-b24b-40aed2129773-1.mp4"
        }
      ]
    },
    {
      "sourceUrl": "https://torii-demo.meshub.io/test.mp4",
      "meshubNumbers": 2,
      "paramBitrate": 5000000,
      "paramCrf": 23,
      "paramPreset": "ultrafast",
      "paramResolutionWidth": 1920,
      "paramResolutionHeight": 1080,
      "uuid": "a9f45a99-220b-4355-bfa7-058e3a125b84",
      "overall_progress": 0,
      "splitJobs": [
        {
          "sourceUrl": "https://torii-demo.meshub.io/test.mp4",
          "paramBitrate": 5000000,
          "paramCrf": 23,
          "paramPreset": "ultrafast",
          "paramResolutionWidth": 1920,
          "paramResolutionHeight": 1080,
          "uuid": "a9f45a99-220b-4355-bfa7-058e3a125b84",
          "paramSeekBeginSec": 0,
          "paramSeekEndSec": 40,
          "progress": 0,
          "uploadFileName": "a9f45a99-220b-4355-bfa7-058e3a125b84-0.mp4"
        },
        {
          "sourceUrl": "https://torii-demo.meshub.io/test.mp4",
          "paramBitrate": 5000000,
          "paramCrf": 23,
          "paramPreset": "ultrafast",
          "paramResolutionWidth": 1920,
          "paramResolutionHeight": 1080,
          "uuid": "a9f45a99-220b-4355-bfa7-058e3a125b84",
          "paramSeekBeginSec": 40,
          "paramSeekEndSec": 80,
          "progress": 0,
          "uploadFileName": "a9f45a99-220b-4355-bfa7-058e3a125b84-1.mp4"
        }
      ]
    }
  ]
}
```

- 若uuid都沒有資料:
```json
{
    "jobs": []
}
```


### [前端] POST /v2/api/transcode/remove_mp4

API user 會傳 uuid 到 form data，將該 uuid 匹配到的 mp4 檔案做刪除的動作

request
- body
```json
{ "uuid": "079b96d8-3f42-4f62-97eb-307612475d84" }
```
- header

```json
{ "X-MESHUB-TRANSCODER-API-TOKEN": "iA9Ra0pB" }
```

response:
- success (200):

```json
{
    "error": false,
    "uuid": "079b96d8-3f42-4f62-97eb-307612475d84",
    "message": "Delete nmfi8s.mp4' successfully."
}
```
- failed (404):
```json
{
    "error": true,
    "message": "uuid not found"
}
```


### GET /v2/api/transcode/job_meshub

在多個解析度的功能下，會由 db 安排 job queue ，所以 meshub 只會先取得第一個任務，等該任務結束後會繼續從 DB 撈新任務

response(ex: clientIp=119.247.119.29): 

```json
{
    "sourceUrl": "https://torii-demo.meshub.io/test.mp4",
    "paramBitrate": 1000000,
    "paramCrf": "23",
    "paramPreset": "ultrafast",
    "paramResolutionWidth": "1280",
    "paramResolutionHeight": "720",
    "uuid": "079b96d8-3f42-4f62-97eb-307612475d84",
    "paramSeekBeginSec": 0,
    "paramSeekEndSec": 40,
    "meshubId": "119.247.119.29",
    "progress": 0,
    "uploadFileName": "079b96d8-3f42-4f62-97eb-307612475d84-0.mp4"
}
```

### POST /v2/api/transcode/job_meshub_progress


request:
- body
```json
{ "uuid": "079b96d8-3f42-4f62-97eb-307612475d84"}
```

response(200): 成功（ 沒有 response body ）

response(400): request body 沒有帶 uuid
```json
{ "error": "job uuid not found in request body" }
```
response(404): 沒有找到該 uuid 的 job
```json
{ "error": "job with uuid not found: 079b96d8-3f42-4f62-97eb-307612475d84" }
```

## 帳號管理 API
P.S. 部署後會先在 db 手動新增 admin account

**這組 API 只有 admin user 可以使用**

### GET /v2/api/account/

request: 
- header

```json
{ "X-MESHUB-TRANSCODER-API-TOKEN":"iA9Ra0pB" }
```

response:

- 成功(200)

```json
{
  "accounts": [
    {
      "time_create": "2020-09-04T04:56:19.981Z",
      "time_use": "2020-09-04T05:38:05.226Z",
      "account": "admin",
      "token": "iA9Ra0pB"
    },
    {
      "time_create": "2020-09-04T04:56:19.981Z",
      "time_use": "2020-09-04T04:56:19.981Z",
      "account": "admin1",
      "token": "x3m0gNB1"
    }
  ]
}

```
- 驗證失敗(403) -- 找不到帳號或者帳號非 admin

```json
{
    "message": "Request forbidden"
}
```


### GET /v2/api/account/{account}

request: 
- header

```json
{ "X-MESHUB-TRANSCODER-API-TOKEN":"iA9Ra0pB" }
```

response:

- 成功(200)
```json
{
  "account": {
    "time_create": "2020-09-04T04:56:19.981Z",
    "time_use": "2020-09-04T05:43:32.566Z",
    "account": "admin",
    "token": "iA9Ra0pB",
  }
}
```

- 失敗(404) -- 無 response


### POST /v2/api/account/{account}

- 成功(200)
```json
{
  "message": "Account created successfully",
  "account": {
    "time_create": "2020-09-04T05:43:19.932Z",
    "time_use": "2020-09-04T05:54:11.142Z",
    "account": "admin1",
    "token": "aAS12dpF",
  }
}
```

- 失敗(409) 

```json
{
    "message": "Account already in use!"
}
```


### DELETE /v2/api/account/{account}

- 成功(200)
```json
{
    "message": "Account deleted successfully."
}
```

- 失敗(404) -- 無 response
