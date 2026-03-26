const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withFixDuplicateClasses(config) {
    return withProjectBuildGradle(config, (config) => {
        // 이미 코드가 추가되어 있는지 확인하고, 없으면 맨 밑에 강제로 쑤셔 넣습니다!
        if (!config.modResults.contents.includes("exclude group: 'com.android.support'")) {
            config.modResults.contents += `
allprojects {
    configurations.all {
        // 옛날 안드로이드 지원 라이브러리들 싹 다 접근 금지 (AndroidX만 살려둠)
        exclude group: 'com.android.support', module: 'support-compat'
        exclude group: 'com.android.support', module: 'support-core-utils'
        exclude group: 'com.android.support', module: 'support-core-ui'
        exclude group: 'com.android.support', module: 'support-media-compat'
        exclude group: 'com.android.support', module: 'support-fragment'
        exclude group: 'com.android.support', module: 'support-v4'
        exclude group: 'com.android.support', module: 'versionedparcelable'
        exclude group: 'com.android.support', module: 'animated-vector-drawable'
        exclude group: 'com.android.support', module: 'support-vector-drawable'
    }
}
`;
        }
        return config;
    });
};