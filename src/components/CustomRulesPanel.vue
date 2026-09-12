<script setup lang="ts">
import { computed, ref } from "vue";
import {
  compileRule,
  createRuleId,
  parseImportedRules,
  serializeRules,
  validateRule,
  type ChapterRule,
} from "../core/customRules";

const props = defineProps<{
  rules: ChapterRule[];
  rawLines: string[];
  hasFile: boolean;
}>();

const emit = defineEmits<{
  (e: "update:rules", rules: ChapterRule[]): void;
  (e: "reparse"): void;
}>();

const expanded = ref(false);
const isDraftOpen = ref(false);
const isDraftNew = ref(false);
const draft = ref<ChapterRule>(emptyDraft());
const importInput = ref<HTMLInputElement | null>(null);

function emptyDraft(): ChapterRule {
  return {
    id: createRuleId(),
    name: "",
    mode: "keyword",
    pattern: "",
    flags: "",
    capture: 0,
    keywordTemplate: "prefix",
    enabled: true,
  };
}

const enabledCount = computed(
  () => props.rules.filter((r) => r.enabled).length,
);

const draftValidation = computed(() => validateRule(draft.value));

const draftMatchCount = computed<number | null>(() => {
  if (!isDraftOpen.value || !props.rawLines.length) return null;
  const v = validateRule(draft.value);
  if (!v.ok) return null;
  try {
    const compiled = compileRule(draft.value);
    let count = 0;
    for (const line of props.rawLines) {
      try {
        if (compiled.regex.test(line.trim())) count += 1;
      } catch {
        return null;
      }
    }
    return count;
  } catch {
    return null;
  }
});

function startAdd() {
  draft.value = emptyDraft();
  isDraftNew.value = true;
  isDraftOpen.value = true;
}

function startEdit(rule: ChapterRule) {
  draft.value = { ...rule };
  isDraftNew.value = false;
  isDraftOpen.value = true;
}

function cancelEdit() {
  isDraftOpen.value = false;
}

function saveDraft() {
  const v = validateRule(draft.value);
  if (!v.ok) return;
  const saved: ChapterRule = { ...draft.value };
  if (isDraftNew.value) {
    emit("update:rules", [...props.rules, saved]);
  } else {
    emit(
      "update:rules",
      props.rules.map((r) => (r.id === saved.id ? saved : r)),
    );
  }
  isDraftOpen.value = false;
}

function requestReparse() {
  if (isDraftOpen.value) {
    const v = validateRule(draft.value);
    if (!v.ok) {
      window.alert(`目前編輯中的規則尚未通過驗證：${v.error}\n請先修正或取消。`);
      return;
    }
    saveDraft();
  }
  emit("reparse");
}

function toggleEnabled(id: string) {
  emit(
    "update:rules",
    props.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
  );
}

function removeRule(id: string) {
  if (!window.confirm("確認刪除此規則？")) return;
  emit(
    "update:rules",
    props.rules.filter((r) => r.id !== id),
  );
  if (isDraftOpen.value && draft.value.id === id) isDraftOpen.value = false;
}

function moveRule(id: string, delta: number) {
  const idx = props.rules.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const target = idx + delta;
  if (target < 0 || target >= props.rules.length) return;
  const next = [...props.rules];
  const [item] = next.splice(idx, 1);
  next.splice(target, 0, item);
  emit("update:rules", next);
}

function handleExport() {
  const json = serializeRules(props.rules);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "chapter-rules.json";
  link.click();
  URL.revokeObjectURL(url);
}

function triggerImport() {
  importInput.value?.click();
}

async function handleImport(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const imported = parseImportedRules(text);
    if (!imported.length) {
      window.alert("找不到可用的規則");
      return;
    }
    const existingNames = new Set(props.rules.map((r) => r.name));
    const dupes = imported.filter((r) => existingNames.has(r.name));
    let merged: ChapterRule[];
    if (dupes.length > 0) {
      const replace = window.confirm(
        `偵測到 ${dupes.length} 條同名規則。\n確定 = 用匯入的規則取代全部；\n取消 = 保留現有規則並附加匯入的。`,
      );
      merged = replace ? imported : [...props.rules, ...imported];
    } else {
      merged = [...props.rules, ...imported];
    }
    emit("update:rules", merged);
  } catch (err) {
    window.alert(
      "匯入失敗：" + (err instanceof Error ? err.message : String(err)),
    );
  } finally {
    target.value = "";
  }
}

function previewPattern(rule: ChapterRule): string {
  if (rule.mode === "regex") {
    return `/${rule.pattern}/${rule.flags ?? ""}`;
  }
  const tpl = rule.keywordTemplate === "anywhere" ? "任意位置" : "行首";
  return `[${tpl}] ${rule.pattern}`;
}

function updateCapture(e: Event) {
  const v = Number((e.target as HTMLInputElement).value);
  draft.value.capture = Number.isFinite(v) && v >= 0 ? v : 0;
}
</script>

<template>
  <div class="card">
    <div class="flex-between">
      <h3 class="section-title" style="margin: 0">
        自訂章節規則
        <span class="muted" style="font-weight: 400; margin-left: 8px">
          {{ rules.length }} 條 · {{ enabledCount }} 啟用
        </span>
      </h3>
      <button type="button" class="ghost-btn" @click="expanded = !expanded">
        {{ expanded ? "收合" : "展開" }}
      </button>
    </div>

    <div v-if="expanded" class="grid" style="gap: 12px; margin-top: 12px">
      <div v-if="!rules.length" class="hint">
        還沒有自訂規則。點擊下方「+ 新增規則」可以用正則或關鍵字補充預設的章節識別（序章 / 楔子 / 後記 等）。
      </div>

      <ul v-else class="list grid" style="gap: 6px">
        <li
          v-for="(rule, idx) in rules"
          :key="rule.id"
          class="list-item"
          :class="{ active: isDraftOpen && !isDraftNew && draft.id === rule.id }"
        >
          <div class="flex-between" style="gap: 8px; align-items: center">
            <div class="flex" style="gap: 6px; align-items: center; flex-wrap: wrap">
              <button
                type="button"
                class="ghost-btn"
                style="padding: 2px 8px"
                :disabled="idx === 0"
                @click="moveRule(rule.id, -1)"
                aria-label="上移"
              >↑</button>
              <button
                type="button"
                class="ghost-btn"
                style="padding: 2px 8px"
                :disabled="idx === rules.length - 1"
                @click="moveRule(rule.id, 1)"
                aria-label="下移"
              >↓</button>
              <input
                type="checkbox"
                :checked="rule.enabled"
                @change="toggleEnabled(rule.id)"
                aria-label="啟用"
              />
              <span style="font-weight: 600">{{ rule.name || "未命名" }}</span>
              <span class="pill">{{ rule.mode === "regex" ? "正則" : "關鍵字" }}</span>
            </div>
            <div class="flex" style="gap: 6px">
              <button type="button" class="ghost-btn" @click="startEdit(rule)">編輯</button>
              <button type="button" class="ghost-btn" @click="removeRule(rule.id)">刪除</button>
            </div>
          </div>
          <div
            class="muted"
            style="margin-top: 6px; font-family: monospace; word-break: break-all"
          >
            {{ previewPattern(rule) }}
          </div>
        </li>
      </ul>

      <div v-if="isDraftOpen" class="hint" style="padding: 14px">
        <div class="grid" style="gap: 10px">
          <label class="muted">
            名稱
            <input
              class="input"
              type="text"
              v-model="draft.name"
              placeholder="如：序章 / 後記"
            />
          </label>
          <div class="muted">
            模式
            <div class="flex" style="gap: 14px; margin-top: 4px">
              <label style="display: inline-flex; gap: 4px; align-items: center; cursor: pointer">
                <input type="radio" value="keyword" v-model="draft.mode" />關鍵字
              </label>
              <label style="display: inline-flex; gap: 4px; align-items: center; cursor: pointer">
                <input type="radio" value="regex" v-model="draft.mode" />正則
              </label>
            </div>
          </div>
          <label v-if="draft.mode === 'keyword'" class="muted">
            關鍵字（用 <code>|</code> 或換行分隔）
            <textarea
              class="textarea"
              v-model="draft.pattern"
              rows="3"
              placeholder="序|楔子&#10;後記"
              style="min-height: 80px; font-family: monospace"
            />
          </label>
          <label v-else class="muted">
            正則表達式
            <input
              class="input"
              type="text"
              v-model="draft.pattern"
              placeholder="如：^[序楔]章"
              style="font-family: monospace"
            />
          </label>
          <div v-if="draft.mode === 'keyword'" class="flex" style="gap: 14px">
            <label style="display: inline-flex; gap: 4px; align-items: center; cursor: pointer">
              <input type="radio" value="prefix" v-model="draft.keywordTemplate" />行首匹配
            </label>
            <label style="display: inline-flex; gap: 4px; align-items: center; cursor: pointer">
              <input type="radio" value="anywhere" v-model="draft.keywordTemplate" />行內任意位置
            </label>
          </div>
          <div
            v-if="draft.mode === 'regex'"
            class="grid"
            style="grid-template-columns: 1fr 1fr; gap: 10px"
          >
            <label class="muted">
              flags
              <input class="input" type="text" v-model="draft.flags" placeholder="i" />
            </label>
            <label class="muted">
              capture group
              <input
                class="input"
                type="number"
                min="0"
                :value="draft.capture ?? 0"
                @input="updateCapture"
              />
            </label>
          </div>

          <div v-if="!draftValidation.ok" class="error">
            {{ draftValidation.error }}
          </div>
          <div v-else-if="draftMatchCount !== null" class="muted">
            在目前文本中命中 <b>{{ draftMatchCount }}</b> 行
          </div>
          <div v-else-if="!rawLines.length" class="muted">載入檔案後可預覽命中行數</div>

          <div class="flex" style="gap: 8px; justify-content: flex-end">
            <button type="button" class="ghost-btn" @click="cancelEdit">取消</button>
            <button
              type="button"
              class="primary-btn"
              :disabled="!draftValidation.ok"
              @click="saveDraft"
            >
              儲存
            </button>
          </div>
        </div>
      </div>

      <div class="flex" style="gap: 8px; flex-wrap: wrap">
        <button
          v-if="!isDraftOpen"
          type="button"
          class="primary-btn"
          @click="startAdd"
        >
          + 新增規則
        </button>
        <button type="button" class="ghost-btn" @click="triggerImport">匯入 JSON</button>
        <button
          type="button"
          class="ghost-btn"
          :disabled="!rules.length"
          @click="handleExport"
        >
          匯出 JSON
        </button>
        <button
          type="button"
          class="primary-btn"
          :disabled="!hasFile"
          @click="requestReparse"
          style="margin-left: auto"
        >
          按目前規則重新解析
        </button>
      </div>

      <input
        ref="importInput"
        type="file"
        accept=".json,application/json"
        style="display: none"
        @change="handleImport"
      />
    </div>
  </div>
</template>
