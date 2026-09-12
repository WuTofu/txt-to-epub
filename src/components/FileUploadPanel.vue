<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  detectedEncoding: string;
  usedEncoding: string;
  busy?: boolean;
}>();

const emit = defineEmits<{
  (e: "parse", payload: { file: File; encoding: string | "auto" }): void;
}>();

const encodingOptions = [
  { label: "自動偵測", value: "auto" },
  { label: "UTF-8", value: "utf-8" },
  { label: "GB18030 / GBK", value: "gb18030" },
  { label: "Big5", value: "big5" },
];
const allowedValues = new Set(encodingOptions.map((item) => item.value));

const encodingChoice = ref<string | "auto">("auto");
const selectedFile = ref<File | null>(null);
const fileName = ref("");

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  selectedFile.value = file ?? null;
  fileName.value = file?.name ?? "";
}

function handleParse() {
  if (!selectedFile.value) {
    alert("請先選擇 txt 檔案");
    return;
  }
  emit("parse", { file: selectedFile.value, encoding: encodingChoice.value });
}

watch(
  () => props.detectedEncoding,
  (next) => {
    if (next && encodingChoice.value === "auto" && allowedValues.has(next)) {
      encodingChoice.value = next;
    }
  },
);
</script>

<template>
  <div class="card">
    <div class="flex-between">
      <h2 class="section-title">上傳 TXT</h2>
      <span class="muted">所有處理均在本機瀏覽器完成，檔案不會外傳，保護隱私</span>
    </div>
    <div class="grid" style="gap: 12px">
      <label class="muted" style="display: block">
        選擇檔案
        <input class="input" type="file" accept=".txt,text/plain" @change="onFileChange" />
      </label>
      <div class="flex-between" style="align-items: flex-start; gap: 12px">
        <div class="muted">
          <div>目前檔案：<strong>{{ fileName || "未選擇" }}</strong></div>
          <div>偵測編碼：<strong>{{ detectedEncoding || "未知" }}</strong> / 實際使用：{{ usedEncoding || "待解析" }}</div>
        </div>
        <div class="flex" style="align-items: center; flex-wrap: wrap; gap: 8px">
          <label class="muted">編碼：</label>
          <select v-model="encodingChoice" class="input" style="width: 160px">
            <option v-for="item in encodingOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
          <button class="primary-btn" :disabled="busy" @click="handleParse">
            {{ busy ? "解析中…" : "讀取並解析" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
