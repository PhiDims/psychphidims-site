import markdownIt from "markdown-it";

const md = markdownIt({ html: false, linkify: true, breaks: false });

export default function (eleventyConfig) {
  // Files copied to the site as they are
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg" });

  // Markdown for longer text fields written in the editor
  eleventyConfig.addFilter("md", (value) => (value ? md.render(String(value)) : ""));
  eleventyConfig.addFilter("mdInline", (value) => (value ? md.renderInline(String(value)) : ""));

  // Current year for the footer
  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  // Two-digit numbering (01, 02 …)
  eleventyConfig.addFilter("pad2", (n) => String(n).padStart(2, "0"));

  // YouTube video id from any common YouTube link
  eleventyConfig.addFilter("youtubeId", (url) => {
    if (!url) return "";
    const m = String(url).match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : "";
  });

  // Remove a trailing slash so URLs join cleanly
  eleventyConfig.addFilter("trimSlash", (url) => String(url || "").replace(/\/+$/, ""));

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
}
