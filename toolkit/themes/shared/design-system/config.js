
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint-env node */

const StyleDictionary = require("style-dictionary");

module.exports = {
  source: ["design-tokens.json"],
  transform: {
    defaultTransform: {
      type: "value",
      transitive: true,
      name: "defaultTransform",
      matcher: token => token.original.value.default,
      transformer: token => token.original.value.default
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
          format: "css/variables",
          options: {
            outputReferences: true,
            showFileHeader: false,
          },
        },
      ],
    },
  },
};
