<template>
  <div class="attendance">
    <h1>{{ $t("attendance.title") }}</h1>
    <div class="coming-soon">
      <el-result icon="info" :title="$t('attendance.comingSoon')">
        <template #sub-title>
          <p>{{ $t("attendance.title") }} {{ $t("attendance.comingSoon") }}</p>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<style scoped>
.attendance {
  padding: 20px;
}

.attendance h1 {
  margin-bottom: 20px;
  color: #303133;
  font-size: 24px;
  font-weight: 500;
}

.coming-soon {
  text-align: center;
  margin-top: 50px;
}
</style>
