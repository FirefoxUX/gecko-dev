/* eslint-env node */

const fs = require("fs");
const path = require("path");
const StyleDictionary = require("style-dictionary");
const config = require("../config");

const TEST_BUILD_PATH = "tests/build/css/";

const SHARED_CSS_RULES = {
  "--border-radius-circle": "9999px",
  "--border-radius-medium": "8px",
  "--border-radius-small": "4px",
  "--border-width": "1px",
  "--box-background-color":
    "light-dark(var(--color-white), var(--color-gray-80))",
  "--box-shadow-10": "0 1px 4px var(--color-black-a10)",
  "--button-border-radius": "var(--border-radius-small)",
  "--button-font-weight": "var(--font-weight-bold)",
  "--button-line-height": "var(--line-height-small)",
  "--button-min-height": "var(--size-item-large)",
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
  "--color-error-outline":
    "light-dark(var(--color-red-50), var(--color-red-20))",
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
  "--color-red-20": "#ff9aa2",
  "--color-red-30": "#f37f98",
  "--color-red-50": "#d7264c",
  "--color-red-80": "#690f22",
  "--color-white": "#ffffff",
  "--color-yellow-05": "#ffebcd",
  "--color-yellow-30": "#e49c49",
  "--color-yellow-50": "#cd411e",
  "--color-yellow-80": "#5a3100",
  "--focus-outline-color": "var(--color-accent-primary)",
  "--focus-outline-inset": "calc(-1 * var(--focus-outline-width))",
  "--focus-outline-offset": "2px",
  "--focus-outline-width": "2px",
  "--focus-outline":
    "var(--focus-outline-width) solid var(--focus-outline-color)",
  "--font-weight-bold": "600",
  "--font-weight": "normal",
  "--icon-color-critical":
    "light-dark(var(--color-red-50), var(--color-red-30))",
  "--icon-color-information":
    "light-dark(var(--color-blue-50), var(--color-blue-30))",
  "--icon-color-success":
    "light-dark(var(--color-green-50), var(--color-green-30))",
  "--icon-color-warning":
    "light-dark(var(--color-yellow-50), var(--color-yellow-30))",
  "--icon-color": "light-dark(var(--color-gray-70), var(--color-gray-05))",
  "--input-text-line-height": "var(--button-line-height)",
  "--input-text-min-height": "var(--button-min-height)",
  "--link-focus-outline-offset": "1px",
  "--size-item-large": "32px",
  "--size-item-medium": "28px",
  "--size-item-small": "16px",
  "--spacing-small": "0.5rem",
  "--text-color-deemphasized":
    "color-mix(in srgb, currentColor 60%, transparent)",
  "--text-color-deemphasized":
    "color-mix(in srgb, currentColor 60%, transparent)",
  "--text-color-error": "light-dark(var(--color-red-50), var(--color-red-20))",
};

const SHARED_PREFERS_CONTRAST_CSS_RULES = {
<<<<<<< HEAD
  "--text-color-deemphasized": "inherit",
  "--text-color": "CanvasText",
  "--border-interactive-color-disabled": "GrayText",
=======
  "--border-color": "var(--text-color)",
>>>>>>> 0fd8b1636305 (add remaining tokens to design-tokens.json)
  "--border-interactive-color-active": "AccentColor",
  "--border-interactive-color": "AccentColor",
  "--border-interactive-color-disabled": "GrayText",
  "--border-interactive-color-hover": "SelectedItem",
<<<<<<< HEAD
  "--border-interactive-color": "AccentColor",
  "--border-color": "var(--text-color)",
=======
  "--box-background-color": "var(--color-canvas)",
  "--button-background-color-active": "ButtonFace",
  "--button-background-color-disabled": "GrayText",
  "--button-background-color-hover": "ButtonFace",
  "--button-background-color": "ButtonFace",
  "--color-accent-primary-active": "ButtonText",
  "--color-accent-primary-hover": "ButtonText",
  "--color-accent-primary": "AccentColor",
  "--color-background-critical": "var(--color-canvas)",
  "--color-background-information": "var(--color-canvas)",
  "--color-background-success": "var(--color-canvas)",
  "--color-background-warning": "var(--color-canvas)",
  "--color-canvas": "Canvas",
  "--color-error-outline": "var(--border-color)",
  "--icon-color-critical": "var(--icon-color)",
  "--icon-color-information": "var(--icon-color)",
  "--icon-color-success": "var(--icon-color)",
  "--icon-color-warning": "var(--icon-color)",
  "--icon-color": "var(--text-color)",
  "--link-color-active": "ActiveText",
  "--link-color-hover": "LinkText",
  "--link-color-visited": "var(--link-color)",
  "--link-color": "LinkText",
  "--text-color-deemphasized": "inherit",
  "--text-color": "CanvasText",
  "--text-color-error": "inherit",
>>>>>>> 0fd8b1636305 (add remaining tokens to design-tokens.json)
};

const SHARED_FORCED_COLORS_CSS_RULES = {
  "--border-interactive-color-active": "ButtonText",
  "--border-interactive-color": "ButtonText",
  "--border-interactive-color-disabled": "GrayText",
  "--border-interactive-color-hover": "ButtonText",
<<<<<<< HEAD
  "--border-interactive-color": "ButtonText",
=======
  "--color-accent-primary-active": "SelectedItem",
  "--color-accent-primary-hover": "SelectedItem",
  "--color-accent-primary": "ButtonText",
>>>>>>> 0fd8b1636305 (add remaining tokens to design-tokens.json)
};

const BRAND_CSS_RULES = {
  "--border-interactive-color":
    "light-dark(var(--color-gray-60), var(--color-gray-50))",
<<<<<<< HEAD
  "--text-color": "light-dark(var(--color-gray-100), var(--color-gray-05))",
=======
  "--brand-color-accent-active":
    "light-dark(var(--color-blue-70), var(--color-cyan-20))",
  "--brand-color-accent-hover":
    "light-dark(var(--color-blue-60), var(--color-cyan-30))",
  "--brand-color-accent":
    "light-dark(var(--color-blue-50), var(--color-cyan-50))",
  "--button-background-color-active":
    "color-mix(in srgb, currentColor 21%, transparent)",
  "--button-background-color-hover":
    "color-mix(in srgb, currentColor 14%, transparent)",
  "--button-background-color":
    "color-mix(in srgb, currentColor 7%, transparent)",
  "--color-accent-primary-active": "var(--brand-color-accent-active)",
  "--color-accent-primary-hover": "var(--brand-color-accent-hover)",
  "--color-accent-primary": "var(--brand-color-accent)",
  "--color-canvas": "light-dark(var(--color-white), var(--color-gray-90))",
  "--font-size-large": "1.133rem",
  "--font-size-root": "15px",
  "--font-size-small": "0.867rem",
  "--font-size-xlarge": "1.467rem",
  "--font-size-xxlarge": "2.2rem",
  "--font-weight-light": "300",
  "--line-height": "1.5",
  "--line-height-small": "1.3",
  "--link-color-active": "var(--brand-color-accent-active)",
  "--link-color-hover": "var(--brand-color-accent-hover)",
  "--link-color-visited": "var(--link-color)",
  "--link-color": "var(--brand-color-accent)",
>>>>>>> 0fd8b1636305 (add remaining tokens to design-tokens.json)
  "--text-color-deemphasized":
    "light-dark(color-mix(in srgb, currentColor 69%, transparent), color-mix(in srgb, currentColor 75%, transparent))",
  "--text-color": "light-dark(var(--color-gray-100), var(--color-gray-05))",
};

const PLATFORM_CSS_RULES = {
  "--border-interactive-color":
    "color-mix(in srgb, currentColor 15%, var(--color-gray-60))",
<<<<<<< HEAD
=======
  "--button-background-color-active": "var(--button-active-bgcolor)",
  "--button-background-color-hover": "var(--button-hover-bgcolor)",
  "--button-background-color": "var(--button-bgcolor)",
  "--color-accent-primary-active": "var(--platform-color-accent-active)",
  "--color-accent-primary-hover": "var(--platform-color-accent-hover)",
  "--color-accent-primary": "var(--platform-color-accent)",
  "--color-canvas": "Canvas",
  "--font-size-large": "unset",
  "--font-size-root": "unset",
  "--font-size-small": "unset",
  "--font-size-xlarge": "unset",
  "--font-size-xxlarge": "unset",
  "--font-weight-light": "unset",
  "--line-height": "normal",
  "--line-height-small": "unset",
  "--link-color-active": "ActiveText",
  "--link-color-hover": "LinkText",
  "--link-color-visited": "var(--link-color)",
  "--link-color": "LinkText",
  "--platform-color-accent-active": "var(--button-primary-active-bgcolor)",
  "--platform-color-accent-hover": "var(--button-primary-hover-bgcolor)",
  "--platform-color-accent": "var(--button-primary-bgcolor, AccentColor)",
  "--text-color": "currentColor",
>>>>>>> 0fd8b1636305 (add remaining tokens to design-tokens.json)
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

// Use our real config, just modify some values for the test.
let testConfig = Object.assign({}, config);
testConfig.source = [path.join(__dirname, "../design-tokens.json")];
testConfig.platforms.css.buildPath = TEST_BUILD_PATH;q

function formatCSS(src) {
  return src
    .replaceAll(/\/\*([\s\S]*?)\*\/|\@import.+/g, "")
    .split("\n")
    .reduce((rulesObj, rule) => {
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
});

afterAll(() => {
  fs.rmSync("tests/build", { recursive: true, force: true });
});
