<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Chapter } from "../types";

const props = defineProps<{
  chapter: Chapter | undefined;
  canMerge: boolean;
  busy?: boolean;
}>();

const emit = defineEmits<{
  (e: "rename", payload: { id: string; title: string }): void;
  (e: "merge-prev", id: string): void;
}>();

const titleInput = ref("");

watch(
  () => props.chapter?.title,
  (next) => {
    titleInput.value = next ?? "";
  },
  { immediate: true },
);

const preview = computed(() => {
  if (!props.chapter) return "";
  return props.chapter.lines.slice(0, 120).join("\n");
});

function handleRename() {
  if (props.chapter) {
    emit("rename", { id: props.chapter.id, title: titleInput.value.trim() });
  }
}

function handleMerge() {
  if (props.chapter) emit("merge-prev", props.chapter.id);
}
</script>

<template>
  <div class="card">
    <div class="flex-between">
      <h3 class="section-title">章節詳情</h3>
      <span v-if="chapter" class="pill">{{ chapter.lines.join("").length }} 字</span>
    </div>

    <div v-if="chapter" class="grid" style="gap: 12px">
      <label class="muted">章節標題</label>
      <div class="flex" style="align-items: center">
        <input v-model="titleInput" class="input" type="text" placeholder="章節標題" />
        <button class="ghost-btn" :disabled="busy" @click="handleRename">儲存標題</button>
        <button class="ghost-btn" :disabled="busy || !canMerge" @click="handleMerge">與上一章合併</button>
      </div>

      <label class="muted">正文預覽（前 120 行）</label>
      <textarea class="textarea" :value="preview" readonly></textarea>
    </div>
    <div v-else class="muted">請選擇章節以查看詳情。</div>
  </div>
</template>
