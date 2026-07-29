module.exports = function(api) {
  api.cache(true);
  return {
    presets: ["@react-native/babel-preset"],
    plugins: [
      [
        "module-resolver",
        {        
          alias: {
            "~": "./",
          },
        },
      ],
      ['react-native-reanimated/plugin']
    ],
    env: {
      production: {
        plugins: [
          "react-native-paper/babel",
          ["transform-remove-console", { exclude: ["error", "warn"] }],
          "transform-react-remove-prop-types",
          ["transform-remove-undefined", { "tdz": true }]
        ],
      },
    },
  };
};
