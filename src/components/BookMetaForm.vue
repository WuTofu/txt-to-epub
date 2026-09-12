<script setup lang="ts">
import type { BookMeta, Language } from "../types";

const props = defineProps<{
  meta: BookMeta;
}>();

const emit = defineEmits<{
  (e: "update:meta", meta: BookMeta): void;
}>();

function updateField(key: keyof BookMeta, value: string | Language) {
  emit("update:meta", { ...props.meta, [key]: value });
}
</script>

<template>
  <div class="card">
    <h3 class="section-title">書籍元資訊</h3>
    <div class="grid" style="gap: 12px">
      <label class="muted">
        書名
        <input
          class="input"
          type="text"
          :value="meta.title"
          placeholder="預設使用檔名"
          @input="updateField('title', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="muted">
        作者
        <input
          class="input"
          type="text"
          :value="meta.author"
          placeholder="選填"
          @input="updateField('author', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="muted">
        語言
        <select
          class="input"
          :value="meta.language"
          @change="updateField('language', ($event.target as HTMLSelectElement).value as Language)"
        >
          <option value="zh-CN">簡體中文</option>
          <option value="en">English</option>
        </select>
      </label>
    </div>
  </div>
</template>
