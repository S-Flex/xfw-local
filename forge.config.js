module.exports = {
  packagerConfig: {
    asar: true,
    icon: './icon/sflex_logo',
    extraResource: ['./ghostScript'],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO'
      }
    },
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        title: 'xfw-local',
        setupIcon: './icon/sflex_logo.ico',
        author: 'S-Flex',
        description: 'Deze applicatie maakt het mogelijk om sign-spine websites lokale taken uit te voeren zoals bestanden aanmaken, verwijderen en verplaatsen.',
      }
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      platforms: ['darwin'],
      arch: ['arm64', 'x64'],
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
