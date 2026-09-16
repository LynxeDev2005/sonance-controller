Pod::Spec.new do |s|
  s.name           = 'PcControlNative'
  s.version        = '1.0.0'
  s.summary        = 'Native Swift module for Wake-on-LAN and PC Control'
  s.description    = 'Native Swift module providing Wake-on-LAN Magic Packet broadcasting and iOS system utilities'
  s.author         = 'Jhet'
  s.homepage       = 'https://github.com'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.0'
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = 'ios/**/*.{h,m,mm,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'FRAMEWORK_SEARCH_PATHS' => '$(inherited) "${PODS_CONFIGURATION_BUILD_DIR}/XCFrameworkIntermediates/ExpoModulesCore" "${PODS_CONFIGURATION_BUILD_DIR}/XCFrameworkIntermediates/ExpoModulesJSI" "${PODS_ROOT}/ExpoModulesJSI/ExpoModulesJSI.xcframework/ios-arm64" "${PODS_ROOT}/../../node_modules/expo-modules-jsi/apple/Products/ExpoModulesJSI.xcframework/ios-arm64"',
    'SWIFT_INCLUDE_PATHS' => '$(inherited) "${PODS_CONFIGURATION_BUILD_DIR}/ExpoModulesCore" "${PODS_CONFIGURATION_BUILD_DIR}/ExpoModulesJSI"',
    'HEADER_SEARCH_PATHS' => '$(inherited) "${PODS_ROOT}/Headers/Public/ExpoModulesCore" "${PODS_ROOT}/Headers/Public/ExpoModulesJSI"'
  }
end
