/* eslint-env node */

const fs = require("fs");
const path = require("path");
const StyleDictionary = require("style-dictionary");
const config = require("../config");

const TEST_BUILD_PATH = "tests/build/css/";

const SHARED_CSS_RULES = {
  "--color-background-critical":
    "light-dark(var(--color-red-05), var(--color-red-80))",
  "--color-background-information":
    "light-dark(var(--color-blue-05), var(--color-blue-80))",
  "--color-background-success":
    "light-dark(var(--color-green-05), var(--color-yellow-80))",
  "--color-background-warning":
    "light-dark(var(--color-yellow-05), var(--color-blue-80))",
  "--color-black-a10": "rgba(0, 0, 0, 0.1)",
  "--color-blue-05": "#deeafc",
  "--color-blue-30": "#73a7f3",
  "--color-blue-50": "#0060df",
  "--color-blue-60": "#0250bb",
  "--color-blue-70": "#054096",
  "--color-blue-80": "#003070",
  "--color-cyan-20": "#aaf2ff",
  "--color-cyan-30": "#aaf2ff",
  "--color-cyan-50": "#00ddff",
  "--color-gray-05": "#fbfbfe",
  "--color-gray-100": "#15141a",
  "--color-gray-50": "#bfbfc9",
  "--color-gray-60": "#8f8f9d",
  "--color-gray-70": "#5b5b66",
  "--color-gray-80": "#23222b",
  "--color-gray-90": "#1c1b22",
  "--color-green-05": "#d8eedc",
  "--color-green-30": "#4dbc87",
  "--color-green-50": "#017a40",
  "--color-green-80": "#004725",
  "--color-red-05": "#ffe8e8",
  "--color-red-30": "#f37f98",
  "--color-red-50": "#d7264c",
  "--color-red-80": "#690f22",
  "--color-white": "#ffffff",
  "--color-yellow-05": "#ffebcd",
  "--color-yellow-30": "#e49c49",
  "--color-yellow-50": "#cd411e",
  "--color-yellow-80": "#5a3100",
  "--text-color-deemphasized":
    "color-mix(in srgb, currentColor 60%, transparent)",
  "--border-radius-circle": "9999px",
  "--border-radius-small": "4px",
  "--border-radius-medium": "8px",
  "--border-width": "1px",
};

const SHARED_PREFERS_CONTRAST_CSS_RULES = {
  "--text-color-deemphasized": "inherit",
  "--text-color": "CanvasText",
  "--border-interactive-color-disabled": "GrayText",
  "--border-interactive-color-active": "AccentColor",
  "--border-interactive-color-hover": "SelectedItem",
  "--border-interactive-color": "AccentColor",
  "--border-color": "var(--text-color)",
};

const SHARED_FORCED_COLORS_CSS_RULES = {
  "--border-interactive-color-disabled": "GrayText",
  "--border-interactive-color-active": "ButtonText",
  "--border-interactive-color-hover": "ButtonText",
  "--border-interactive-color": "ButtonText",
};

const BRAND_CSS_RULES = {
  "--border-interactive-color":
    "light-dark(var(--color-gray-60), var(--color-gray-50))",
  "--text-color": "light-dark(var(--color-gray-100), var(--color-gray-05))",
  "--text-color-deemphasized":
    "light-dark(color-mix(in srgb, currentColor 69%, transparent), color-mix(in srgb, currentColor 75%, transparent))",
};

const PLATFORM_CSS_RULES = {
  "--border-interactive-color":
    "color-mix(in srgb, currentColor 15%, var(--color-gray-60))",
  "--text-color": "currentColor",
};

const SHARED_FIXTURE_BY_QUERY = {
  base: SHARED_CSS_RULES,
  "prefers-contrast": SHARED_PREFERS_CONTRAST_CSS_RULES,
  "forced-colors": SHARED_FORCED_COLORS_CSS_RULES,
};

const FIXTURE_BY_SURFACE = {
  brand: BRAND_CSS_RULES,
  platform: PLATFORM_CSS_RULES,
};

// Comment regex copied and slightly adapted from:
// https://blog.ostermiller.org/finding-comments-in-source-code-using-regular-expressions/
const COMMENT_REGEX = /(?:\*|\/\/)([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*/;

// Use our real config, just modify some values for the test.
let testConfig = Object.assign({}, config);
testConfig.source = [path.join(__dirname, "../design-tokens.json")];
testConfig.platforms.css.buildPath = TEST_BUILD_PATH;

function formatCSS(src) {
  return src.split("\n").reduce((rulesObj, rule) => {
    if (rule.match(COMMENT_REGEX)) {
      return rulesObj;
    }

    let [key, val] = rule.split(":");
    if (key.trim() && val) {
      return { ...rulesObj, [key.trim()]: val.trim().replace(";", "") };
    }
    return rulesObj;
  }, {});
}

describe("CSS formats", () => {
  StyleDictionary.extend(testConfig).buildAllPlatforms();

  describe("css/variables/shared format", () => {
    const output = fs.readFileSync(`${TEST_BUILD_PATH}tokens-shared.css`, {
      encoding: "UTF-8",
    });

    let rulesByMediaQuery = output.split(/(?=\@media)/);

    it("should contain three blocks of CSS, including media queries", () => {
      expect(rulesByMediaQuery.length).toBe(3);
      expect(rulesByMediaQuery[1]).toEqual(
        expect.stringContaining("prefers-contrast")
      );
      expect(rulesByMediaQuery[2]).toEqual(
        expect.stringContaining("forced-colors")
      );
    });

    rulesByMediaQuery.forEach(ruleSet => {
      let queryName =
        ruleSet.trim().match(/(?<=\@media\s*\().+?(?=\) \{)/) || "base";
      it(`should produce the expected ${queryName} CSS rules`, () => {
        let formattedCSS = formatCSS(ruleSet);
        expect(formattedCSS).toStrictEqual(SHARED_FIXTURE_BY_QUERY[queryName]);
      });
    });
  });

  ["brand", "platform"].forEach(surface => {
    describe(`css/variables/${surface}`, () => {
      const output = fs.readFileSync(
        `${TEST_BUILD_PATH}tokens-${surface}.css`,
        {
          encoding: "UTF-8",
        }
      );

      it("should @import tokens-shared.css", () => {
        expect(
          output.includes(
            '@import url("chrome://global/skin/design-system/tokens-shared.css")'
          )
        ).toBe(true);
      });

      it("should produce the expected CSS rules", () => {
        let formattedCSS = formatCSS(output);
        expect(formattedCSS).toStrictEqual(FIXTURE_BY_SURFACE[surface]);
      });
    });
  });

  describe("css/variables/brand", () => {
    it("should produce the expected CSS rules", () => {
      const output = fs.readFileSync(`${TEST_BUILD_PATH}tokens-brand.css`, {
        encoding: "UTF-8",
      });
      let formattedCSS = formatCSS(output);
      expect(formattedCSS).toStrictEqual(BRAND_CSS_RULES);
    });
  });

  describe("css/variables/platform", () => {
    it("should produce the expected CSS rules", () => {
      const output = fs.readFileSync(`${TEST_BUILD_PATH}tokens-platform.css`, {
        encoding: "UTF-8",
      });
      let formattedCSS = formatCSS(output);
      expect(formattedCSS).toStrictEqual(PLATFORM_CSS_RULES);
    });
  });
});

afterAll(() => {
  fs.rmSync("tests/build", { recursive: true, force: true });
});
