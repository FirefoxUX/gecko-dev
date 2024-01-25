/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint-env node */

const StyleDictionary = require("style-dictionary");

module.exports = {
  source: ["design-tokens.json"],
  transform: {
    lightDarkTransform: {
      type: "value",
      transitive: true,
      name: "lightDarkTransform",
      matcher: token => token.original.value && token.original.dark,
      transformer: token => {
        let lightDarkValue = `light-dark(${token.original.value}, ${token.original.dark})`;
        // modify the original value and everything works like magic
        token.original.value = lightDarkValue;
        return lightDarkValue;
      },
    },
  },
  platforms: {
    css: {
      transforms: [
        ...StyleDictionary.transformGroup.css,
        "lightDarkTransform",
      ],
      buildPath: "build/css/",
      files: [
        {
          destination: "light-dark.css",
          format: "css/variables",
          options: {
            outputReferences: true,
          },
        },
      ],
    },
  },
};
