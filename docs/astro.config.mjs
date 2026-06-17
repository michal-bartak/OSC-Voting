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
      sidebar: [
        { label: 'Home', link: '/' },
        { label: 'Installation', link: '/installation/' },
        { label: 'Building from Source', link: '/building/' },
        { label: 'Troubleshooting', link: '/troubleshooting/' },
      ],
    }),
  ],
});
