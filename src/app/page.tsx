'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation, faArrowLeft, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import Subtitle from './subtitle';
import { MCR_PLANS } from './mcrPlans';
import WorkoutBuilder from './workout-builder';
import { doComplete, Hill } from '../lib/workoutGenerator';

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

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

type Preset = 'min' | 'mid' | 'modMore' | 'modFewer' | 'max';

export default function Home() {
  const [distance, setDistance] = useState<number | undefined>();
  const [reps, setReps] = useState<number | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [modalStep, setModalStep] = useState<1 | 2>(1);

  const warnings = getWarnings(distance, reps);
  const [chaosDialogOpen, setChaosDialogOpen] = useState(false);
  const [initialHills, setInitialHills] = useState<Hill[] | undefined>();
  const [initialHillsKey, setInitialHillsKey] = useState<string | undefined>();

  function openModal() {
    setSelectedPlanId('');
    setModalStep(1);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  const selectedPlan = MCR_PLANS.find((p) => p.id === selectedPlanId);

  function applyPreset(preset: Preset) {
    if (!selectedPlan) return;
    const { distance: dr, hills: hr } = selectedPlan.range;
    const midDistVal = roundToStep((dr.min + dr.max) / 2, 100);
    const midHillVal = (hr.min + hr.max) / 2;

    if (preset === 'min') {
      setDistance(dr.min);
      setReps(hr.min);
    } else if (preset === 'max') {
      setDistance(dr.max);
      setReps(hr.max);
    } else if (preset === 'mid') {
      setDistance(midDistVal);
      setReps(roundToStep(midHillVal, 1));
    } else if (preset === 'modMore') {
      setDistance(midDistVal);
      setReps(Math.ceil(midHillVal + 1));
    } else if (preset === 'modFewer') {
      setDistance(midDistVal);
      setReps(Math.floor(midHillVal - 1));
    }
    closeModal();
  }

  function presetValues(preset: Preset) {
    if (!selectedPlan) return { distVal: 0, hillsVal: 0 };
    const { distance: dr, hills: hr } = selectedPlan.range;
    const midDistVal = roundToStep((dr.min + dr.max) / 2, 100);
    const midHillVal = (hr.min + hr.max) / 2;

    if (preset === 'min') {
      return { distVal: dr.min, hillsVal: hr.min };
    } else if (preset === 'max') {
      return { distVal: dr.max, hillsVal: hr.max };
    } else if (preset === 'mid') {
      return { distVal: midDistVal, hillsVal: roundToStep(midHillVal, 1) };
    } else if (preset === 'modMore') {
      return { distVal: midDistVal, hillsVal: Math.ceil(midHillVal + 1) };
    } else {
      return { distVal: midDistVal, hillsVal: Math.floor(midHillVal - 1) };
    }
  }

  return (
    <div className="text-center py-8 sm:py-24">
      <h1 className="text-3xl sm:text-6xl">Mill City Hill Carnival</h1>
      <Subtitle />

      <div className="mt-8 sm:mt-12 mx-4 sm:mx-24 text-left">
        <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-end">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 grow">
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
                    value={distance ?? ''}
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
                    value={reps ?? ''}
                    onChange={(e) => setReps(Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="block min-w-0 grow bg-white py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6 dark:bg-transparent dark:text-white dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {warnings.length > 0 && (
              <div role="alert" aria-live="polite" className="col-span-full">
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

          <div className="shrink-0">
            <button
              type="button"
              onClick={openModal}
              className="cursor-pointer w-full sm:w-auto rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600"
            >
              Prefill from MCR training plans
            </button>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setChaosDialogOpen(true)}
              className="cursor-pointer w-full sm:w-auto rounded-md bg-yellow-400 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-yellow-300 focus:outline-2 focus:outline-offset-2 focus:outline-yellow-400 flex flex-row items-end gap-1 justify-center"
            >
              <span>Enable</span>
              <span className="font-serif text-xs">Total Chaos Mode</span>
            </button>
          </div>
        </div>
      </div>

      <Dialog open={modalOpen} onClose={closeModal} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/60" />
        <div className="fixed inset-x-0 top-0 flex justify-center pt-2">
          <DialogPanel className="bg-gray-700 rounded-lg p-6 mx-4 w-full max-w-sm shadow-xl text-left">
            {modalStep === 1 ? (
              <>
                <DialogTitle className="text-lg font-medium text-white mb-2">Prefill from MCR training plans</DialogTitle>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  What is your maximum weekly mileage for this training cycle?
                </label>
                <div className="flex flex-col gap-2">
                  {MCR_PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => { setSelectedPlanId(plan.id); setModalStep(2); }}
                      className="cursor-pointer w-full text-left rounded-md bg-gray-600 px-4 py-2 hover:bg-gray-500 focus:outline-2 focus:outline-indigo-500"
                    >
                      <div className="font-medium text-white">{plan.label}</div>
                    </button>
                  ))}
                </div>
                <div className="bg-indigo-900 my-2 text-sm p-2 border-l-4 border-indigo-500">
                  <p className="text-indigo-300">All race distance groups have the same workout this week!</p>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="cursor-pointer rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-500 hover:text-white flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faXmark} className="size-4" />
                    Cancel
                  </button>
                </div>
              </>
            ) : selectedPlan ? (
              <>
                <DialogTitle className="text-lg font-medium text-white mb-1">Pick your intensity</DialogTitle>
                <p className="text-sm text-gray-400 mb-2">
                  {selectedPlan.label}{' '}
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    className="cursor-pointer text-indigo-400 hover:text-indigo-300"
                  >
                    Change
                  </button>
                </p>
                <div className="bg-indigo-900 my-2 text-sm p-2 border-l-4 border-indigo-500">
                  <p className="text-indigo-300">If you&apos;re racing Goldy&apos;s this weekend, we recommend against choosing the <strong>Maximum</strong> option below.</p>
                </div>
                <div className="flex flex-col gap-2">
                  {(['min', 'modFewer', 'mid', 'modMore', 'max'] as const).map((preset) => {
                    const { distVal, hillsVal } = presetValues(preset);
                    const label = preset === 'min' ? 'Minimum' : preset === 'max' ? 'Maximum' : preset === 'mid' ? 'Medium' : preset === 'modMore' ? 'Medium - More (Shorter) Hills' : 'Medium - Fewer (Longer) Hills';
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="cursor-pointer w-full text-left rounded-md bg-gray-600 px-4 py-2 hover:bg-gray-500 focus:outline-2 focus:outline-indigo-500"
                      >
                        <div className="font-medium text-white">{label}</div>
                        <div className="text-sm text-gray-300">{distVal.toLocaleString()}m | {hillsVal} hills | avg. {Math.round((distVal / hillsVal) * 10) / 10}m per hill</div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="cursor-pointer rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-500 hover:text-white flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faXmark} className="size-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    className="cursor-pointer rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-500 hover:text-white flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="size-4" />
                    Back
                  </button>
                </div>
              </>
            ) : null}
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog open={chaosDialogOpen} onClose={() => setChaosDialogOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/60" />
        <div className="fixed inset-x-0 top-0 flex justify-center pt-2">
          <DialogPanel className="bg-yellow-100 rounded-lg p-6 mx-4 w-full max-w-sm shadow-xl text-left border-l-4 border-yellow-400">
            <DialogTitle className="text-lg font-medium text-yellow-900 mb-2">Warning: Enabling <span className="font-serif">Total Chaos Mode</span></DialogTitle>
            <p className="text-sm text-yellow-900 mb-3">
              This will build a completely random workout &mdash; between 1,200 and 3,600 meters of hills &mdash; without regard for your training plan or goals. <strong>It is not recommended. Use this at your own risk.</strong>
            </p>
            <p className="text-sm text-yellow-800 mb-4">Are you sure you want to proceed?</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setChaosDialogOpen(false)}
                className="cursor-pointer rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-500 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // pick a random distance (1200-3600, step 100)
                  const min = 1200;
                  const max = 3600;
                  const steps = Math.floor((max - min) / 100) + 1;
                  const rnd = Math.floor(Math.random() * steps);
                  const dist = min + rnd * 100;

                  // compute legal hill count bounds similar to getWarnings
                  const minReps = Math.max(4, Math.ceil((dist - 1000) / 400) + 4);
                  const maxReps = Math.min(30, Math.floor(((dist - 1000) / 100) + 4));
                  const repsVal = minReps <= maxReps ? Math.floor(Math.random() * (maxReps - minReps + 1)) + minReps : minReps;

                  // generate variety-mode hills then shuffle
                  const generated = doComplete([], dist, repsVal, 'variety');
                  for (let i = generated.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [generated[i], generated[j]] = [generated[j], generated[i]];
                  }

                  setDistance(dist);
                  setReps(repsVal);
                  setInitialHills(generated);
                  setInitialHillsKey(String(Date.now()));
                  setChaosDialogOpen(false);
                }}
                className="cursor-pointer rounded-md bg-yellow-600 px-3 py-2 text-sm font-medium text-white hover:bg-yellow-500 focus:outline-2 focus:outline-offset-2 focus:outline-yellow-600"
              >
                Proceed
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {distance && reps && warnings.length === 0 && (
        <WorkoutBuilder
          key={initialHillsKey ?? `builder-${distance}-${reps}`}
          distance={distance}
          reps={reps}
          setDistance={setDistance}
          setReps={setReps}
          initialHills={initialHills}
        />
      )}
    </div>
  );
}
