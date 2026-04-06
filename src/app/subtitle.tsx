'use client';

import { useEffect, useState } from 'react';
import { subtitleOptions, pickWeightedRandom } from './subtitle-options';

export default function Subtitle() {
  const [text, setText] = useState<string>('');

  useEffect(() => {
    setText(pickWeightedRandom(subtitleOptions));
  }, []);

  return <p id="subtitle" suppressHydrationWarning className="text-sm sm:text-2xl italic text-gray-700 dark:text-gray-300 mt-2 sm:mt-4">{text}</p>;
}
