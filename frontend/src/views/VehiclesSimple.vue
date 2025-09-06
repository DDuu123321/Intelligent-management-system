<template>
  <div class="vehicles">
    <h1>{{ $t("vehicles.title") }}</h1>
    <div class="coming-soon">
      <el-result icon="info" :title="$t('vehicles.comingSoon')">
        <template #sub-title>
          <p>{{ $t("vehicles.title") }} {{ $t("vehicles.comingSoon") }}</p>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t: _t } = useI18n();
</script>

<style scoped>
.vehicles {
  padding: 20px;
}

.vehicles h1 {
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
