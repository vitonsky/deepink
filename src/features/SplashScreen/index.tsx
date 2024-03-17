import React from 'react';
import { cn } from '@bem-react/classname';

import './SplashScreen.css';

export const cnSplashScreen = cn('SplashScreen');

// TODO: implement splash screen
export const SplashScreen = () => {
	return <div className={cnSplashScreen({ fullscreen: true })}>Loading...</div>;
};
