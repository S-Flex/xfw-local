module.exports = {
  packagerConfig: {
    asar: true,
    icon: './icon/sflex_logo'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-wix',
      platforms: ['win32']
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'S-Flex',
          name: 'xfw-local'
        },
        prerelease: true
      }
    }
  ],
  electronPackagerConfig: {
    wine: 'wine'
  }
};
