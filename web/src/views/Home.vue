<template>
  <div class="home">
    <img class="logo" src="https://meshub.io/assets/img/meshub-logo.png" alt="logo">
    <div class="transcoding-container">
      <p class="title">
        Transcoding
      </p>
      <div class="parameter-block">
        <p>Parameter</p>
        <el-form label-width="80px">
          <el-form-item label="Token">
            <el-input v-model="token"></el-input>
          </el-form-item>
        </el-form>
        <el-form ref="form" :model="q" label-width="80px">
          <el-form-item label="Video Url">
            <el-input v-model="sourceUrl"></el-input>
          </el-form-item>
          <el-form-item label="Bitrate">
            <el-select v-model="q.paramBitrate" style="width: 100%;">
              <el-option
                label="1 Mbps"
                :value="1000000">
              </el-option>
              <el-option
                label="5 Mbps"
                :value="5000000">
              </el-option>
              <el-option
                label="10 Mbps"
                :value="10000000">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Crf">
            <el-select v-model="q.paramCrf" style="width: 100%;">
              <el-option
                label="23"
                value="23">
              </el-option>
              <el-option
                label="40"
                value="40">
              </el-option>
              <el-option
                label="51"
                value="51">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Resolution">
            <el-select v-model="q.resolution" style="width: 100%;">
              <el-option
                label="1080P"
                value="1080P">
              </el-option>
              <el-option
                label="720P"
                value="720P">
              </el-option>
              <el-option
                label="360P"
                value="360P">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Numbers">
            <el-select v-model="meshubNumbers" style="width: 100%;">
              <el-option
                v-for="member in 8"
                :label="member"
                :value="member">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Profile">
            <el-select v-model="q.paramProfile" style="width: 100%;">
              <el-option
                label="ultrafast"
                value="ultrafast">
              </el-option>
              <el-option
                label="fast"
                value="fast">
              </el-option>
              <el-option
                label="medium"
                value="medium">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Job ID" v-if="uuid">
            <el-input v-model="uuid" readonly></el-input>
          </el-form-item>
        </el-form>
      </div>
      <el-button :type="isTranscoding ? 'info' : 'danger'" :disabled="isTranscoding" @click="transcoding()">Start Transcode</el-button>
      <p v-if="isTranscoding">Status: {{ status }}</p>
      <div class="transcoding-block">
        <div class="transcoding-progress">
          <el-progress :text-inside="true" :stroke-width="26" :percentage="progress" :status="progress === 100 ? 'success' : ''"></el-progress>
          <p v-if="progress === 100" class="transcoding-message">Total time spent transcoding (pending: {{ spentTime.pending }} , transcoding: {{ spentTime.transcoding }}, uploading: {{ spentTime.uploading }}, merging: {{ spentTime.merging }}, finished: {{ spentTime.finished }}.)</p>
        </div>
      </div>
    </div>

    <p v-if="fileUrl">File URL: {{ fileUrl }}</p>
    <div class="remove-video-block">
      <el-input v-model="removeUUID"></el-input>
      <el-button type="danger" @click="removeVideo">Remove</el-button>
    </div>

    <div v-show="dialogVisible" class="video-popup-bg" @click.self="dialogVisible = false">
      <div class="video-popup">
        <i class="el-icon-close" @click="dialogVisible = false"></i>
        <video id="myVideo"
          v-if="dialogVisible"
          ref="video"
          controls
          autoplay
          playsinline
          preload="auto">
          <source :src="result_url">
        </video> 
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  name: 'Home',
  data() {
    return {
      token: null,
      sourceUrl: 'https://torii-demo.meshub.io/test.mp4',
      meshubNumbers: 2,
      q: {
        paramBitrate: 1000000,
        paramCrf: 23,
        paramResolutionWidth: null,
        paramResolutionHeight: null,
        paramProfile: "ultrafast",
        resolution: '720P'
      },
      resolutionMap: {
        '1080P': {
          width: 1920,
          height: 1080
        },
        '720P': {
          width: 1280,
          height: 720
        },
        '360P': {
          width: 640,
          height: 360
        }
      },
      result_url: null,
      progress: 0,
      timer: null,
      time: 0,
      dialogVisible: false,
      isFirstPlay: true,
      isTranscoding: false,
      uuid: null,
      removeUUID: null,
      fileUrl: null,
      spentTime: {
        pending: 0,
        transcoding: 0,
        uploading: 0,
        merging: 0,
        finished: 0
      },
      status: null
    }
  },
  watch: {
    dialogVisible(newValue, oldValue) {
      if(newValue === false) {
        this.result_url = null
      }
    }
  },
  methods: {
    transcoding() {
      if(this.q.sourceUrl === null) {
        this.$message({
          message: 'Please type your video url~',
          type: 'warning'
        });
        return
      }
      if(this.token === null) {
        this.$message({
          message: 'invalid token',
          type: 'error'
        });
        return
      }
      this.isTranscoding = true
      this.progress = 0
      this.time = 0
      this.removeUUID = null
      this.status = null
      this.q.paramResolutionWidth = this.resolutionMap[this.q.resolution].width
      this.q.paramResolutionHeight = this.resolutionMap[this.q.resolution].height
      axios({
        method: 'post',
        url: 'https://torii-demo.meshub.io/v2/api/transcode/job',
        headers: {
          'X-MESHUB-TRANSCODER-API-TOKEN': this.token
        },
        data: {
          transcode_job: {
            sourceUrl: this.sourceUrl,
            meshubNumbers: this.meshubNumbers
          },
          resolutions: [this.q]
        }
      }).then(res => {
        this.uuid = res.data.jobs[0].uuid
        this.timer = setInterval(() => {
          this.getProgress(res.data.jobs[0].uuid)
        }, 2000)
      }).catch(error => {
        this.$message({
          message: error.response.data.message,
          type: 'error'
        });
        return
      })
    },
    getProgress(uuid) {
      axios({
        method: 'get',
        url: `https://torii-demo.meshub.io/v2/api/transcode/job?uuids[]=${uuid}`,
        headers: {
          'X-MESHUB-TRANSCODER-API-TOKEN': this.token
        }
      }).then(res => {
        this.time = this.time + 2
        this.progress = res.data.jobs[0].overall_progress
        this.spentTime[res.data.jobs[0].status] = this.spentTime[res.data.jobs[0].status] + 2
        this.status = res.data.jobs[0].status
        if(this.progress === 100) {
          this.removeUUID = uuid
          clearInterval(this.timer)
          this.$message({
            message: 'Transcoding success!!',
            type: 'success'
          });
          this.dialogVisible = true
          this.result_url = res.data.jobs[0].result_mp4
          this.fileUrl = res.data.jobs[0].result_mp4
          if(!this.isFirstPlay) {
            setTimeout(() => {
              this.$refs.video.load()
            }, 500)
          }
          this.isFirstPlay = !this.isFirstPlay
          this.isTranscoding = false
        }
      })
    },
    removeVideo() {
      axios({
        method: 'post',
        url: `https://torii-demo.meshub.io/v2/api/transcode/remove_mp4`,
        headers: {
          'X-MESHUB-TRANSCODER-API-TOKEN': this.token
        },
        data: {
          uuid: this.removeUUID
        }
      }).then(res => {
        this.removeUUID = null
        this.$message({
          message: res.data.message,
          type: 'success'
        });
      })
    }
  }
}
</script>
<style lang="scss" scpoed>
  .home {
    max-width: 800px;
    margin: 0 auto;
    .logo {
      width: 300px;
      max-width: 80%;
    }
    .transcoding-container {
      border: 2px solid #ee5e5b;
      border-radius: 5px;
      .title {
        background-color: #ee5e5b;
        color: #fff;
        font-weight: 700;
        padding: 15px;
        margin: 0;
        font-size: 24px;
      }
      .parameter-block {
        padding: 25px;
      }
      .transcoding-block {
        padding: 25px;
      }
    }
    .video-popup-bg {
      position: fixed;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, .1);
      left: 0;
      top: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      .video-popup {
        position: relative;
        max-width: 95%;
        width: 800px;
        height: 450px;
        border-radius: 5px;
        overflow: hidden;
        i {
          position: absolute;
          color: #fff;
          top: 10px;
          right: 10px;
          z-index: 99;
          cursor: pointer;
          font-size: 24px;
        }
        video {
          width: 100%;
          height: 100%;
        }
        @media only screen and (max-width: 992px) {
          width: 600px;
          height: 337.5px;
        }
        @media only screen and (max-width: 768px) {
          width: 400px;
          height: 225px;
        }
        @media only screen and (max-width: 375px) {
          width: 400px;
          height: 200px;
        }
      }
    }
  }
  .remove-video-block {
    padding: 20px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    button {
      margin-left: 10px;
    }
  }
</style>
