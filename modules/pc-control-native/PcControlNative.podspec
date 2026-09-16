Pod::Spec.new do |s|
  s.name           = 'PcControlNative'
  s.version        = '1.0.0'
  s.summary        = 'Native Swift module for Wake-on-LAN and PC Control'
  s.description    = 'Native Swift module providing Wake-on-LAN Magic Packet broadcasting and iOS system utilities'
  s.author         = 'Jhet'
  s.homepage       = 'https://github.com'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = 'ios/**/*.{h,m,mm,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'SWIFT_INCLUDE_PATHS' => '$(inherited) "${PODS_CONFIGURATION_BUILD_DIR}/ExpoModulesCore"',
    'HEADER_SEARCH_PATHS' => '$(inherited) "${PODS_ROOT}/Headers/Public/ExpoModulesCore"'
  }
end
