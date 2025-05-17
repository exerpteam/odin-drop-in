# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2024-07-31

### Fixed
- Pinned OdinPay.js dependency to specific version `1.0.6` (`https://js.odinpay.net/1.0.6/index.js`) for users of `@exerp/odin-dropin` v1.x.x. This prevents the component from inadvertently loading the upcoming OdinPay.js v2.0.0 from the default CDN URL (`https://js.odinpay.net`), which would introduce breaking changes.

## [1.0.1] - YYYY-MM-DD 
