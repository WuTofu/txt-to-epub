import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { buildEpub } from "./epubBuilder";
import type { BookMeta, Chapter } from "../types";

describe("lines to paragraphs for zh-CN", () => {
  it("keeps one line per paragraph for typical Chinese novel text", async () => {
    const lines: string[] = [
      "　　第一行内容。",
      "　　第二行内容。",
      "　　第三行内容？",
    ];

    const chapter: Chapter = {
      id: "ch1",
      title: "第1章 测试",
      lines,
    };

    const meta: BookMeta = {
      title: "测试小说",
      author: "测试作者",
      language: "zh-CN",
    };

    const blob = await buildEpub(meta, [chapter]);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const text = await zip.file("OEBPS/chapter-1.xhtml")?.async("string");

    // Seeing three <p> tags is a good signal the three lines weren't merged into one paragraph.
    const pCount = (text?.match(/<p>/g) || []).length;
    expect(pCount).toBeGreaterThanOrEqual(3);
  });
});

describe("epub compression", () => {
  it("compresses repetitive chapter text instead of storing it raw", async () => {
    const line = "　　這是一行會被反覆重複的測試文本，用來驗證壓縮效果是否生效。";
    const lines: string[] = Array.from({ length: 2000 }, () => line);

    const chapter: Chapter = {
      id: "ch1",
      title: "第1章 壓縮測試",
      lines,
    };

    const meta: BookMeta = {
      title: "測試小說",
      author: "測試作者",
      language: "zh-CN",
    };

    const rawByteLength = lines.join("\n").length * 3; // rough upper bound on UTF-8 byte length
    const blob = await buildEpub(meta, [chapter]);

    expect(blob.size).toBeLessThan(rawByteLength * 0.4);
  });
});
