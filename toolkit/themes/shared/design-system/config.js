/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint-env node */

const StyleDictionary = require("style-dictionary");
const { formattedVariables } = StyleDictionary.formatHelpers;

const MEDIA_QUERY_PROPERTY_MAP = {
  "forced-colors": "forcedColors",
  "prefers-contrast": "prefersContrast",
};

/**
 * Formats built CSS to include "prefers-contrast" and "forced-colors" media
 * queries.
 *
 * @param {object} args
 *  Formatter arguments provided by style-dictionary. See more at
 *  https://amzn.github.io/style-dictionary/#/formats?id=formatter
 * @returns {string}
 *  Formatted CSS including media queries.
 */
function hcmFormatter(args) {
  return (
    formatTokens({ args }) +
    formatTokens({ mediaQuery: "prefers-contrast", args }) +
    formatTokens({ mediaQuery: "forced-colors", args })
  );
}

/**
 * Formats a subset of tokens into CSS. Wraps token CSS in a media query when
 * applicable.
 *
 * @param {object} tokenArgs
 * @param {string} [tokenArgs.mediaQuery]
 *  Media query formatted CSS should be wrapped in. This is used
 *  to determine what property we are parsing from the token values.
 * @param {object} tokenArgs.args
 *  Formatter arguments provided by style-dictionary. See more at
 *  https://amzn.github.io/style-dictionary/#/formats?id=formatter
 * @returns {string} Tokens formatted into a CSS string.
 */
function formatTokens({ mediaQuery, args }) {
  let prop = MEDIA_QUERY_PROPERTY_MAP[mediaQuery] ?? "value";
  let dictionary = Object.assign({}, args.dictionary);
  let tokens = [];

  dictionary.allTokens.forEach(token => {
    let value = token[prop] || token.original.value[prop]
    if (value && typeof value !== "object") {
      let formattedToken = transformTokenValue(token, prop, dictionary);
      tokens.push(formattedToken);
    }
  });

  dictionary.allTokens = dictionary.allProperties = tokens;

  let formattedVars = formattedVariables({
    format: "css",
    dictionary,
    outputReferences: args.options.outputReferences,
    formatting: {
      indentation: mediaQuery ? "    " : "  ",
    },
  });

  // Weird spacing below is unfortunately necessary formatting the built CSS.
  if (mediaQuery) {
    return `
@media (${mediaQuery}) {
  :root {
${formattedVars}
  }
}
`;
  }

  return `:root {\n${formattedVars}\n}\n`;
}

/**
 * Takes a token object and changes "value" based on the supplied prop. Also
 * preserves variable references when necessary.
 *
 * @param {object} token - Token object parsed from JSON by style-dictionary.
 * @param {string} prop
 *  Name of the property used to get the token's new value.
 * @param {object} dictionary
 *  Object of transformed tokens and helper fns provided by style-dictionary.
 * @returns {object} Token object with an updated value.
 */
function transformTokenValue(token, prop, dictionary) {
  let originalVal = token.original.value[prop];
  if (dictionary.usesReference(originalVal)) {
    let refs = dictionary.getReferences(originalVal);
    return { ...token, value: `var(--${refs[0].name})` };
  }
  return { ...token, value: token[prop] || originalVal};
}

module.exports = {
  source: ["design-tokens.json"],
  transform: {
    defaultTransform: {
      type: "value",
      transitive: true,
      name: "defaultTransform",
      matcher: token => token.original.value.default,
      transformer: token => token.original.value.default,
    },
    lightDarkTransform: {
      type: "value",
      transitive: true,
      name: "lightDarkTransform",
      matcher: token => token.original.value.light && token.original.value.dark,
      transformer: token => {
        return `light-dark(${token.original.value.light}, ${token.original.value.dark})`;
      },
    },
  },
  format: {
    "css/variables/hcm": hcmFormatter,
  },
  platforms: {
    css: {
      // The ordering of transforms matter, so if we encountered
      // "light", "dark", and "default" in the value object then
      // this ordering would ensure that the "default" value is
      // used to generate the token's value.
      transforms: [
        ...StyleDictionary.transformGroup.css,
        "lightDarkTransform",
        "defaultTransform",
      ],
      buildPath: "build/css/",
      files: [
        {
          destination: "tokens-shared.css",
          format: "css/variables/hcm",
          options: {
            outputReferences: true,
            showFileHeader: false,
          },
        },
      ],
    },
  },
};
