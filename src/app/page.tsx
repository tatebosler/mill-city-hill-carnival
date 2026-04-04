'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import Subtitle from './subtitle';

function getWarnings(distance: number | undefined, reps: number | undefined): string[] {
  const warnings: string[] = [];

  if (!distance || !reps) return warnings;

  if (distance < 1000 || distance > 5000) {
    warnings.push('Distance must be between 1,000m and 5,000m.');
  }
  if (distance % 100 !== 0) {
    warnings.push('Distance must be a multiple of 100m.');
  }
  if (!Number.isInteger(reps)) {
    warnings.push('Number of hills must be a positive integer.');
  }
  if (reps < 4 || reps > 30) {
    warnings.push('Number of hills must be between 4 and 30.');
  }
  if (reps > ((distance - 1000) / 100) + 4) {
    const maxReps = Math.floor(((distance - 1000) / 100) + 4);
    const minDistance = (reps - 4) * 100 + 1000;
    warnings.push(
      `This hill and distance combination is mathematically impossible. ` +
      `Decrease the hill count (to ${maxReps} or less) or increase the distance (to ${minDistance.toLocaleString()}m or more).`
    );
  }
  if (reps < Math.ceil((distance - 1000) / 400) + 4) {
    const minReps = Math.ceil((distance - 1000) / 400) + 4;
    const maxDistance = (reps - 4) * 400 + 1000;
    warnings.push(
      `This hill and distance combination is mathematically impossible. ` +
      `Increase the hill count (to ${minReps} or more) or decrease the distance (to ${maxDistance.toLocaleString()}m or less).`
    );
  }

  return warnings;
}

export default function Home() {
  const [distance, setDistance] = useState<number | undefined>();
  const [reps, setReps] = useState<number | undefined>();

  const warnings = getWarnings(distance, reps);

  return (
    <div className="text-center py-8 sm:py-24">
      <h1 className="text-3xl sm:text-6xl">Mill City Hill Carnival</h1>
      <Subtitle />

      <div className="mt-8 sm:mt-12 mx-4 sm:max-w-lg sm:mx-auto text-left grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="distance" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
            Target distance
          </label>
          <div className="mt-2">
            <div className="flex items-center rounded-md bg-white px-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 dark:bg-white/5 dark:outline-white/10 dark:focus-within:outline-indigo-500">
              <input
                id="distance"
                name="distance"
                type="number"
                max={5000}
                step={100}
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                aria-describedby="distance-unit"
                className="block min-w-0 grow bg-white py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6 dark:bg-transparent dark:text-white dark:placeholder:text-gray-500"
              />
              <div
                id="distance-unit"
                aria-label="meters"
                className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6 dark:text-gray-400"
              >
                m
              </div>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="reps" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
            Target number of hills
          </label>
          <div className="mt-2">
            <div className="flex items-center rounded-md bg-white px-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 dark:bg-white/5 dark:outline-white/10 dark:focus-within:outline-indigo-500">
              <input
                id="reps"
                name="reps"
                type="number"
                max={30}
                value={reps}
                onChange={(e) => setReps(Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                className="block min-w-0 grow bg-white py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6 dark:bg-transparent dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>

        {warnings.length > 0 && (
          <div
            role="alert"
            aria-live="polite"
            className="col-span-full"
          >
            <div className="flex gap-2 items-start text-sm text-red-600 dark:text-red-400">
              <FontAwesomeIcon
                icon={faCircleExclamation}
                aria-hidden={true}
                className="mt-0.5 size-4 shrink-0"
              />
              {warnings[0]}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
