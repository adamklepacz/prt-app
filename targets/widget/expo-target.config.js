/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = () => ({
  type: 'widget',
  name: 'SomaticWidget',
  displayName: 'Somatic',
  bundleIdentifier: '.widget',
  icon: '../../assets/icon.png',
  deploymentTarget: '17.0',
  frameworks: ['SwiftUI', 'WidgetKit'],
  colors: {
    $accent: '#5E715D',
    $widgetBackground: '#FAF8F5',
  },
});
