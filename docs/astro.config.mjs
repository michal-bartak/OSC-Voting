import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightThemeRapide from 'starlight-theme-rapide';

export default defineConfig({
  site: 'https://michal-bartak.github.io',
  base: '/OSC-Voting',
  integrations: [
    starlight({
      title: 'OSC Voting',
      description: 'Desktop voting app for the OneSynthChallenge',
      plugins: [starlightThemeRapide()],
      favicon: '/appicon.png',
      logo: {
        src: './src/assets/appicon.png',
        alt: 'OSC Voting',
        replacesTitle: false,
      },
      social: { github: 'https://github.com/michal-bartak/OSC-Voting' },
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        { label: 'Home', link: '/' },
        { label: 'Installation', link: '/installation/' },
        { label: 'Building from Source', link: '/building/' },
        { label: 'Troubleshooting', link: '/troubleshooting/' },
        { label: 'Credits', link: '/credits/' },
      ],
    }),
  ],
});
