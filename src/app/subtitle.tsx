'use client';

import { useState } from 'react';
import { subtitleOptions, pickWeightedRandom } from './subtitle-options';

export default function Subtitle() {
  const [text] = useState(() => pickWeightedRandom(subtitleOptions));

  return <p id="subtitle" suppressHydrationWarning className="text-sm italic text-gray-300 mt-2">{text}</p>;
}
