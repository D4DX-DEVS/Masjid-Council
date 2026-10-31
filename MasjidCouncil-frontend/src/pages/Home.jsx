import React from 'react';
import HomeSections from '../components/home/HomeSections';
import { useHomepageConfig } from '../lib/homepage/api';

/**
 * The public home page. What it shows — sections, order, copy, colours, fonts — comes from the
 * published Homepage Design config, laid over the built-in defaults.
 *
 * On a first visit the config is not in this browser yet, so a hero-sized placeholder holds
 * the space until it arrives rather than flashing the default copy and then swapping it.
 */
const Home = () => {
  const config = useHomepageConfig();

  if (!config) {
    return (
      <div aria-busy="true" className="h-[440px] sm:h-auto sm:aspect-[1751/826] bg-[#186b3a] animate-pulse" />
    );
  }

  return <HomeSections config={config} />;
};

export default Home;
