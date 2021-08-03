const fieldInfo = (dataField, displayField) => {
  return { dataField, displayField }
}

module.exports = {
  accountFields: [
    fieldInfo("account", "account"),
    fieldInfo("time_create", "timeCreate"),
    fieldInfo("time_use", "timeUse")
  ],
  workerFields: [
    fieldInfo("ip_address", "ipAddress"),
    fieldInfo("dead", "dead"),
    fieldInfo("timestamp", "timestamp")
  ],
  jobFields: [
    fieldInfo("uuid", "uuid"),
    fieldInfo("account", "account"),
    fieldInfo("status", "status"),
    fieldInfo("sourceUrl", "sourceUrl"),
    fieldInfo("job_type", "jobType"),
    fieldInfo("meshubNumbers", "meshubNumbers"),
    fieldInfo("overall_progress", "overallProgress"),
    fieldInfo("paramBitrate", "paramBitrate"),
    fieldInfo("paramCrf", "paramCrf"),
    fieldInfo("paramResolutionWidth", "paramResolutionWidth"),
    fieldInfo("paramResolutionHeight", "paramResolutionHeight"),
    fieldInfo("paramPreset", "paramPreset"),
    fieldInfo("createdAt", "createdAt"),
    fieldInfo("updatedAt", "updatedAt"),
    fieldInfo("result_mp4", "resultMp4"),
    fieldInfo("mp4_removed", "mp4Removed"),
    fieldInfo("pending_at", "pendingAt"),
    fieldInfo("transcoding_at", "transcodingAt"),
    fieldInfo("uploading_at", "uploadingAt"),
    fieldInfo("merging_at", "mergingAt"),
    fieldInfo("finished_at", "finishedAt"),
  ],
  splitJobFields: [
    fieldInfo("uuid", "uuid"),
    fieldInfo("meshubId", "meshubIp"),
    fieldInfo("account", "account"),
    fieldInfo("in_progress", "inProgress"),
    fieldInfo("sourceUrl", "sourceUrl"),
    fieldInfo("job_type", "jobType"),
    fieldInfo("progress", "progress"),
    fieldInfo("paramBitrate", "paramBitrate"),
    fieldInfo("paramCrf", "paramCrf"),
    fieldInfo("paramResolutionWidth", "paramResolutionWidth"),
    fieldInfo("paramResolutionHeight", "paramResolutionHeight"),
    fieldInfo("paramPreset", "paramPreset"),
    fieldInfo("paramSeekBeginSec", "paramSeekBeginSec"),
    fieldInfo("paramSeekEndSec", "paramSeekEndSec"),
    fieldInfo("uploadFileName", "uploadFileName"),
    fieldInfo("createdAt", "createdAt"),
    fieldInfo("updatedAt", "updatedAt"),
    fieldInfo("dispatchedAt", "dispatchedAt"),
  ]
}