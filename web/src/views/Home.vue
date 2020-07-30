<template>
  <div class="home">
    <img class="logo" src="https://meshub.io/assets/img/meshub-logo.png" alt="logo">
    <div class="transcoding-container">
      <p class="title">
        Transcoding
      </p>
      <div class="parameter-block">
        <p>Parameter</p>
        <el-form ref="form" :model="q" label-width="80px">
          <el-form-item label="Video Url">
            <el-input v-model="q.sourceUrl"></el-input>
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
            <el-select v-model="q.meshubNumbers" style="width: 100%;">
              <el-option
                label="1"
                value="1">
              </el-option>
              <el-option
                label="2"
                value="2">
              </el-option>
              <el-option
                label="3"
                value="3">
              </el-option>
              <el-option
                label="4"
                value="4">
              </el-option>
              <el-option
                label="5"
                value="5">
              </el-option>
              <el-option
                label="6"
                value="6">
              </el-option>
              <el-option
                label="7"
                value="7">
              </el-option>
              <el-option
                label="8"
                value="8">
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
        </el-form>
      </div>
      <el-button type="danger" @click="transcoding()">Transcoding</el-button>
      <div class="transcoding-block">
        <div class="transcoding-progress">
          <el-progress :text-inside="true" :stroke-width="26" :percentage="progress" :status="progress === 100 ? 'success' : ''"></el-progress>
          <p v-if="progress === 100" class="transcoding-message">It took you {{ time }} seconds to transcode!!</p>
        </div>
      </div>
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
      q: {
        sourceUrl: 'https://torii-demo.meshub.io/test.mp4',
        paramCrf: 23,
        paramResolutionWidth: null,
        paramResolutionHeight: null,
        meshubNumbers: 2,
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
      result_url: '',
      progress: 0,
      timer: null,
      time: 0,
      dialogVisible: false,
      isFirstPlay: true
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
      this.progress = 0
      this.time = 0
      this.q.paramResolutionWidth = this.resolutionMap[this.q.resolution].width
      this.q.paramResolutionHeight = this.resolutionMap[this.q.resolution].height
      axios
      .post('https://torii-demo.meshub.io/api/transcode/job', this.q)
      .then(res => {
        this.timer = setInterval(() => {
          this.getProgress(res.data.uuid)
        }, 2000)
      })
    },
    getProgress(uuid) {
      axios
      .get(`https://torii-demo.meshub.io/api/transcode/job?uuid=${uuid}`)
      .then(res => {
        this.time = this.time + 2
        this.progress = res.data.overall_progress
        if(this.progress === 100) {
          clearInterval(this.timer)
          this.$message({
            message: 'Transcoding success!!',
            type: 'success'
          });
          this.dialogVisible = true
          this.result_url = res.data.result_mp4
          if(!this.isFirstPlay) {
            setTimeout(() => {
              this.$refs.video.load()
            }, 500)
          }
          this.isFirstPlay = !this.isFirstPlay
        }
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
</style>
