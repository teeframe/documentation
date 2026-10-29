import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Map Docs - TeeFrame",
  description: "A VitePress Site",

  srcDir: 'src',

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      // { text: 'Home', link: '/' },
      // { text: 'Examples', link: '/markdown-examples' }
    ],

    search: {
      provider: 'local',
      options: {
        miniSearch: {
        }
      },
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/teeframe/protocol-documentation' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Encoding', link: '/encoding' },
        ]
      },

      {
        text: 'Map Format',
        items: [
          { text: 'Datafile', link: '/datafile' },
          { text: 'Map Items', link: '/map-items' },
          { text: 'Layers', link: '/layers' },
          { text: 'Envelopes', link: '/envelopes' },
        ]
      },

      {
        text: 'Gameplay',
        items: [
          { text: 'Game Layer', link: '/game-layer' },
          { text: 'Collision', link: '/collision' },
        ]
      },

      {
        text: 'Implementation',
        items: [
          { text: 'Loading a Map', link: '/loading-map' },
        ]
      },
    ],
  }
})
