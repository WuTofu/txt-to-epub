<script setup lang="ts">
const props = defineProps<{
  chapterCount: number;
  wordCount: number;
  busy?: boolean;
}>();

const emit = defineEmits<{
  (e: "export"): void;
}>();
</script>

<template>
  <div class="card">
    <div class="flex-between">
      <h3 class="section-title">產生 EPUB</h3>
      <div class="flex" style="align-items: center; gap: 8px">
        <span class="pill">{{ chapterCount }} 章</span>
        <span class="pill">{{ wordCount }} 字</span>
      </div>
    </div>
    <div class="flex-between" style="align-items: center">
      <div class="muted">
        將目前章節和元資訊打包為 EPUB。點擊後瀏覽器會直接下載。
      </div>
      <button class="primary-btn" :disabled="busy || chapterCount === 0" @click="emit('export')">
        {{ busy ? "產生中…" : "產生並下載" }}
      </button>
    </div>
  </div>
</template>
