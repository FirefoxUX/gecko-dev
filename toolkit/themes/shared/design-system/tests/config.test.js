/* eslint-env node */

const fs = require("fs");
const path = require("path");
const StyleDictionary = require("style-dictionary");
const config = require("../config");

const TEST_BUILD_PATH = "tests/build/css/";

const EXPECTED_CSS_RULES = {
  "--color-background-critical": "light-dark(var(--color-red-05), var(--color-red-80))",
  "--color-background-information": "light-dark(var(--color-blue-05), var(--color-blue-80))",
  "--color-background-success": "light-dark(var(--color-green-05), var(--color-yellow-80))",
  "--color-background-warning": "light-dark(var(--color-yellow-05), var(--color-blue-80))",
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
  "--text-brand": "light-dark(var(--color-gray-100), var(--color-gray-05))",
  "--text-color": "CanvasText",
  "--text-deemphasized": "color-mix(in srgb, currentColor 60%, transparent)",
  "--text-platform": "currentColor",
};

// Use our real config, just modify some values for the test.
let testConfig = Object.assign({}, config);
testConfig.source = [path.join(__dirname, "../design-tokens.json")];
testConfig.platforms.css.buildPath = TEST_BUILD_PATH;

describe("generated CSS", () => {
  StyleDictionary.extend(testConfig).buildAllPlatforms();

  describe("css/variables", () => {
    const output = fs.readFileSync(`${TEST_BUILD_PATH}tokens-shared.css`, {
      encoding: "UTF-8",
    });
    
    it("should produce the expected CSS", () => {
      let formattedCSS = output.split("\n").reduce((rulesObj, rule) => {
        let [key, val] = rule.split(":");
        if (key && val) {
          return { ...rulesObj, [key.trim()]: val.trim().replace(";", "") };
        }
        return rulesObj;
      }, {});

      expect(formattedCSS).toMatchObject(EXPECTED_CSS_RULES);
    });
  });
});

afterAll(() => {
  fs.rmSync("tests/build", { recursive: true, force: true });
});
